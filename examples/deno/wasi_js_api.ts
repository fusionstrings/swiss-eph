import { SwissEph } from "../../src/main.ts";
import { Constants } from "../../src/generated/api.ts";
import { runVerification, printResults } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph = new SwissEph(wasmModule);
const results = runVerification(eph, Constants);
printResults("Deno", "wasi", "JS API", results);