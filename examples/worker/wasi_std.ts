/**
 * Cloudflare Worker Example: Standard API | WASI Build
 *
 * Demonstrates wrangler-managed WASM imports.
 */
import { SwissEph } from "../../src/main.ts";
import { Constants } from "../../src/generated/api.ts";
import { runVerification } from "../shared/logic.ts";

// @ts-ignore: Wrangler handles .wasm imports as WebAssembly.Module
import wasmModule from "../../lib/wasi/swiss_eph.wasm";

export default {
  async fetch(request: Request) {
    try {
      // 1. Instantiate using Standard API
      // Note: We use the already-compiled module provided by wrangler
      const eph = new SwissEph(wasmModule);

      // 2. Run Calculations
      const results = runVerification(eph, Constants);

      return new Response(
        JSON.stringify(
          {
            platform: "Cloudflare Worker",
            build: "WASI",
            style: "Standard",
            results,
          },
          null,
          2,
        ),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }
  },
};
