/**
 * Deno Example: Platform-Native | WASI Build
 *
 * Demonstrates using Deno's built-in WASI support for low-level integration.
 */
import Context from "https://deno.land/std@0.200.0/wasi/snapshot_preview1.ts";
import { printResults } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmBuffer = await Deno.readFile(wasmUrl);
const wasmModule = await WebAssembly.compile(wasmBuffer);

// 1. Setup Deno-Native WASI Context
const wasi = new Context({
  args: Deno.args,
  env: Deno.env.toObject(),
  preopens: {
    ".": "./",
  },
});

// 2. Instantiate with Native WASI
const instance = await WebAssembly.instantiate(wasmModule, {
  wasi_snapshot_preview1: wasi.exports,
});

// 3. Initialize
// wasi.start(instance); // For _start
wasi.initialize(instance); // For libraries

const exports = instance.exports as any;
console.log("Deno-Native WASI initialized.");
printResults("Deno", "WASI", "Native", {
  jd: exports.swe_julday(2024, 6, 15, 12, 1),
  sun: { longitude: 0 },
  ascmc: [0, 0],
});
