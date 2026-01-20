import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { readFile } from "node:fs/promises";

// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

const wasmBuffer = await readFile(new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEphClass(wasmModule);

// Verification with SWISS mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(`node | wasmbuild | inline | swiss: Sun longitude = ${result.xx[0].toFixed(6)}°`);
