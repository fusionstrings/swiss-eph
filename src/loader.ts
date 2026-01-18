import { SwissEph } from "./main.ts";
import { WASI } from "./wasi.ts";

// Load the WASI binary relative to this module in the published package
// Note: In JSR published package, lib/wasi/ is sibling to src/
const WASM_URL = new URL("../lib/wasi/swiss_eph.wasm", import.meta.url);

export async function instantiate(): Promise<SwissEph> {
  const wasmModule = await WebAssembly.compileStreaming(fetch(WASM_URL));

  const wasi = new WASI();
  const imports = {
    wasi_snapshot_preview1: wasi.imports.wasi_snapshot_preview1,
  };

  const instance = await WebAssembly.instantiate(wasmModule, imports);

  // Initialize WASI with memory
  wasi.setMemory(instance.exports.memory as WebAssembly.Memory);

  // Check if _initialize exists (reactor model) or _start (command model)
  // WASI SDK usually exports _initialize for libraries
  const exports = instance.exports as Record<string, () => void>;
  if (exports._initialize) {
    exports._initialize();
  } else if (exports._start) {
    exports._start();
  }

  return new SwissEph(instance);
}
