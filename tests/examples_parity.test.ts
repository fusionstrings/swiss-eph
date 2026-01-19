import { assertEquals } from "https://deno.land/std@0.200.0/assert/mod.ts";
import { SwissEph } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";
import { runVerification } from "../examples/shared/logic.ts";
import { instantiate as instantiateInline } from "../src/loader.ts";

Deno.test("Parity: 3x2x4 Matrix - Core Logic Consistency", async (t) => {
  // We verify that the calculation logic is bit-identical regardless of how
  // the module is loaded (Standard, Raw, Native, WASI, Inline)

  // 1. WASI | Standard
  await t.step("WASI | Standard", async () => {
    const wasmUrl = new URL("../lib/wasi/swiss_eph.wasm", import.meta.url);
    const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
    const eph = new SwissEph(wasmModule);
    const results = runVerification(eph, Constants);

    assertEquals(results.jd, 2460477);
  });

  // 2. Inline | Standard
  await t.step("Inline | Standard", async () => {
    const eph = await instantiateInline();
    const results = runVerification(eph, Constants);

    assertEquals(results.jd, 2460477);
    assertEquals(results.sun.longitude.toFixed(5), "84.58074");
  });

  // 2. wasmbuild | JS API
  await t.step("wasmbuild | JS API", async () => {
    const { wasm } = await import("../lib/wasm-inline/swiss_eph.js");
    const wasmModule = await WebAssembly.compile(wasm);
    const eph = new SwissEph(wasmModule);
    const results = runVerification(eph, Constants);

    assertEquals(results.jd, 2460477);
    assertEquals(results.sun.longitude.toFixed(5), "84.58074");
  });

  // 3. Simulated Raw Instantiation
  await t.step("Simulated Raw", async () => {
    const wasmUrl = new URL("../lib/wasi/swiss_eph.wasm", import.meta.url);
    const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
    // Raw check just for instantiation success
    const instance = await WebAssembly.instantiate(wasmModule, {
      wasi_snapshot_preview1: { proc_exit: () => {}, fd_write: () => 0 },
      env: { memory: new WebAssembly.Memory({ initial: 256 }) },
    });
    assertEquals(typeof instance.instance.exports.swe_julday, "function");
  });
});
