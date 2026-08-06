import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const nodeBin = process.execPath;
const viteBin = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
const vitestBin = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");
const playwrightCli = path.join(repoRoot, "node_modules", "playwright", "cli.js");
const typecheckScript = path.join(repoRoot, "scripts", "typecheck.mjs");
const outputRoot = path.join(repoRoot, "test-results", "local-verify");
const baseUrl = "http://127.0.0.1:4173";
const localBrowserChannel = "msedge";
const browserSuites = [
  "tests/settings-accessibility.spec.js",
  "tests/champions.spec.js",
  "tests/reusable-switches.spec.js",
];
const contractSuites = ["tests/reusable-switches.spec.js"];

function ensureExists(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function formatCommand(args) {
  return `node ${args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(" ")}`;
}

function summarizeOutput(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "No output captured";
}

function runNodeStep(name, args, { env = {}, allowPlaywrightBlock = false } = {}) {
  console.log(`\n== ${name} ==`);
  console.log(`> ${formatCommand(args)}`);

  const result = spawnSync(nodeBin, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  if (result.status === 0) {
    return { name, status: "passed" };
  }

  if (allowPlaywrightBlock && /spawn EPERM/i.test(output)) {
    console.warn(`[verify-local] ${name} blocked by local Playwright launch limitation (spawn EPERM).`);
    return {
      name,
      status: "blocked",
      detail: "Playwright could not launch Chromium on this machine (spawn EPERM).",
    };
  }

  return {
    name,
    status: "failed",
    exitCode: result.status ?? 1,
    detail: summarizeOutput(output),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, child, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Preview server exited early with code ${child.exitCode}.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Retry until timeout.
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for preview server at ${url}.`);
}

async function withPreviewServer(task) {
  console.log(`\n== Preview Server ==`);
  console.log(`> ${formatCommand([viteBin, "preview", "--host", "127.0.0.1", "--port", "4173"])}`);

  const child = spawn(nodeBin, [viteBin, "preview", "--host", "127.0.0.1", "--port", "4173"], {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer(baseUrl, child);
    return await task();
  } finally {
    if (child.exitCode === null) {
      child.kill();
      await sleep(500);
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }
  }
}

async function main() {
  ensureExists(viteBin, "Vite CLI");
  ensureExists(vitestBin, "Vitest CLI");
  ensureExists(playwrightCli, "Playwright CLI");
  ensureExists(typecheckScript, "typecheck script");

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl,
    steps: [],
  };

  const steps = [
    runNodeStep("Typecheck", [typecheckScript]),
    runNodeStep("Build", [viteBin, "build"]),
    runNodeStep("Vitest", [vitestBin, "run"]),
    runNodeStep(
      "Playwright contract suite",
      [playwrightCli, "test", "--project=logic", "--workers=1", `--output=${path.join(outputRoot, "contracts")}`, ...contractSuites],
    ),
  ];

  summary.steps.push(...steps);

  const firstFailure = summary.steps.find((step) => step.status === "failed");
  if (firstFailure) {
    await writeFile(path.join(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));
    console.error(`\n[verify-local] Stopped after ${firstFailure.name}: ${firstFailure.detail}`);
    process.exit(firstFailure.exitCode || 1);
  }

  const browserStep = await withPreviewServer(async () => {
    const edgeAttempt = runNodeStep(
      "Playwright browser suite",
      [playwrightCli, "test", "--project=logic", "--workers=1", `--output=${path.join(outputRoot, "browser")}`, ...browserSuites],
      {
        env: {
          PLAYWRIGHT_BASE_URL: baseUrl,
          PLAYWRIGHT_CHROMIUM_CHANNEL: localBrowserChannel,
        },
        allowPlaywrightBlock: true,
      },
    );

    if (edgeAttempt.status !== "blocked") {
      return edgeAttempt;
    }

    console.warn("[verify-local] Edge launch was blocked locally. Retrying with bundled Chromium as a secondary fallback.");
    const chromiumAttempt = runNodeStep(
      "Playwright browser suite (Chromium fallback)",
      [playwrightCli, "test", "--project=logic", "--workers=1", `--output=${path.join(outputRoot, "browser-edge")}`, ...browserSuites],
      {
        env: {
          PLAYWRIGHT_BASE_URL: baseUrl,
        },
        allowPlaywrightBlock: true,
      },
    );

    if (chromiumAttempt.status === "passed") {
      return {
        name: "Playwright browser suite",
        status: "passed",
        detail: "Passed on bundled Chromium fallback after Edge could not launch locally.",
      };
    }

    if (chromiumAttempt.status === "blocked") {
      return {
        name: "Playwright browser suite",
        status: "blocked",
        detail: "Edge and bundled Chromium both failed to launch locally.",
      };
    }

    return chromiumAttempt;
  });

  summary.steps.push(browserStep);
  await writeFile(path.join(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`\nSummary:`);
  for (const step of summary.steps) {
    console.log(`- ${step.name}: ${step.status}${step.detail ? ` (${step.detail})` : ""}`);
  }
  console.log(`- Summary file: ${path.join(outputRoot, "summary.json")}`);

  const failed = summary.steps.find((step) => step.status === "failed");
  if (failed) {
    process.exit(failed.exitCode || 1);
  }

  if (browserStep.status === "blocked") {
    console.warn("\n[verify-local] Typecheck, build, and browserless contracts passed. Browser E2E was explicitly blocked by local Playwright launch permissions.");
  }
}

main().catch(async (error) => {
  console.error(`\n[verify-local] ${error instanceof Error ? error.message : String(error)}`);
  await mkdir(outputRoot, { recursive: true }).catch(() => {});
  await writeFile(
    path.join(outputRoot, "summary.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        baseUrl,
        steps: [],
        fatalError: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  ).catch(() => {});
  process.exit(1);
});
