/**
 * Symbol Parity Check
 *
 * Verifies that all Swiss Ephemeris functions defined in the C headers
 * are properly exported from the WASM module. This ensures the build is
 * complete and all bindings are functional.
 *
 * Usage:
 *   deno run -A scripts/check_symbols.ts
 */

import { parseMetadata } from "./metadata.ts";

const HEADER_PATH = "vendor/swisseph/swephexp.h";
const DEF_PATH = "vendor/swisseph/sweodef.h";
const WASM_PATHS = [
  "lib/wasm/swiss_eph.wasm",
  "lib/wasi/swiss_eph.wasm",
];

// Functions known to not be supported in WASM (e.g., threading, filesystem callbacks)
const KNOWN_UNSUPPORTED = new Set([
  "swe_set_timeout",
]);

async function checkSymbols(): Promise<void> {
  console.log("Symbol Parity Check starting...\n");

  // 1. Get Expected Symbols from C Source Headers
  const { functions } = await parseMetadata(HEADER_PATH, DEF_PATH);
  const expectedSymbols = new Set(functions.map((f) => f.name));
  console.log(`Found ${expectedSymbols.size} functions in header.`);

  // 2. Find WASM file
  const wasmPath = WASM_PATHS.find((p) => {
    try {
      Deno.statSync(p);
      return true;
    } catch {
      return false;
    }
  });

  if (!wasmPath) {
    console.error(
      "❌ No WASM file found. Build first with: deno task build:wasmbuild",
    );
    Deno.exit(1);
  }

  console.log(`Checking: ${wasmPath}`);

  // 3. Get Actual Exports from WASM
  const wasmBytes = await Deno.readFile(wasmPath);
  const module = new WebAssembly.Module(wasmBytes);
  const exports = WebAssembly.Module.exports(module);
  const actualSymbols = new Set(
    exports.filter((e) => e.kind === "function").map((e) => e.name),
  );
  console.log(`Found ${actualSymbols.size} exported functions in WASM.\n`);

  // 4. Verify Parity
  const missing: string[] = [];
  const present: string[] = [];

  for (const sym of expectedSymbols) {
    // Skip known unsupported functions
    if (KNOWN_UNSUPPORTED.has(sym)) {
      continue;
    }

    // Check for various naming conventions:
    // - swe_calc (original)
    // - calc (wasmbuild may strip prefix)
    // - wasm_swe_calc (wrapper prefix)
    const found = actualSymbols.has(sym) ||
      actualSymbols.has(sym.replace("swe_", "")) ||
      actualSymbols.has(`wasm_${sym}`);

    if (found) {
      present.push(sym);
    } else {
      missing.push(sym);
    }
  }

  console.log(
    `✅ Present: ${present.length}/${
      expectedSymbols.size - KNOWN_UNSUPPORTED.size
    }`,
  );

  if (missing.length > 0) {
    console.error(`\n❌ Missing ${missing.length} symbols:`);
    missing.forEach((s) => console.error(`   - ${s}`));
    Deno.exit(1);
  }

  console.log("\n✅ SUCCESS: All expected symbols present in WASM module.");
}

if (import.meta.main) {
  await checkSymbols();
}
