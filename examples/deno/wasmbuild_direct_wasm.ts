import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
interface WasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  free: (ptr: number) => void;
  swe_julday: (y: number, m: number, d: number, h: number, c: number) => number;
  swe_calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;
  wasm_swe_calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;
  calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;
  swe_houses: (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;
  wasm_swe_houses: (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;
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

// Minimal wrapper for direct WASM to handle memory
const memory = exports.memory;
const ephWrapper = {
  swe_julday: (exports.swe_julday || (exports as unknown as Record<string, (a: unknown) => unknown>).wasm_swe_julday).bind(exports) as (y: number, m: number, d: number, h: number, c: number) => number,
  swe_calc_ut: (jd: number, body: number, flag: number) => {
    const fn = (exports.swe_calc_ut || exports.wasm_swe_calc_ut || exports.calc_ut) as (jd: number, body: number, flag: number, xx: number, err: number) => number;
    const xxPtr = exports.malloc(6 * 8);
    const errPtr = exports.malloc(256);
    fn(jd, body, flag, xxPtr, errPtr);
    const xx = new Float64Array(memory.buffer, xxPtr, 6).slice();
    exports.free(xxPtr); exports.free(errPtr);
    return { xx, error: "" };
  },
  swe_houses: (jd: number, lat: number, lon: number, hsys: number) => {
    const fn = (exports.swe_houses || exports.wasm_swe_houses) as (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;
    const cuspsPtr = exports.malloc(13 * 8);
    const ascmcPtr = exports.malloc(10 * 8);
    fn(jd, lat, lon, hsys, cuspsPtr, ascmcPtr);
    const cusps = new Float64Array(memory.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(memory.buffer, ascmcPtr, 10).slice();
    exports.free(cuspsPtr); exports.free(ascmcPtr);
    return { cusps, ascmc };
  }
};
const results = runVerification(ephWrapper as unknown as SwissEphClass, {});
const ops = runBenchmark(ephWrapper as unknown as SwissEphClass, {});
printResults("deno", "wasmbuild", "direct_wasm", results, ops);
