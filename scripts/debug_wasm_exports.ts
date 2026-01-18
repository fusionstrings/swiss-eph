import { promises as fs } from "node:fs";

const wasmPath = "lib/wasi/swiss_eph.wasm";

async function run() {
  console.log(`Inspecting ${wasmPath}...`);
  const buffer = await fs.readFile(wasmPath);
  const module = await WebAssembly.compile(buffer);
  const exports = WebAssembly.Module.exports(module);

  console.log("Exports found:", exports.length);
  const names = exports.map((e) => e.name).sort();
  console.log(names.join("\n"));

  if (names.includes("swe_julday")) console.log("\nFOUND: swe_julday");
  else if (names.includes("julday")) {
    console.log("\nFOUND: julday (will be normalized)");
  } else console.log("\nMISSING: swe_julday");
}

run();
