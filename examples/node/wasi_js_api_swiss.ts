import { SwissEph as SwissEphClass } from "../../src/main.ts";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;
const MOSHIER_FLAG = 4;

const wasmBuffer = await readFile(
  new URL("../../lib/wasi/swiss_eph.wasm", import.meta.url),
);
const wasmModule = await WebAssembly.compile(wasmBuffer);
const eph = new SwissEphClass(wasmModule);

// --- Soundness: Mount Ephemeris Files ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const epheDir = join(__dirname, "../../crates/swiss-eph/vendor/swisseph/ephe");
const requiredFiles = ["sepl_18.se1", "seas_18.se1", "semo_18.se1"];

try {
  let filesLoaded = 0;
  for (const file of requiredFiles) {
    try {
      const data = await readFile(join(epheDir, file));
      eph.mount(`ephe/${file}`, new Uint8Array(data));
      filesLoaded++;
    } catch {
      // ignore
    }
  }
  if (filesLoaded > 0) {
    eph.set_ephe_path("ephe");
    console.log(`node | wasi | js_api | ${filesLoaded} files loaded.`);
  }
} catch (e) {
  console.warn("WARN: Ephemeris setup failed.", e);
}

// Verification with SWISS mode
const jd = eph.swe_julday(2024, 6, 15, 12, 1);

// --- Differential Verification ---
const moshierRes = eph.swe_calc_ut(jd, 0, MOSHIER_FLAG);
const swissRes = eph.swe_calc_ut(jd, 0, CALC_FLAG);

if (moshierRes.xx[0] === swissRes.xx[0]) {
  console.error(
    "CRITICAL: Swiss mode produced identical results to Moshier mode.",
  );
  process.exit(1);
} else {
  console.log("PASS: WASI JS API Swiss verification (Swiss != Moshier).");
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
  `node | wasi | js_api | swiss: Sun longitude = ${result.xx[0].toFixed(6)}°`,
);
console.log(`Perf: ${ops.toLocaleString()} ops/sec`);
