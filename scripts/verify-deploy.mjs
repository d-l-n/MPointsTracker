#!/usr/bin/env node
/**
 * verify-deploy.mjs — Post-deploy sanity check for MPoints Tracker.
 *
 * Verifies that the deployed index.html references the built bundle (/assets/*)
 * and NOT the raw source entry (/src/main.tsx). A deployment that serves the
 * source index.html (empty build command / wrong output directory) breaks the
 * app for every user with the boot error screen.
 *
 * Usage:
 *   node scripts/verify-deploy.mjs [--url URL] [--commit SHA] [--wait SECONDS] [--project NAME]
 *
 * Environment:
 *   DEPLOY_URL            base URL to check (default: https://mpoints-tracker.pages.dev/)
 *   CLOUDFLARE_API_TOKEN  optional — enables commit-aware waiting for the deployment
 *   CLOUDFLARE_ACCOUNT_ID required if CLOUDFLARE_API_TOKEN is set
 *   CF_PAGES_PROJECT      Pages project name (default: mpoints-tracker)
 *
 * Exit codes: 0 = OK, 1 = verification failed, 2 = bad usage / unexpected error.
 */
import { pathToFileURL } from "node:url";

export const DEFAULT_URL = "https://mpoints-tracker.pages.dev/";
export const DEFAULT_PROJECT = "mpoints-tracker";
const DEFAULT_WAIT_MS = 5 * 60 * 1000; // deployment build budget
const URL_POLL_MS = 10 * 1000;
const URL_POLL_AFTER_DEPLOY_MS = 90 * 1000; // CDN propagation budget after a successful deploy

export const SOURCE_ENTRY_PATTERN = /src=["']\/src\/main\.tsx["']/;
export const BUILT_BUNDLE_PATTERN = /src=["']\/assets\/[^"']+\.js["']/;

// Analiza el index.html servido: ¿es el build compilado o el source?
export function analyzeIndexHtml(html) {
  if (SOURCE_ENTRY_PATTERN.test(html)) {
    return {
      ok: false,
      reason:
        "index.html references the raw source entry /src/main.tsx — the deploy is serving the repo root instead of the built output (check the build command / output directory in the Pages project).",
    };
  }
  const builtBundles = html.match(BUILT_BUNDLE_PATTERN) || [];
  if (builtBundles.length === 0) {
    return {
      ok: false,
      reason: "index.html has no module script pointing to /assets/*.js — the build output was not deployed.",
    };
  }
  return { ok: true, builtBundles };
}

// Descarga el index.html con cache-buster para saltar el edge cache.
export async function fetchIndexHtml(url) {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}cb=${Date.now()}`, {
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.text();
}

export async function checkDeployment(url) {
  const html = await fetchIndexHtml(url);
  return analyzeIndexHtml(html);
}

// Espera a que el deployment del commit indicado termine (Cloudflare API).
async function waitForDeploymentStatus({ commit, token, accountId, project, waitMs }) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}/deployments?per_page=25`;
  const deadline = Date.now() + waitMs;
  let lastError = "deployment not found";

  while (Date.now() < deadline) {
    let deployments;
    try {
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(JSON.stringify(json.errors));
      deployments = json.result || [];
    } catch (err) {
      lastError = `API error: ${err.message}`;
      await sleep(URL_POLL_MS);
      continue;
    }

    const match = deployments
      .filter((d) => (d.deployment_trigger?.metadata?.commit_hash || "").startsWith(commit))
      .sort((a, b) => (a.created_on < b.created_on ? 1 : -1))[0];

    if (!match) {
      lastError = `no deployment found for commit ${commit} yet`;
      await sleep(URL_POLL_MS);
      continue;
    }

    const stage = match.latest_stage || {};
    if (stage.status === "success") return match;
    if (stage.status === "failure") {
      const dash = accountId
        ? `https://dash.cloudflare.com/${accountId}/pages/view/${project}/${match.id}`
        : `deployment ${match.id}`;
      throw new Error(`Deployment of ${commit} FAILED at stage "${stage.name}" — see ${dash}`);
    }
    await sleep(URL_POLL_MS);
  }
  throw new Error(`Timed out waiting for deployment of ${commit}: ${lastError}`);
}

