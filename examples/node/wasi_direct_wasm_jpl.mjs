import { readFile } from "node:fs/promises";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

const wasmBuffer = await readFile(new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const dummyFn = () => 0;
const mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });
const instance = await WebAssembly.instantiate(wasmModule, {
  wasi_snapshot_preview1: mock,
  env: mock,
  wbg: mock,
  "./swiss_eph.internal.js": mock
});
const exports = (instance.instance || instance).exports;

// Direct WASM call with JPL mode
const jd = exports.swe_julday(2024, 6, 15, 12, 1);
const xxPtr = exports.malloc(6 * 8);
const errPtr = exports.malloc(256);
exports.swe_calc_ut(jd, 0, CALC_FLAG, xxPtr, errPtr);
const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
console.log(`node | wasi | direct_wasm | jpl: Sun longitude = ${xx[0].toFixed(6)}°`);
exports.free(xxPtr); exports.free(errPtr);
