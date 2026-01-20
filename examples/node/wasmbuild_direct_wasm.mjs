import { readFile } from "node:fs/promises";
import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";

const wasmBuffer = await readFile(new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url));
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

// Minimal wrapper for direct WASM to handle memory
const memory = exports.memory;
const ephWrapper = {
  swe_julday: (exports.swe_julday || exports.wasm_swe_julday).bind(exports),
  swe_calc_ut: (jd, body, flag) => {
    const fn = (exports.swe_calc_ut || exports.wasm_swe_calc_ut || exports.calc_ut);
    const xxPtr = exports.malloc(6 * 8);
    const errPtr = exports.malloc(256);
    fn(jd, body, flag, xxPtr, errPtr);
    const xx = new Float64Array(memory.buffer, xxPtr, 6).slice();
    exports.free(xxPtr); exports.free(errPtr);
    return { xx, error: "" };
  },
  swe_houses: (jd, lat, lon, hsys) => {
    const fn = (exports.swe_houses || exports.wasm_swe_houses);
    const cuspsPtr = exports.malloc(13 * 8);
    const ascmcPtr = exports.malloc(10 * 8);
    fn(jd, lat, lon, hsys, cuspsPtr, ascmcPtr);
    const cusps = new Float64Array(memory.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(memory.buffer, ascmcPtr, 10).slice();
    exports.free(cuspsPtr); exports.free(ascmcPtr);
    return { cusps, ascmc };
  }
};
const results = runVerification(ephWrapper, {});
const ops = runBenchmark(ephWrapper, {});
printResults("node", "wasmbuild", "direct_wasm", results, ops);
