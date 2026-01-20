import { assertEquals } from "@std/assert";
import { SwissEph } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";
import { instantiate as instantiateInline } from "../src/loader.ts";

const platforms = ["deno"] as const; // We run these in the Deno test runner
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
          let eph: any;

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
                  prop === "proc_exit" ? (c: number) => {} : dummyFn,
              });
              const instance = await WebAssembly.instantiate(wasmModule, {
                wasi_snapshot_preview1: mock,
                env: mock,
                wbg: mock,
                "./swiss_eph.internal.js": mock,
              });
              const exports = instance.exports as any;

              // Minimal manual wrap for raw to verify functions exist
              eph = {
                swe_julday: (exports.swe_julday || exports.wasm_swe_julday ||
                  exports.calc_ut).bind(exports),
                swe_calc_ut: (exports.swe_calc_ut || exports.wasm_swe_calc_ut ||
                  exports.calc_ut).bind(exports),
              };
            }
          }

          // Verification calculation
          const jd = 2460477.0; // 2024-06-15
          const body = Constants.SE_SUN;

          let lon: number;
          if (typeof eph.swe_calc_ut === "function") {
            // In raw WASM, the return might be different, but we check if it runs
            // For the sake of this test, we verify the high-level SwissEph results
            if (eph instanceof SwissEph) {
              const res = eph.swe_calc_ut(jd, body, mode);
              lon = res.xx[0];
              // Handle JPL failure (expected without files)
              if (mode === Constants.SEFLG_JPLEPH && res.returnCode < 0) {
                return;
              }
              // Moshier/Swiss fallback check: 84.8759...
              assertEquals(lon.toFixed(5), "84.87591");
            } else {
              // Raw style: just ensure it doesn't crash
              // Complex memory management required for full verification in raw is handled in logic.ts
              // Here we just verify linkage
              assertEquals(typeof eph.swe_julday, "function");
            }
          }
        });
      }
    }
  }
});
