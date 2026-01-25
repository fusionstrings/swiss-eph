import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WASI } from "../../src/wasi.ts";
import process from "node:process";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;
const MOSHIER_FLAG = 4;

const wasmBuffer = await readFile(
  new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url),
);
const wasmModule = await WebAssembly.compile(wasmBuffer);

const wasi = new WASI();

// --- Soundness: Mount Ephemeris Files ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const epheDir = join(__dirname, "../../crates/swiss-eph/vendor/swisseph/ephe");
const requiredFiles = ["sepl_18.se1", "seas_18.se1", "semo_18.se1"];

try {
  let filesLoaded = 0;
  for (const file of requiredFiles) {
    try {
      const data = await readFile(join(epheDir, file));
      wasi.mount(`ephe/${file}`, new Uint8Array(data));
      filesLoaded++;
    } catch {
      // ignore
    }
  }
  if (filesLoaded > 0) {
    console.log(`node | wasmbuild | direct | ${filesLoaded} files loaded.`);
  }
} catch (e) {
  console.warn("WARN: Ephemeris setup failed.", e);
}

// Instantiate with WASI imports
const imports = {
  ...wasi.imports,
  "./swiss_eph.internal.js": new Proxy({}, { get: () => () => 0 }),
};

const instance = await WebAssembly.instantiate(wasmModule, imports);
wasi.setMemory(instance.exports.memory as WebAssembly.Memory);

interface WasmExports {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  wasm_swe_julday: (
    y: number,
    m: number,
    d: number,
    h: number,
    c: number,
  ) => number;
  wasm_swe_calc_ut: (
    jd: number,
    body: number,
    flag: number,
    xx: number,
    err: number,
  ) => number;
  wasm_swe_set_ephe_path: (path: number) => void;
}
const exports = instance.exports as unknown as WasmExports;

// Helper: set ephe path via C string
function set_ephe_path(path: string) {
  const bytes = new TextEncoder().encode(path + "\0");
  const ptr = exports.malloc(bytes.length);
  const mem = new Uint8Array(exports.memory.buffer);
  mem.set(bytes, ptr);
  exports.wasm_swe_set_ephe_path(ptr);
  exports.free(ptr);
}

if (wasi.virtualFiles.size > 0) {
  set_ephe_path("ephe");
}

// ---------------------------------------------------------
// Differential Verification
// ---------------------------------------------------------

// Helper to calc for a specific flag
function calc(jd: number, flag: number): number {
  const xxPtr = exports.malloc(6 * 8);
  const errPtr = exports.malloc(256);

  exports.wasm_swe_calc_ut(jd, 0, flag, xxPtr, errPtr);

  const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
  const val = xx[0];

  exports.free(xxPtr);
  exports.free(errPtr);
  return val;
}

const jd = exports.wasm_swe_julday(2024, 6, 15, 12, 1);

const moshierVal = calc(jd, MOSHIER_FLAG);
const jplVal = calc(jd, CALC_FLAG);

if (moshierVal === jplVal) {
  console.error(
    "CRITICAL: JPL mode produced identical results to Moshier mode.",
  );
  console.error("This means ephemeris files were NOT loaded or used.");
  process.exit(1);
} else {
  console.log(
    "PASS: Direct wasmbuild JPL mode verification (JPL != Moshier).",
  );
  console.log(`      Moshier: ${moshierVal.toFixed(8)}`);
  console.log(`      JPL:     ${jplVal.toFixed(8)}`);
}

// Warmup and Benchmark
const xxPtr = exports.malloc(6 * 8);
const errPtr = exports.malloc(256);

for (let i = 0; i < 100; i++) {
  exports.wasm_swe_calc_ut(jd, 0, CALC_FLAG, xxPtr, errPtr);
}
const start = performance.now();
const iter = 10000;
for (let i = 0; i < iter; i++) {
  exports.wasm_swe_calc_ut(jd, 0, CALC_FLAG, xxPtr, errPtr);
}
const end = performance.now();
const duration = Math.max(end - start, 0.001);
const ops = Math.floor(iter / (duration / 1000));

const finalVal = new Float64Array(exports.memory.buffer, xxPtr, 1)[0];
console.log(
  `node | wasmbuild | direct_wasm | jpl: Sun longitude = ${
    finalVal.toFixed(6)
  }°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);

exports.free(xxPtr);
exports.free(errPtr);
