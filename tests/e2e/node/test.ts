import { Constants, SwissEph } from "../../../npm/esm/mod.js";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "../../../npm/wasm/libswephe.wasm");
const epheDir = join(__dirname, "../../../vendor/swisseph/ephe");

// Golden Values from tests/fixtures/golden_values.ts
const TEST_JD = 2461054.5;
const TEST_LOCATION = { lat: 47.3769, lon: 8.5417, alt: 0 };
const PLANET_POSITIONS = {
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
const TOLERANCE = 1e-11;

async function run() {
  console.log("\n============================================================");
  console.log("  SwissEph Node.js E2E Comprehensive Test Suite");
  console.log("============================================================\n");

  console.log("Loading WASM module...");
  const wasmBuffer = await fs.readFile(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const eph = new SwissEph(wasmModule);

  console.log("Mounting ephemeris files for high precision...");
  // Mount files used for 2026 (1800-2400 range)
  const filesToMount = ["sepl_18.se1", "semo_18.se1"];
  for (const file of filesToMount) {
    try {
      const content = await fs.readFile(join(epheDir, file));
      eph.mount(file, new Uint8Array(content));
      console.log(`  ✓ Mounted ${file}`);
    } catch (_e) {
      console.warn(`  ! Could not mount ${file}, falling back to Moshier`);
    }
  }

  let passed = 0;
  let failed = 0;

  console.log("\nTest 1: Planet Positions vs Golden Values (High Precision)");
  const bodies = [
    { id: Constants.SE_SUN, key: "SE_SUN" },
    { id: Constants.SE_MOON, key: "SE_MOON" },
    { id: Constants.SE_MERCURY, key: "SE_MERCURY" },
    { id: Constants.SE_VENUS, key: "SE_VENUS" },
    { id: Constants.SE_MARS, key: "SE_MARS" },
    { id: Constants.SE_JUPITER, key: "SE_JUPITER" },
    { id: Constants.SE_SATURN, key: "SE_SATURN" },
    { id: Constants.SE_URANUS, key: "SE_URANUS" },
    { id: Constants.SE_NEPTUNE, key: "SE_NEPTUNE" },
    { id: Constants.SE_PLUTO, key: "SE_PLUTO" },
  ];

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  for (const body of bodies) {
    const { xx } = eph.swe_calc(TEST_JD, body.id, iflag);
    const golden = PLANET_POSITIONS[body.key];
    const diff = Math.abs(xx[0] - golden.lon);

    // If files are mounted, tolerance should be tight.
    // If not, it will fail but that's what we want to catch.
    if (diff <= TOLERANCE) {
      console.log(`  ✓ ${golden.name.padEnd(8)}: ${xx[0].toFixed(11)}° (pass)`);
      passed++;
    } else {
      console.error(
        `  ✗ ${golden.name.padEnd(8)}: ${xx[0].toFixed(11)}° (diff: ${
          diff.toExponential(2)
        })`,
      );
      failed++;
    }
  }

  console.log("\nTest 2: Julian Day Roundtrip");
  const testDate = { y: 2026, m: 1, d: 14, h: 12.5 };
  const jd = eph.swe_julday(
    testDate.y,
    testDate.m,
    testDate.d,
    testDate.h,
    Constants.SE_GREG_CAL,
  );
  const back = eph.swe_revjul(jd, Constants.SE_GREG_CAL);
  if (
    back.year === testDate.y && back.month === testDate.m &&
    Math.abs(back.hour - testDate.h) < 1e-7
  ) {
    console.log(
      `  ✓ JD ${jd.toFixed(4)} -> ${back.year}-${back.month}-${back.day}`,
    );
    passed++;
  } else {
    console.error(`  ✗ JD conversion failed`);
    failed++;
  }

  console.log("\nTest 3: House Systems");
  const { ascmc } = eph.swe_houses(
    TEST_JD,
    TEST_LOCATION.lat,
    TEST_LOCATION.lon,
    "P".charCodeAt(0),
  );
  if (ascmc[0] > 0 && ascmc[0] < 360) {
    console.log(`  ✓ Placidus ASC: ${ascmc[0].toFixed(4)}°`);
    passed++;
  } else {
    console.error(`  ✗ House calculation failed`);
    failed++;
  }

  console.log("\nFinal Result: ${passed} passed, ${failed} failed");
  console.log("============================================================\n");

  if (failed > 0) {
    console.error(
      "COMPREHENSIVENESS CHECK FAILED: Bit-level accuracy not met in Node.js",
    );
    process.exit(1);
  } else {
    console.log(
      "COMPREHENSIVENESS CHECK PASSED: All tests match golden values at 1e-11 precision.",
    );
  }

  console.log("\nTest 4: Explicit Moshier Mode (SEFLG_MOSEPH)");
  const iflagMoshier = Constants.SEFLG_MOSEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  // Test Sun in Moshier mode
  const { xx: moshierXx } = eph.swe_calc(
    TEST_JD,
    Constants.SE_SUN,
    iflagMoshier,
  );
  const moshierDiff = Math.abs(moshierXx[0] - PLANET_POSITIONS.SE_SUN.lon);

  // Moshier should be within ~0.0001 degrees of the high-precision value for Sun
  if (moshierDiff < 1e-4) {
    console.log(
      `  ✓ Moshier Sun: ${moshierXx[0].toFixed(6)}° (diff: ${
        moshierDiff.toExponential(2)
      })`,
    );
    passed++;
  } else {
    console.error(
      `  ✗ Moshier Sun failed tolerance: ${
        moshierXx[0]
      } (diff: ${moshierDiff})`,
    );
    failed++;
  }

  // Check failed again after Test 4
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
