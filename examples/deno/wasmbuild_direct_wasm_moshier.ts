
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;

const wasmUrl = new URL("@fusionstrings/swiss-eph/wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
interface WasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  swe_julday: (y: number, m: number, d: number, h: number, c: number) => number;
  swe_calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;
}

const dummyFn = () => 0;
const mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });
const instance = await WebAssembly.instantiate(wasmModule, {
  wasi_snapshot_preview1: mock,
  env: mock,
  wbg: mock,
  "./swiss_eph.internal.js": mock
});
const exports = (instance.instance || instance).exports as WasmExports;

// Direct WASM call with MOSHIER mode
const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);
const xxPtr = exports.malloc(6 * 8);
const errPtr = exports.malloc(256);
(exports.swe_calc_ut || exports.wasm_swe_calc_ut)(jd, 0, CALC_FLAG, xxPtr, errPtr);
const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
console.log(`deno | wasmbuild | direct_wasm | moshier: Sun longitude = ${xx[0].toFixed(6)}°`);
exports.free(xxPtr); exports.free(errPtr);
