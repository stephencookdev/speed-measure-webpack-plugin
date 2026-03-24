"use strict";

const { spawnSync } = require("child_process");
const { existsSync, readFileSync, readdirSync } = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const scriptName = args.find((arg) => !arg.startsWith("--"));
const matchArg = args.find((arg) => arg.startsWith("--match="));
const shouldInstall = args.includes("--install");
const match = matchArg ? matchArg.slice("--match=".length) : "";
const bunCommand = process.platform === "win32" ? "bun.exe" : "bun";
const setupsDir = path.join(__dirname, "..", "__tests__", "setups");

if (!scriptName) {
  console.error(
    "Usage: node scripts/run-setups.js <script> [--install] [--match=name]"
  );
  process.exit(1);
}

const setupDirs = readdirSync(setupsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(setupsDir, entry.name))
  .filter((dir) => existsSync(path.join(dir, "package.json")))
  .filter((dir) => !match || path.basename(dir).includes(match))
  .sort();

function readPackage(dir) {
  return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
}

function run(dir, commandArgs) {
  const result = spawnSync(bunCommand, commandArgs, {
    cwd: dir,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

setupDirs.forEach((dir) => {
  const pkg = readPackage(dir);

  if (!pkg.scripts || !pkg.scripts[scriptName]) {
    return;
  }

  console.log(`\n==> ${path.basename(dir)}`);

  if (shouldInstall) {
    run(dir, ["install"]);
  }

  run(dir, ["run", scriptName]);
});
