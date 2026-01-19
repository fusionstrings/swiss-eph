/**
 * Cloudflare Workers E2E test.
 *
 * Uses the WASI wrapper with inline WASM for edge runtime compatibility.
 * This file is bundled by wrangler which handles WASM imports.
 *
 * Run with: cd tests/e2e/cloudflare && npx wrangler dev
 */

import { Constants, SwissEph } from "@fusionstrings/swiss-eph/wasi";

// @ts-ignore: Cloudflare Workers-specific WASM import handled by wrangler bundler
import wasmBytes from "../../../lib/wasi/swiss_eph.wasm";

// Golden Values (Embedded for portability)
const TEST_JD = 2461054.5;
const PLANET_POSITIONS: Record<string, { lon: number; name: string }> = {
  SE_SUN: { lon: 293.81730274152, name: "Sun" },
  SE_MOON: { lon: 240.20452450742, name: "Moon" },
  SE_MERCURY: { lon: 289.02458791570, name: "Mercury" },
  SE_VENUS: { lon: 295.57017792959, name: "Venus" },
  SE_MARS: { lon: 292.71374057712, name: "Mars" },
  SE_JUPITER: { lon: 109.61279509653, name: "Jupiter" },
  SE_SATURN: { lon: 357.05296949413, name: "Saturn" },
  SE_URANUS: { lon: 57.64833150106, name: "Uranus" },
  SE_NEPTUNE: { lon: 359.71560716394, name: "Neptune" },
  SE_PLUTO: { lon: 303.12665611932, name: "Pluto" },
};

export default {
  async fetch(_request: Request, _env: unknown, _ctx: unknown) {
    try {
      // Initialize module - wrangler provides wasmBytes as WebAssembly.Module
      const module = await WebAssembly.compile(wasmBytes as BufferSource);
      const eph = new SwissEph(module);

      const results: Array<{
        name: string;
        longitude: number;
        diff: number;
        pass: boolean;
      }> = [];
      let passed = 0;
      let failed = 0;

      // Note: Cloudflare Workers run without ephemeris files (Moshier mode)
      const TOLERANCE_MOSHIER = 1e-5;

      const iflag = Constants.SEFLG_MOSEPH | Constants.SEFLG_TRUEPOS |
        Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

      for (const [key, golden] of Object.entries(PLANET_POSITIONS)) {
        const ipl = Constants[key as keyof typeof Constants] as number;
        const { xx } = eph.swe_calc(TEST_JD, ipl, iflag);
        const diff = Math.abs(xx[0] - golden.lon);
        const isPass = diff <= TOLERANCE_MOSHIER;

        results.push({
          name: golden.name,
          longitude: xx[0],
          diff: diff,
          pass: isPass,
        });

        if (isPass) passed++;
        else failed++;
      }

      return new Response(
        JSON.stringify(
          {
            platform: "Cloudflare Workers",
            status: failed === 0 ? "PASS" : "FAIL",
            tests: results,
            summary: {
              total: results.length,
              passed,
              failed,
              precision: "Moshier (No ephemeris files)",
            },
          },
          null,
          2,
        ),
        {
          headers: { "content-type": "application/json" },
        },
      );
    } catch (e) {
      const error = e as Error;
      return new Response(
        JSON.stringify({ error: error.message, stack: error.stack }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      );
    }
  },
};
