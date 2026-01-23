import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { readFile } from "node:fs/promises";

// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

const wasmBuffer = await readFile(new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEphClass(wasmModule);

// Verification with SWISS mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);
// Warmup
for(let i=0; i<100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
const start = performance.now();
const iter = 10000;
for(let i=0; i<iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
const end = performance.now();
const duration = Math.max(end - start, 0.001);
const ops = Math.floor(iter / (duration / 1000));
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(`node | wasi | js_api | swiss: Sun longitude = ${result.xx[0].toFixed(6)}°`);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
