import { SwissEph } from "../../src/main.ts";
import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";
import fs from "fs/promises";

const wasmBuffer = await fs.readFile(new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url));
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEph(wasmModule);
const results = runVerification(eph, {});
const ops = runBenchmark(eph, {});
printResults("node", "wasi", "js_api", results, ops);