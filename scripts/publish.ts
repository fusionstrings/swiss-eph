/**
 * Publishing automation script.
 *
 * Usage:
 *   deno run -A scripts/publish.ts [semver_version]
 *
 * Steps:
 * 1. Checks for clean git status (no uncommitted changes).
 * 2. Runs full test suite.
 * 3. Publishes to JSR (dry-run by default unless --real flag is used).
 */

import { parseArgs } from "@std/cli/parse-args";

const flags = parseArgs(Deno.args, {
  boolean: ["dry-run", "real"],
  default: { "dry-run": true },
});

const version = Deno.args[0];
if (!version || version.startsWith("-")) {
  console.error("Usage: deno run -A scripts/publish.ts <version> [--real]");
  console.log("Example: deno run -A scripts/publish.ts 0.1.0");
  Deno.exit(1);
}

// 0. Ensure git is clean
console.log("🔍 Checking git status...");
const gitStatus = new Deno.Command("git", {
  args: ["status", "--porcelain"],
});
const { stdout } = await gitStatus.output();
if (stdout.length > 0) {
  console.error(
    "❌ Git working directory is not clean. Commit or stash changes first.",
  );
  const output = new TextDecoder().decode(stdout);
  console.log(output);
  Deno.exit(1);
}
console.log("✅ Git status clean.");

// 1. Run Tests
console.log("\n🧪 Running tests...");
const testCmd = new Deno.Command("deno", {
  args: ["task", "test"],
  stdout: "inherit",
  stderr: "inherit",
});
const testResult = await testCmd.output();
if (!testResult.success) {
  console.error("❌ Tests failed. Aborting publish.");
  Deno.exit(1);
}
console.log("✅ Tests passed.");

// 2. Publish to JSR
console.log("\n🚀 Publishing to JSR...");
const jsrArgs = ["publish"];
if (!flags.real) {
  console.log("   (Dry Run)");
  jsrArgs.push("--dry-run");
}
const jsrCmd = new Deno.Command("deno", {
  args: jsrArgs,
  stdout: "inherit",
  stderr: "inherit",
});
const jsrResult = await jsrCmd.output();
if (!jsrResult.success) {
  console.error("❌ JSR publish failed.");
  Deno.exit(1);
}

console.log("\n🎉 Publishing check complete!");
if (!flags.real) {
  console.log("ℹ️  This was a DRY RUN. Use --real to actually publish.");
} else {
  console.log("✅ Successfully published version " + version);
}
