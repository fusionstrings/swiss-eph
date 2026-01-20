import { SwissEph } from "../../src/main.ts";
import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph = new SwissEph(wasmModule);
const results = runVerification(eph, {});
const ops = runBenchmark(eph, {});
printResults("deno", "wasi", "inline", results, ops);