/**
 * WASM Inspection Utility
 *
 * Inspects the Swiss Ephemeris WASM module to list exports and imports.
 * Useful for debugging and verifying the build output.
 *
 * Usage:
 *   deno run -A scripts/inspect_wasm.ts [path-to-wasm]
 */

const WASM_PATHS = [
  "lib/wasm/swiss_eph.wasm",
  "lib/wasi/swiss_eph.wasm",
];

const wasmPath = Deno.args[0] ?? WASM_PATHS.find((p) => {
  try {
    Deno.statSync(p);
    return true;
  } catch {
    return false;
  }
});

if (!wasmPath) {
  console.error(
    "No WASM file found. Build first with: deno task build:wasmbuild",
  );
  Deno.exit(1);
}

console.log(`Inspecting: ${wasmPath}\n`);

const wasm = await Deno.readFile(wasmPath);
const module = new WebAssembly.Module(wasm);

const allExports = WebAssembly.Module.exports(module);
const functionExports = allExports.filter((e) => e.kind === "function");
const sweExports = functionExports.filter((e) =>
  e.name.includes("swe") || e.name === "malloc" || e.name === "free"
);

console.log(`Total exports: ${allExports.length}`);
console.log(`Function exports: ${functionExports.length}`);
console.log(`Swiss Eph exports: ${sweExports.length}`);

console.log("\n--- Swiss Eph Exports ---");
sweExports.forEach((e) => console.log(`  ${e.name}`));

const imports = WebAssembly.Module.imports(module);
console.log(`\n--- Imports (${imports.length}) ---`);
imports.forEach((imp) =>
  console.log(`  ${imp.module}.${imp.name} (${imp.kind})`)
);
