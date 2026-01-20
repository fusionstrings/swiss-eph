import type { SwissEph } from "@fusionstrings/swiss-eph";
import { SwissEph as SwissEphClass } from "@fusionstrings/swiss-eph";

// Ephemeris Mode: MOSHIER (flag: 4)
const CALC_FLAG = 4;

const wasmUrl = new URL("@fusionstrings/swiss-eph/wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);

// Verification with MOSHIER mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(`deno | wasmbuild | js_api | moshier: Sun longitude = ${result.xx[0].toFixed(6)}°`);
