// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
interface WasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  swe_julday: (y: number, m: number, d: number, h: number, c: number) => number;
  swe_calc_ut: (
    jd: number,
    body: number,
    flag: number,
    xx: number,
    err: number,
  ) => number;
}

const dummyFn = (name: string) => (..._args: unknown[]) => {
  // For prestat iteration (wasi-libc startup), we MUST return 8 (EBADF)
  // to tell libc there are no more preopened files.
  if (name === "fd_prestat_get" || name === "fd_prestat_dir_name") {
    return 8; // EBADF
  }
  return 0;
};

const mock = new Proxy({}, {
  get: (_, prop) => {
    const name = String(prop);
    if (name === "proc_exit") return (_c: number) => {};
    return dummyFn(name);
  },
});
const instance = await WebAssembly.instantiate(wasmModule, {
  wasi_snapshot_preview1: mock,
  env: mock,
  wbg: mock,
  "./swiss_eph.internal.js": mock,
});
const exports = instance.exports as WasmExports;

// Direct WASM call with JPL mode
const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);
const xxPtr = exports.malloc(6 * 8);
const errPtr = exports.malloc(256);
const calcFn = exports.swe_calc_ut || exports.wasm_swe_calc_ut;
// Warmup
for (let i = 0; i < 100; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
const start = performance.now();
const iter = 10000;
for (let i = 0; i < iter; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
const end = performance.now();
const duration = Math.max(end - start, 0.001);
const ops = Math.floor(iter / (duration / 1000));
(exports.swe_calc_ut || exports.wasm_swe_calc_ut)(
  jd,
  0,
  CALC_FLAG,
  xxPtr,
  errPtr,
);
const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
console.log(
  `deno | wasi | direct_wasm | jpl: Sun longitude = ${xx[0].toFixed(6)}°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
exports.free(xxPtr);
exports.free(errPtr);
