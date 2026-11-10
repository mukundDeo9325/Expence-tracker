#!/usr/bin/env node
/*
 * Install guard, wired up in package.json as:
 *   "preinstall": "./scripts/cmd-guard.js --preinstall"
 *
 * This project is locked with yarn.lock, so dependencies must be installed with
 * yarn. Running `npm install` or `pnpm install` would ignore the lock file and
 * pull different versions. Set ALLOW_NON_YARN=1 to skip the check.
 */
const args = process.argv.slice(2);

if (args.includes("--preinstall")) {
  const execPath = process.env.npm_execpath || "";
  const userAgent = process.env.npm_config_user_agent || "";
  const usingYarn = execPath.includes("yarn") || userAgent.startsWith("yarn/");

  if (!usingYarn && process.env.ALLOW_NON_YARN !== "1") {
    console.error("\nThis project uses yarn. Please run `yarn install` instead.");
    console.error("(Set ALLOW_NON_YARN=1 to bypass this check.)\n");
    process.exit(1);
  }
}
