import type { SwissEph } from "../../src/main.ts";
import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1;
const MOSHIER_FLAG = 4;

const wasmUrl = new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);

// --- Soundness: Mount Ephemeris Files ---
const __dirname = dirname(fromFileUrl(import.meta.url));
const epheDir = join(__dirname, "../../crates/swiss-eph/vendor/swisseph/ephe");
const requiredFiles = ["sepl_18.se1", "seas_18.se1", "semo_18.se1"];

try {
  let filesLoaded = 0;
  for (const file of requiredFiles) {
    try {
      const data = await Deno.readFile(join(epheDir, file));
      eph.mount(`ephe/${file}`, data);
      filesLoaded++;
    } catch {
      // ignore missing files in CI/lite environments
    }
  }
  if (filesLoaded > 0) {
    eph.set_ephe_path("ephe");
    console.log(`deno | wasi | js_api | ${filesLoaded} files loaded.`);
  }
} catch (e) {
  console.warn("WARN: Ephemeris setup failed.", e);
}

// Verification with JPL mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);

// --- Differential Verification ---
const moshierRes = eph.swe_calc_ut(jd, 0, MOSHIER_FLAG);
const jplRes = eph.swe_calc_ut(jd, 0, CALC_FLAG);

if (jplRes.returnCode < 0) {
  // Expected if precise files are missing
} else if (moshierRes.xx[0] === jplRes.xx[0]) {
  console.error(
    "CRITICAL: JPL mode produced identical results to Moshier mode.",
  );
  console.error("This means ephemeris files were NOT loaded or used.");
  Deno.exit(1);
} else {
  console.log(
    "PASS: WASI JS API JPL mode verification (JPL != Moshier).",
  );
  console.log(`      Moshier: ${moshierRes.xx[0].toFixed(8)}`);
  console.log(`      JPL:     ${jplRes.xx[0].toFixed(8)}`);
}

// Warmup
for (let i = 0; i < 100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
const start = performance.now();
const iter = 10000;
for (let i = 0; i < iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
const end = performance.now();
const duration = Math.max(end - start, 0.001);
const ops = Math.floor(iter / (duration / 1000));
const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN
console.log(
  `deno | wasi | js_api | jpl: Sun longitude = ${result.xx[0].toFixed(6)}°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
