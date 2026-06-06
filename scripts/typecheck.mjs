import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const localTsc = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const tsconfig = path.join(repoRoot, "tsconfig.json");
const nodeDir = path.dirname(process.execPath);
const bundledCorepack = path.join(nodeDir, "node_modules", "corepack", "dist", "lib", "corepack.cjs");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (typeof result.status === "number") {
    return result.status;
  }

  if (result.error) {
    console.error(result.error.message);
  }

  return 1;
}

if (existsSync(localTsc)) {
  process.exit(run(process.execPath, [localTsc, "--noEmit", "-p", tsconfig]));
}

const corepackHome = process.env.COREPACK_HOME || path.join(repoRoot, ".corepack");
const env = { ...process.env, COREPACK_HOME: corepackHome };

console.warn(
  `[typecheck] Local typescript not found. Falling back to corepack pnpm dlx with COREPACK_HOME=${corepackHome}`,
);

if (existsSync(bundledCorepack)) {
  process.exit(
    run(process.execPath, [bundledCorepack, "pnpm", "dlx", "--package=typescript", "tsc", "--noEmit", "-p", tsconfig], {
      env,
    }),
  );
}

process.exit(
  run("corepack", ["pnpm", "dlx", "--package=typescript", "tsc", "--noEmit", "-p", tsconfig], {
    env,
  }),
);
