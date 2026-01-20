import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { readFile } from "node:fs/promises";
import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";

const wasmBuffer = await readFile(new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEphClass(wasmModule);
const results = runVerification(eph, {});
const ops = runBenchmark(eph, {});
printResults("node", "wasmbuild", "js_api", results, ops);
