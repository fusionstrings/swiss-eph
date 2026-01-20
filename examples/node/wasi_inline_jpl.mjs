import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { readFile } from "node:fs/promises";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;

const wasmBuffer = await readFile(new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEphClass(wasmModule);

// Verification with JPL mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(`node | wasi | inline | jpl: Sun longitude = ${result.xx[0].toFixed(6)}°`);
