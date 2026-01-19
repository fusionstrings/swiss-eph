/**
 * Deno Example: Standard API | WASI Build
 *
 * Demonstrates using the SwissEph class with an external WASM file.
 */
import { SwissEph } from "../../src/main.ts";
import { Constants } from "../../src/generated/api.ts";
import { printResults, runVerification } from "../shared/logic.ts";

// 1. Load the WASM binary or module
const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));

// 2. Instantiate using Standard API
const eph = new SwissEph(wasmModule);

// 3. Run and Print
const results = runVerification(eph, Constants);
printResults("Deno", "WASI", "Standard", results);
