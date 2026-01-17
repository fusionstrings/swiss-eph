import { parseMetadata } from "./metadata.ts";

const HEADER_PATH = "src/swisseph/swephexp.h";
const DEF_PATH = "src/swisseph/sweodef.h";
const WASM_PATH = "libswephe.wasm";

async function checkSymbols() {
  console.log("Gate A: Symbol Parity Check starting...");

  // 1. Get Expected Symbols from Source
  const { functions } = await parseMetadata(HEADER_PATH, DEF_PATH);
  const expectedSymbols = new Set(functions.map((f) => f.name));
  console.log(`Found ${expectedSymbols.size} functions in header.`);

  // 2. Get Actual Exports from WASM
  const wasmBytes = await Deno.readFile(WASM_PATH);
  const module = new WebAssembly.Module(wasmBytes);
  const exports = WebAssembly.Module.exports(module);
  const actualSymbols = new Set(
    exports.filter((e) => e.kind === "function").map((e) => e.name),
  );
  console.log(`Found ${actualSymbols.size} exported functions in WASM.`);

  // 3. Verify Parity
  const missing: string[] = [];
  for (const sym of expectedSymbols) {
    // Only check swe_ functions usually, but our metadata parses ext_def
    if (!actualSymbols.has(sym)) {
      // Exclude known unsupported functions in WASM
      if (sym === "swe_set_timeout") continue;

      missing.push(sym);
    }
  }

  if (missing.length > 0) {
    console.error("FAIL: Missing symbols in WASM export verify:");
    missing.forEach((s) => console.error(`  - ${s}`));
    Deno.exit(1);
  }

  console.log("SUCCESS: All expected symbols present in WASM module.");
}

if (import.meta.main) {
  await checkSymbols();
}
