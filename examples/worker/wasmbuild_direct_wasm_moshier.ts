// Worker example for wasmbuild | direct_wasm | moshier
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;
const wasmUrl = new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const dummyFn = () => 0;
const mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });
const instance = await WebAssembly.instantiate(wasmModule, {
  wasi_snapshot_preview1: mock,
  env: mock,
  wbg: mock,
  "./swiss_eph.internal.js": mock
});
const exports = instance.exports;
export default {
  fetch(_request: Request) {
    const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);
    const xxPtr = exports.malloc(6 * 8);
    const errPtr = exports.malloc(256);
    const calcFn = exports.swe_calc_ut || exports.wasm_swe_calc_ut;
    // Warmup
    for(let i=0; i<100; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
    const start = performance.now();
    const iter = 10000;
    for(let i=0; i<iter; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
    const end = performance.now();
    const duration = Math.max(end - start, 0.001);
    const ops = Math.floor(iter / (duration / 1000));
    calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
    const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
    const msg = `worker | wasmbuild | direct_wasm | moshier: Sun longitude = ${xx[0].toFixed(6)}°\nPerf: ${ops.toLocaleString()} ops/sec`;
    console.log(msg);
    exports.free(xxPtr); exports.free(errPtr);
    return new Response(msg);
  }
};
