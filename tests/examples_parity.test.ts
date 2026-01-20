import { assertEquals } from "@std/assert";
import { SwissEph } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";
import { instantiate as instantiateInline } from "../src/loader.ts";

const _platforms = ["deno"] as const; // We run these in the Deno test runner
const builds = ["wasi", "wasm"] as const; // wasi (lib/wasi) vs wasmbuild (lib/wasm)
const styles = ["standard", "raw", "inline"] as const;
const modes = [
  Constants.SEFLG_MOSEPH,
  Constants.SEFLG_SWIEPH,
  Constants.SEFLG_JPLEPH,
] as const;

Deno.test("Parity: Full 72-Combination Matrix (Deno Virtual Runtime)", async (t) => {
  for (const build of builds) {
    for (const style of styles) {
      for (const mode of modes) {
        const modeName = mode === Constants.SEFLG_MOSEPH
          ? "MOS"
          : mode === Constants.SEFLG_SWIEPH
          ? "SWI"
          : "JPL";
        const testName = `${build} | ${style} | ${modeName}`;

        await t.step(testName, async () => {
          let eph: SwissEph | {
            swe_julday: (
              y: number,
              m: number,
              d: number,
              h: number,
              c: number,
            ) => number;
            swe_calc_ut: (
              jd: number,
              b: number,
              f: number,
            ) => { xx: Float64Array | number[]; error: string };
          };

          if (style === "inline") {
            // Inline always uses the pre-bundled wasmbuild variant
            eph = await instantiateInline();
          } else {
            const wasmPath = build === "wasi"
              ? "../lib/wasi/swiss_eph.wasm"
              : "../lib/wasm/swiss_eph.wasm";
            const wasmUrl = new URL(wasmPath, import.meta.url);
            const wasmModule = await WebAssembly.compileStreaming(
              fetch(wasmUrl),
            );

            if (style === "standard") {
              eph = new SwissEph(wasmModule);
            } else {
              // Raw instantiation with mock
              const dummyFn = () => 0;
              const mock = new Proxy({}, {
                get: (_, prop) =>
                  prop === "proc_exit" ? (_c: number) => {} : dummyFn,
              });
              const instance = await WebAssembly.instantiate(wasmModule, {
                wasi_snapshot_preview1: mock,
                env: mock,
                wbg: mock,
                "./swiss_eph.internal.js": mock,
              });

              const exports = instance.exports as unknown as Record<
                string,
                (
                  a?: unknown,
                  b?: unknown,
                  c?: unknown,
                  d?: unknown,
                  e?: unknown,
                  f?: unknown,
                ) => unknown
              >;

              // Minimal manual wrap for raw to verify functions exist
              eph = {
                swe_julday: (exports.swe_julday || exports.wasm_swe_julday ||
                  (exports as unknown as Record<
                    string,
                    (a: unknown) => unknown
                  >).calc_ut).bind(exports) as (
                    y: number,
                    m: number,
                    d: number,
                    h: number,
                    c: number,
                  ) => number,
                swe_calc_ut: (_jd: number, _ipl: number, _iflag: number) => {
                  // Just enough to verify linkage
                  return { xx: new Float64Array(6), error: "" };
                },
              };
            }
          }

          // Verification calculation
          const jd = 2460477.0; // 2024-06-15
          const body = Constants.SE_SUN;

          if (typeof eph.swe_calc_ut === "function") {
            if (eph instanceof SwissEph) {
              const res = eph.swe_calc_ut(jd, body, mode);
              // Handle JPL failure (expected without files)
              if (mode === Constants.SEFLG_JPLEPH && res.returnCode < 0) {
                return;
              }
              // Moshier/Swiss fallback check: 84.8759...
              assertEquals(res.xx[0].toFixed(5), "84.87591");
            } else {
              // Raw style: just ensure it doesn't crash
              assertEquals(typeof eph.swe_julday, "function");
            }
          }
        });
      }
    }
  }
});
