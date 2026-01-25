// Worker example for wasi | inline | moshier
// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;
import { SwissEph } from "../../src/main.ts";
const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph = new SwissEph(wasmModule);
export default {
  fetch(_request: Request) {
    const jd = eph.swe_julday(2024, 6, 15, 12, 1);
    // Warmup
    for(let i=0; i<100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
    const start = performance.now();
    const iter = 10000;
    for(let i=0; i<iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
    const end = performance.now();
    const duration = Math.max(end - start, 0.001);
    const ops = Math.floor(iter / (duration / 1000));
    const result = eph.swe_calc_ut(jd, 0, CALC_FLAG);
    const msg = `worker | wasi | inline | moshier: Sun longitude = ${result.xx[0].toFixed(6)}°\nPerf: ${ops.toLocaleString()} ops/sec`;
    console.log(msg);
    return new Response(msg);
  }
};
