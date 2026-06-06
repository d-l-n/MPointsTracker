import { defineConfig, devices } from '@playwright/test';

/**
 * Test suite optimisation strategy
 * ─────────────────────────────────
 * Tests are split into two tiers via the `grep` filter:
 *
 *  • layout  → only layout-mobile.spec.js (needs all 6 viewports)
 *  • logic   → everything else (viewport-agnostic; runs once on desktop)
 *
 * This cuts total test runs from 6 × N down to 6 × layout_tests + 1 × logic_tests,
 * eliminating ~83 % of redundant executions.
 *
 * Workers: fullyParallel lets Playwright schedule individual tests (not files)
 * across workers. Set workers to CPU count for max throughput locally; CI can
 * override with PLAYWRIGHT_WORKERS env var.
 */

const WORKERS = process.env.PLAYWRIGHT_WORKERS
  ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
  : undefined; // undefined = Playwright default (cpus/2), which auto-scales

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  fullyParallel: true,           // schedule individual tests, not whole files
  workers: WORKERS,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined,
    headless: true,
    trace: 'on-first-retry',
    storageState: undefined,
  },

  projects: [
    // ── TIER 1: Layout tests — run on every viewport ──────────────────────
    {
      name: 'mobile-small',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 375, height: 667 } },
    },
    {
      name: 'mobile-large',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 430, height: 932 } },
    },
    {
      name: 'tablet',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'foldable-open',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 717, height: 512 } },
    },
    {
      name: 'foldable-closed',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 412, height: 914 } },
    },
    {
      name: 'desktop',
      testMatch: '**/layout-mobile.spec.js',
      use: { viewport: { width: 1280, height: 800 } },
    },

    // ── TIER 1b: Legacy layout.spec.js — desktop only ────────────────────
    {
      name: 'layout-legacy',
      testMatch: '**/layout.spec.js',
      use: { viewport: { width: 1280, height: 800 } },
    },

    // ── TIER 2: Logic/E2E tests — desktop only, chromium ─────────────────
    {
      name: 'logic',
      testIgnore: ['**/layout-mobile.spec.js', '**/layout.spec.js'],
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
