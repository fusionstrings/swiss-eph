import { SwissEph } from "./main.ts";

// Load the WASI binary relative to this module in the published package
// Note: In JSR published package, lib/wasi/ is sibling to src/
const WASM_URL = new URL("../lib/wasi/swiss_eph.wasm", import.meta.url);

/**
 * Instantiate the Swiss Ephemeris WASM module.
 *
 * @param wasmUrl Optional URL to the WASM binary. If not provided, it defaults to the
 *                packaged WASM binary location.
 * @returns A promise that resolves to a `SwissEph` instance.
 */
export async function instantiate(wasmUrl?: string | URL): Promise<SwissEph> {
  const url = wasmUrl || WASM_URL;

  let wasmModule: WebAssembly.Module;
  if (typeof Deno !== "undefined") {
    wasmModule = await WebAssembly.compileStreaming(fetch(url));
  } else {
    const response = await fetch(url);
    if (WebAssembly.compileStreaming) {
      wasmModule = await WebAssembly.compileStreaming(response);
    } else {
      const bytes = await response.arrayBuffer();
      wasmModule = await WebAssembly.compile(bytes);
    }
  }

  return new SwissEph(wasmModule);
}
