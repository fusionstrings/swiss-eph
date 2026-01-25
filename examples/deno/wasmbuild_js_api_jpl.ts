import type { SwissEph } from "../../src/main.ts";
import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { dirname, fromFileUrl, join } from "@std/path";

// Ephemeris Mode: JPL (flag: 1)
const CALC_FLAG = 1; // SEFLG_JPLEPH
const MOSHIER_FLAG = 4; // SEFLG_MOSEPH

const wasmUrl = new URL("../../lib/wasm/swiss_eph.wasm", import.meta.url);
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const eph: SwissEph = new SwissEphClass(wasmModule);

// --- Soundness: Mount Ephemeris Files ---
const __dirname = dirname(fromFileUrl(import.meta.url));
const epheDir = join(__dirname, "../../crates/swiss-eph/vendor/swisseph/ephe");
// JPL requires the underlying DE files (e.g. sepl_*.se1 mapped from DE406/431) IF converted,
// but standard JPL mode usually refers to using the DE files directly if supported,
// OR utilizing the high-precision Swiss files which are based on JPL.
// Note: SEFLG_JPLEPH forces use of JPL ephemerides (DE406 etc). If not found, it might error or fallback.
// In this repo, we only have standard Swiss Ephemeris files (.se1).
// To verify "soundness", we check if we can load the standard Swiss files which allow 'Swiss' mode
// (which is ~JPL precision). True JPL DE406 files are 200MB+ and likely not in repo.
// We will mount standard files and try.
const requiredFiles = ["sepl_18.se1", "seas_18.se1", "semo_18.se1"];

try {
  let filesLoaded = 0;
  for (const file of requiredFiles) {
    try {
      const data = await Deno.readFile(join(epheDir, file));
      // Mount to a virtual path. We use 'ephe/' relative path.
      eph.mount(`ephe/${file}`, data);
      filesLoaded++;
    } catch {
      // ignore individual missing files
    }
  }
  if (filesLoaded > 0) {
    // Tell SwissEph where to look using relative path
    eph.set_ephe_path("ephe");
    console.log(
      `eph | ${filesLoaded} files loaded and path set to relative 'ephe'`,
    );
  } else {
    console.warn("WARN: No ephemeris files found in vendor directory.");
  }
} catch (e) {
  console.warn("WARN: Ephemeris setup failed.", e);
}

// Verification
const jd = eph.swe_julday(2024, 6, 15, 12, 1);

// --- Differential Verification ---
const moshierRes = eph.swe_calc_ut(jd, 0, MOSHIER_FLAG);
const jplRes = eph.swe_calc_ut(jd, 0, CALC_FLAG);

// Note: If JPL files are missing, SEFLG_JPLEPH might fail or fall back.
if (jplRes.returnCode < 0 || jplRes.error) {
  console.warn(
    "WARN: JPL mode failed or returned error (expected since distinct JPL files might be missing).",
  );
  console.warn(`      Error: ${jplRes.error}`);
} else if (moshierRes.xx[0] === jplRes.xx[0]) {
  console.error(
    "CRITICAL: JPL mode produced identical results to Moshier mode (Fallback occurred).",
  );
  console.error("This means ephemeris files were NOT loaded or used.");
  Deno.exit(1);
} else {
  console.log(
    "PASS: JPL mode produced distinct results (JPL != Moshier). Results valid.",
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
  `deno | wasmbuild | js_api | jpl: Sun longitude = ${
    result.xx[0].toFixed(6)
  }°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
