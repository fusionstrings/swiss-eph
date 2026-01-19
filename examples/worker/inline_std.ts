/**
 * Cloudflare Worker Example: Standard API | Inline Build
 * 
 * Demonstrates zero-config integration with embedded WASM.
 */
import { SwissEph } from "../../lib/wasm-inline/swiss_eph.js";
import { Constants } from "../../src/generated/api.ts";
import { runVerification } from "../shared/logic.ts";

/**
 * Note: Cloudflare Workers have a 1MB script size limit on the Free plan.
 * The Inline build (swiss_eph.js) is ~500KB, so it fits well.
 */

export default {
  async fetch(request: Request) {
    try {
      // 1. Instantiate Standard API
      // Loader handles the fact that wasm is already inlined in the module
      import { instantiate } from "../../src/loader.ts";
      const eph = await instantiate();

      // 2. Run Calculations
      const results = runVerification(eph, Constants);

      return new Response(JSON.stringify({
        platform: "Cloudflare Worker",
        build: "Inline",
        style: "Standard",
        results
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};