// Sondea el index.html servido hasta que pase la verificación o se agote el tiempo.
async function pollUrl(url, budgetMs) {
  const deadline = Date.now() + budgetMs;
  let lastResult = null;
  while (Date.now() < deadline) {
    try {
      lastResult = await checkDeployment(url);
      if (lastResult.ok) return lastResult;
    } catch (err) {
      lastResult = { ok: false, reason: err.message };
    }
    if (Date.now() >= deadline) break;
    await sleep(URL_POLL_MS);
  }
  return lastResult;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = {
    url: process.env.DEPLOY_URL || DEFAULT_URL,
    commit: null,
    project: process.env.CF_PAGES_PROJECT || DEFAULT_PROJECT,
    waitMs: DEFAULT_WAIT_MS,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--url") args.url = argv[++i];
    else if (flag === "--commit") args.commit = argv[++i];
    else if (flag === "--project") args.project = argv[++i];
    else if (flag === "--wait") {
      const secs = Number(argv[++i]);
      args.waitMs = Number.isFinite(secs) && secs > 0 ? secs * 1000 : DEFAULT_WAIT_MS;
    }
    else if (flag === "--help") args.help = true;
  }
  return args;
}

const HELP_TEXT = `verify-deploy.mjs — checks that the deployed index.html references the built bundle.

Usage:
  node scripts/verify-deploy.mjs [--url URL] [--commit SHA] [--wait SECONDS] [--project NAME]

Options:
  --url URL       base URL to verify (default: $DEPLOY_URL or ${DEFAULT_URL})
  --commit SHA    wait for this commit's deployment to finish first (requires Cloudflare API token)
  --wait SECONDS  total wait budget for the deployment/URL (default: 300)
  --project NAME  Cloudflare Pages project name (default: ${DEFAULT_PROJECT})
  --help          show this help

Environment:
  CLOUDFLARE_API_TOKEN   needed for --commit (also used by the npm run verify:deploy hook)
  CLOUDFLARE_ACCOUNT_ID  needed for --commit
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP_TEXT);
    return 0;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (args.commit) {
    if (token && accountId) {
      console.log(`[verify-deploy] Waiting for deployment of ${args.commit.slice(0, 7)} (${args.project})...`);
      await waitForDeploymentStatus({ commit: args.commit, token, accountId, project: args.project, waitMs: args.waitMs });
      console.log("[verify-deploy] Deployment succeeded. Verifying served index.html...");
      const result = await pollUrl(args.url, URL_POLL_AFTER_DEPLOY_MS);
      if (!result.ok) {
        console.error(`[verify-deploy] FAIL: ${result.reason}\n  url: ${args.url}`);
        return 1;
      }
      console.log(`[verify-deploy] OK — serving built bundle: ${result.builtBundles[0]}`);
      return 0;
    }
    console.warn("[verify-deploy] CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID not set — skipping commit-aware wait, checking the URL directly.");
  }

  const result = await pollUrl(args.url, args.waitMs);
  if (!result.ok) {
    console.error(`[verify-deploy] FAIL: ${result.reason}\n  url: ${args.url}`);
    return 1;
  }
  console.log(`[verify-deploy] OK — serving built bundle: ${result.builtBundles[0]}`);
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  // Evitamos process.exit() directo: en Windows/Node 24 puede crashear con un
  // assert de libuv si hay sockets keep-alive de fetch todavía abiertos.
  // Seteamos process.exitCode y dejamos que el loop cierre naturalmente; un
  // timer .unref() fuerza la salida si algo quedara colgado.
  const finish = (code) => {
    process.exitCode = code;
    setTimeout(() => process.exit(process.exitCode), 1500).unref();
  };
  main()
    .then(finish)
    .catch((err) => {
      console.error(`[verify-deploy] ERROR: ${err instanceof Error ? err.message : String(err)}`);
      finish(2);
    });
}
