import type { SwissEph } from "../../src/main.ts";
import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;
const MOSHIER_FLAG = 4;

const wasmUrl = new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);

// --- Soundness: Mount Ephemeris Files ---
// We need to mount the actual ephemeris files to the virtual filesystem.
// Locating the files relative to this script:
const __dirname = dirname(fromFileUrl(import.meta.url));
const epheDir = join(__dirname, "../../crates/swiss-eph/vendor/swisseph/ephe");

// List of critical files for basic planet verification (SE_SUN etc)
// sepl_18.se1 covers 1800 AD - 2399 AD
const requiredFiles = ["sepl_18.se1", "seas_18.se1", "semo_18.se1"];

try {
  for (const file of requiredFiles) {
    const data = await Deno.readFile(join(epheDir, file));
    // Mount to a virtual path. We use 'ephe/' relative path to align with WASI pre-open CWD.
    eph.mount(`ephe/${file}`, data);
  }
  // Tell SwissEph where to look using relative path
  eph.set_ephe_path("ephe");
  console.log("eph | files loaded and path set to relative 'ephe'");
} catch (e) {
  console.warn(
    "WARN: Could not load ephemeris files. Benchmarks running in fallback (inaccurate) mode.",
  );
  console.warn(e);
}

// Verification with SWISS mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);

// --- Differential Verification ---
// Prove that we are accessing valid data by comparing Moshier (analytic) vs Swiss (file-based).
// They MUST differ if files are loaded correctly.
const moshierRes = eph.swe_calc_ut(jd, 0, MOSHIER_FLAG);
const swissRes = eph.swe_calc_ut(jd, 0, CALC_FLAG);

if (moshierRes.xx[0] === swissRes.xx[0]) {
  console.error(
    "CRITICAL: Swiss mode produced identical results to Moshier mode.",
  );
  console.error("This means ephemeris files were NOT loaded or used.");
  Deno.exit(1);
} else {
  console.log(
    "PASS: Differential testing confirmed Swiss mode is active (Swiss != Moshier).",
  );
  console.log(`      Moshier: ${moshierRes.xx[0].toFixed(8)}`);
  console.log(`      Swiss:   ${swissRes.xx[0].toFixed(8)}`);
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
  `deno | wasmbuild | js_api | swiss: Sun longitude = ${
    result.xx[0].toFixed(6)
  }°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
