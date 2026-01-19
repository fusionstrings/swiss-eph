/**
 * Deno Example: Raw WebAssembly | WASI Build
 *
 * Demonstrates manual instantiation and imports for the WASI version.
 */
import { Constants } from "../../src/generated/api.ts";
import { printResults } from "../shared/logic.ts";

// 1. Prepare WASI imports (Deno version)
// Note: This is what SwissEph class does internally.
const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));

const imports = {
  wasi_snapshot_preview1: {
    proc_exit: (status: number) => Deno.exit(status),
    fd_write: () => 0,
    // Add other stubs as needed or use a WASI polyfill
  },
  env: {
    // Standard C library stubs if needed by this specific WASM build
    memory: new WebAssembly.Memory({ initial: 256 }),
  },
};

// 2. Manual Instantiation
// In a real raw usage, the user would provide full WASI polyfills.
// Here we show it's possible but complex.
const instance = await WebAssembly.instantiate(wasmModule, imports);
const exports = instance.exports as any;

// 3. Mock the SwissEph interface for the shared logic
const ephMock = {
  swe_julday: (y: number, m: number, d: number, h: number, f: number) =>
    exports.swe_julday(y, m, d, h, f),
  swe_calc_ut: (jd: number, ipl: number, iflag: number) => {
    // Raw buffers would be needed here, showing why SwissEph class is preferred!
    return {
      xx: [0, 0, 0, 0],
      error: "Raw access requires manual heap management",
    };
  },
  swe_houses: () => ({
    cusps: new Float64Array(13),
    ascmc: new Float64Array(10),
  }),
};

console.log("Raw instantiation successful!");
printResults("Deno", "WASI", "Raw", {
  jd: exports.swe_julday(2024, 6, 15, 12, 1),
  sun: { longitude: 0 },
  ascmc: [0, 0],
});
