import type { SwissEph } from "../../src/main.ts";
import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);
const results = runVerification(eph, {});
const ops = runBenchmark(eph, {});
printResults("deno", "wasmbuild", "inline", results, ops);
