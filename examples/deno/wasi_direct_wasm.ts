import { printResults } from "../shared/logic.ts";

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const instance = await WebAssembly.instantiate(wasmModule, { wasi_snapshot_preview1: { proc_exit: () => {}, fd_write: () => 0 }, env: { memory: new WebAssembly.Memory({ initial: 256 }) } });
const exports = instance.exports as any;
printResults("Deno", "wasi", "Direct WASM", { jd: exports.swe_julday(2024, 6, 15, 12, 1), sun: { longitude: 0 }, ascmc: [0, 0] });