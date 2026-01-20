import type { SwissEph } from "@fusionstrings/swiss-eph/wasi";
import { SwissEph as SwissEphClass } from "@fusionstrings/swiss-eph/wasi";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);

// Verification with JPL mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(`deno | wasi | js_api | jpl: Sun longitude = ${result.xx[0].toFixed(6)}°`);
