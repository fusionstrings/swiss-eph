import { encodeBase64 } from "@std/encoding/base64";

const WASM_PATH = "generated/libswephe.wasm";
const OUT_DIR = "browser";

async function main() {
  console.log("🏗️  Building for Browser...");

  // 1. Read and Encode WASM
  try {
    const wasmBytes = await Deno.readFile(WASM_PATH);
    const wasmBase64 = encodeBase64(wasmBytes);
    console.log(`📦 WASM encoded (${(wasmBytes.length / 1024).toFixed(2)} KB)`);

    // 2. Create the wrapper code
    // We re-export everything from mod.ts and provide a default instantiated instance
    const wrapperCode = `
import { SwissEph } from "../mod.ts";
export * from "../mod.ts";

const wasmBase64 = "${wasmBase64}";

function decodeWasm(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

let cachedModule: WebAssembly.Module | null = null;

export function createSwissEph(): SwissEph {
  if (!cachedModule) {
    const bytes = decodeWasm(wasmBase64);
    cachedModule = new WebAssembly.Module(bytes);
  }
  return new SwissEph(cachedModule);
}

// Default instance for quick usage
export const swisseph = createSwissEph();
`;

    // 3. Write intermediate wrapper
    await Deno.mkdir(OUT_DIR, { recursive: true });
    const wrapperPath = `${OUT_DIR}/wrapper.ts`;
    await Deno.writeTextFile(wrapperPath, wrapperCode);

    // 4. Bundle (using Deno emit/bundle)
    // Note: deno emit is deprecated but convenient.
    // Alternatively we can just leave the TS wrapper if the user wants to traverse imports.
    // For a single file distribution, we might need 'deno bundle' or 'esbuild'.
    // Since 'deno bundle' is removed in v2, we should just rely on the user using a bundler
    // OR use 'esbuild'.

    // For now, let's output the standalone TS file which embeds the WASM.
    // The user can import this into their bundler.

    console.log(`✅ Generated ${wrapperPath} with inlined WASM.`);
    console.log(
      "For a single JS bundle, use a bundler (esbuild, rollup, etc.) on this entry point.",
    );
  } catch (e) {
    console.error("❌ Build failed:", e);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
