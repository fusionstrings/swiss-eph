import { join } from "https://deno.land/std@0.212.0/path/mod.ts";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const HEADER_PATH = join(PROJECT_ROOT, "vendor/swisseph/swephexp.h");
const LIB_RS_PATH = join(PROJECT_ROOT, "crate/src/lib.rs");

async function main() {
  console.log("🔍 Verifying API Coverage...");
  console.log(`  Header: ${HEADER_PATH}`);
  console.log(`  Rust:   ${LIB_RS_PATH}`);

  const headerContent = await Deno.readTextFile(HEADER_PATH);
  const libRsContent = await Deno.readTextFile(LIB_RS_PATH);

  // --- Extract Functions ---

  // Regex for C functions: ext_def( return_type ) func_name( ...
  // Handles return types with spaces, pointers, etc.
  // ext_def( int32 ) swe_calc(
  const funcRegex = /ext_def\s*\([^)]+\)\s*(swe_\w+)/g;
  const headerFuncs = new Set<string>();

  for (const match of headerContent.matchAll(funcRegex)) {
    // Skip swe_set_timeout as it's commented out in some versions or internal
    if (match[1] === "swe_set_timeout") continue;
    headerFuncs.add(match[1]);
  }

  // Regex for Rust functions: pub fn func_name(
  const rustFuncRegex = /pub\s+fn\s+(swe_\w+)/g;
  const rustFuncs = new Set<string>();

  for (const match of libRsContent.matchAll(rustFuncRegex)) {
    rustFuncs.add(match[1]);
  }

  // --- Extract Constants ---

  // Regex for C constants: #define SE_NAME value
  // Filter out macros that look like functions or internal guards
  const constRegex = /#define\s+(SE_[A-Z0-9_]+)\s+/g;
  const headerConsts = new Set<string>();

  // Simple state machine to handle #if 0 blocks
  let inIfZero = false;

  for (const line of headerContent.split("\n")) {
    if (line.includes("#if 0")) {
      inIfZero = true;
      continue;
    }
    if (line.includes("#endif") && inIfZero) {
      inIfZero = false;
      continue;
    }
    if (inIfZero) continue;

    // Ignore commented out lines
    if (line.trim().startsWith("//")) continue;

    for (const match of line.matchAll(constRegex)) {
      const name = match[1];
      // Exclude header guards and macro helpers
      if (name === "SE_EPHE_PATH" || name.includes("_INCLUDED")) continue;
      headerConsts.add(name);
    }
  }

  // Regex for Rust constants: pub const SE_NAME
  const rustConstRegex = /pub\s+const\s+(SE_[A-Z0-9_]+)/g;
  const rustConsts = new Set<string>();

  for (const match of libRsContent.matchAll(rustConstRegex)) {
    rustConsts.add(match[1]);
  }

  // --- Compare ---

  let hasError = false;

  console.log(
    `\n📊 Functions: ${headerFuncs.size} in header, ${rustFuncs.size} in Rust`,
  );
  const missingFuncs = [...headerFuncs].filter((f) => !rustFuncs.has(f));
  if (missingFuncs.length > 0) {
    console.error("❌ Missing Functions in Rust crate:");
    missingFuncs.forEach((f) => console.error(`  - ${f}`));
    hasError = true;
  } else {
    console.log("✅ All functions exported!");
  }

  console.log(
    `\n📊 Constants: ${headerConsts.size} in header, ${rustConsts.size} in Rust`,
  );
  // Note: Rust often explicitly excludes some C-internal macros, so exact match isn't always required
  // but we want to catch important ones.
  const missingConsts = [...headerConsts].filter((c) => !rustConsts.has(c));

  // Filter out false positives (internal macros not needed in FFI)
  const ignoredConsts = new Set([
    // Internal or macro-logic related
    "SE_SIDBITS", // Often redundant or handled differently
  ]);

  const realMissingConsts = missingConsts.filter((c) => !ignoredConsts.has(c));

  if (realMissingConsts.length > 0) {
    console.error("❌ Missing Constants in Rust crate:");
    realMissingConsts.forEach((c) => console.error(`  - ${c}`));
    hasError = true;
  } else {
    console.log("✅ All constants imported!");
  }

  if (hasError) {
    Deno.exit(1);
  }
}

main();
