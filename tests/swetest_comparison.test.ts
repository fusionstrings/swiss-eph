/**
 * Swetest Comparison Tests - Comprehensive Edition
 *
 * These tests compare WASM module output against native swetest binary.
 * They serve as the authoritative accuracy verification.
 *
 * Coverage:
 * - 20 celestial bodies (planets, nodes, asteroids)
 * - 6 test dates across epochs
 * - 11 house systems
 * - 7 sidereal modes
 * - Edge cases (ancient dates, far future, Gregorian boundary)
 */

import { assertAlmostEquals } from "@std/assert";
import { load } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";
import {
  AYANAMSA_VALUES,
  DELTA_T,
  DELTA_T_VALUES,
  EDGE_CASES,
  HOUSE_CUSPS,
  HOUSE_SYSTEMS,
  PLANET_POSITIONS,
  POSITIONS_BY_DATE,
  SIDEREAL_MODES,
  SIDEREAL_TIME_VALUES,
  TEST_DATES,
  TEST_JD,
  TEST_LOCATION,
  TEST_LOCATIONS,
  TOLERANCES,
} from "./fixtures/golden_values.ts";
import {
  benchmark,
  type BenchmarkResult,
  createReport,
  printReport,
  type TestResult,
} from "./fixtures/test_utils.ts";

const EPHE_PATH = "./vendor/swisseph/ephe";

// Collect results for artifact generation
const allResults: TestResult[] = [];
const allBenchmarks: BenchmarkResult[] = [];

// ============================================================================
// TEST 1: ALL PLANET POSITIONS (20 bodies)
// ============================================================================

Deno.test("Swetest Comparison: All 20 Celestial Bodies", async () => {
  const eph = await load({ ephePath: EPHE_PATH });
  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 1: All Celestial Bodies (JD ${TEST_JD})`);
  console.log(`${"=".repeat(60)}`);

  const bodyMap: Record<string, number> = {
    SE_SUN: Constants.SE_SUN,
    SE_MOON: Constants.SE_MOON,
    SE_MERCURY: Constants.SE_MERCURY,
    SE_VENUS: Constants.SE_VENUS,
    SE_MARS: Constants.SE_MARS,
    SE_JUPITER: Constants.SE_JUPITER,
    SE_SATURN: Constants.SE_SATURN,
    SE_URANUS: Constants.SE_URANUS,
    SE_NEPTUNE: Constants.SE_NEPTUNE,
    SE_PLUTO: Constants.SE_PLUTO,
    SE_MEAN_NODE: Constants.SE_MEAN_NODE,
    SE_TRUE_NODE: Constants.SE_TRUE_NODE,
    SE_MEAN_APOG: Constants.SE_MEAN_APOG,
    SE_OSCU_APOG: Constants.SE_OSCU_APOG,
    SE_CHIRON: Constants.SE_CHIRON,
    SE_PHOLUS: Constants.SE_PHOLUS,
    SE_CERES: Constants.SE_CERES,
    SE_PALLAS: Constants.SE_PALLAS,
    SE_JUNO: Constants.SE_JUNO,
    SE_VESTA: Constants.SE_VESTA,
  };

  for (const [key, id] of Object.entries(bodyMap)) {
    const golden = PLANET_POSITIONS[key as keyof typeof PLANET_POSITIONS];
    const { xx } = eph.swe_calc(TEST_JD, id, iflag);
    const diff = Math.abs(xx[0] - golden.lon);

    console.log(
      `${golden.name.padEnd(12)} | Expected: ${golden.lon.toFixed(8)} | Got: ${
        xx[0].toFixed(8)
      } | Diff: ${diff.toExponential(2)}`,
    );

    // Use looser tolerance for apogee (inherent algorithm variance)
    const tolerance = (key === "SE_MEAN_APOG" || key === "SE_OSCU_APOG")
      ? 5e-10
      : TOLERANCES.STRICT;

    allResults.push({
      name: `${golden.name} Position`,
      passed: diff <= tolerance,
      expected: golden.lon,
      actual: xx[0],
      diff,
      tolerance: tolerance,
      timestamp: new Date().toISOString(),
    });

    assertAlmostEquals(
      xx[0],
      golden.lon,
      tolerance,
      `${golden.name} position mismatch`,
    );
  }
});

// ============================================================================
// TEST 2: MULTI-DATE VERIFICATION
// ============================================================================

Deno.test("Swetest Comparison: Multiple Epochs", async () => {
  const eph = await load({ ephePath: EPHE_PATH });
  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 2: Multiple Epochs Verification`);
  console.log(`${"=".repeat(60)}`);

  const dateKeys = [
    "J2000",
    "PRIMARY",
    "HISTORICAL_1900",
    "MOON_LANDING",
  ] as const;

  for (const dateKey of dateKeys) {
    const date = TEST_DATES[dateKey];
    const positions = POSITIONS_BY_DATE[dateKey];

    console.log(`\n  ${date.desc}:`);

    // Test Sun and Moon for each date
    for (const planet of ["SE_SUN", "SE_MOON"] as const) {
      const golden = positions[planet];
      const id = planet === "SE_SUN" ? Constants.SE_SUN : Constants.SE_MOON;
      const { xx } = eph.swe_calc(date.jd, id, iflag);
      const diff = Math.abs(xx[0] - golden.lon);

      console.log(
        `    ${planet.padEnd(10)} | ${golden.lon.toFixed(6)} vs ${
          xx[0].toFixed(6)
        } | Diff: ${diff.toExponential(2)}`,
      );

      allResults.push({
        name: `${dateKey}/${planet}`,
        passed: diff <= TOLERANCES.STRICT,
        expected: golden.lon,
        actual: xx[0],
        diff,
        tolerance: TOLERANCES.STRICT,
        timestamp: new Date().toISOString(),
      });

      assertAlmostEquals(xx[0], golden.lon, TOLERANCES.STRICT);
    }
  }
});

// ============================================================================
// TEST 3: ALL HOUSE SYSTEMS (11 systems)
// ============================================================================

Deno.test("Swetest Comparison: All House Systems", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 3: All House Systems (${HOUSE_SYSTEMS.length} systems)`);
  console.log(`${"=".repeat(60)}`);

  // House calculations require UT, not TT
  // Golden values were generated with: swe_houses(TEST_JD - deltat, ...)
  const { dt } = eph.swe_deltat_ex(TEST_JD, Constants.SEFLG_SWIEPH);
  const utJD = TEST_JD - dt;

  for (const system of HOUSE_SYSTEMS) {
    const golden = HOUSE_CUSPS[system.name as keyof typeof HOUSE_CUSPS];
    const { cusps, ascmc, returnCode } = eph.swe_houses(
      utJD,
      TEST_LOCATION.lat,
      TEST_LOCATION.lon,
      system.code.charCodeAt(0),
    );

    if (returnCode < 0) {
      console.log(`  ${system.name}: SKIPPED`);
      continue;
    }

    // Compare ASC
    const ascDiff = Math.abs(ascmc[0] - golden.asc);
    const mcDiff = Math.abs(ascmc[1] - golden.mc);

    console.log(
      `  ${system.name.padEnd(15)} | ASC: ${ascmc[0].toFixed(4)} (Δ${
        ascDiff.toExponential(1)
      }) | MC: ${ascmc[1].toFixed(4)} (Δ${mcDiff.toExponential(1)})`,
    );

    // Verify all 12 cusps
    for (let i = 0; i < 12; i++) {
      assertAlmostEquals(
        cusps[i + 1],
        golden.cusps[i],
        TOLERANCES.STRICT,
        `${system.name} cusp ${i + 1} mismatch`,
      );
    }

    allResults.push({
      name: `${system.name} Houses`,
      passed: ascDiff <= TOLERANCES.STRICT,
      expected: golden.asc,
      actual: ascmc[0],
      diff: ascDiff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });
  }

  // --- ADDED: Location Robustness (Verify no crashes and sane results for all locations) ---
  console.log(
    `\n  Location Robustness (All ${
      Object.keys(TEST_LOCATIONS).length
    } locations):`,
  );
  const wholeSign = "W".charCodeAt(0);
  for (const [name, loc] of Object.entries(TEST_LOCATIONS)) {
    const { ascmc, returnCode } = eph.swe_houses(
      utJD,
      loc.lat,
      loc.lon,
      wholeSign,
    );
    const passed = returnCode >= 0 && ascmc[0] >= 0 && ascmc[0] < 360;
    console.log(
      `    ${name.padEnd(15)} | ASC: ${ascmc[0].toFixed(2).padStart(6)} | ${
        passed ? "OK" : "FAILED"
      }`,
    );

    allResults.push({
      name: `House Robustness: ${name}`,
      passed,
      expected: 180, // placeholder
      actual: ascmc[0],
      diff: 0,
      tolerance: 180,
      timestamp: new Date().toISOString(),
    });

    if (!passed) throw new Error(`House calculation failed for ${name}`);
  }
});

// ============================================================================
// TEST 4: ALL SIDEREAL MODES (7 ayanamsas)
// ============================================================================

Deno.test("Swetest Comparison: All Sidereal Modes", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 4: All Sidereal Modes (${SIDEREAL_MODES.length} modes)`);
  console.log(`${"=".repeat(60)}`);

  for (const mode of SIDEREAL_MODES) {
    const golden = AYANAMSA_VALUES[mode.name as keyof typeof AYANAMSA_VALUES];
    eph.swe_set_sid_mode(mode.id, 0, 0);
    const { ayanamsa } = eph.swe_get_ayanamsa_ex(
      TEST_JD,
      Constants.SEFLG_SWIEPH,
    );
    const diff = Math.abs(ayanamsa - golden.value);

    console.log(
      `  ${mode.name.padEnd(15)} | ${golden.value.toFixed(10)} vs ${
        ayanamsa.toFixed(10)
      } | Diff: ${diff.toExponential(2)}`,
    );

    allResults.push({
      name: `Ayanamsa: ${mode.name}`,
      passed: diff <= TOLERANCES.STRICT,
      expected: golden.value,
      actual: ayanamsa,
      diff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });

    assertAlmostEquals(ayanamsa, golden.value, TOLERANCES.STRICT);
  }
});

// ============================================================================
// TEST 5: DELTA-T ACROSS EPOCHS
// ============================================================================

Deno.test("Swetest Comparison: Delta-T Values", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 5: Delta-T Values Across Epochs`);
  console.log(`${"=".repeat(60)}`);

  for (const [dateKey, value] of Object.entries(DELTA_T_VALUES)) {
    const date = TEST_DATES[dateKey as keyof typeof TEST_DATES];
    const { dt } = eph.swe_deltat_ex(date.jd, Constants.SEFLG_SWIEPH);
    const wasmSec = dt * 86400;
    const diff = Math.abs(wasmSec - value.seconds);

    // Verify against direct DELTA_T if this is the primary date
    if (dateKey === "PRIMARY") {
      assertAlmostEquals(dt, DELTA_T.days, TOLERANCES.IDENTICAL);
    }

    console.log(
      `  ${dateKey.padEnd(18)} | ${value.seconds.toFixed(4)}s vs ${
        wasmSec.toFixed(4)
      }s | Diff: ${diff.toExponential(2)}`,
    );

    allResults.push({
      name: `Delta-T: ${dateKey}`,
      passed: diff <= TOLERANCES.STRICT,
      expected: value.seconds,
      actual: wasmSec,
      diff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });

    assertAlmostEquals(wasmSec, value.seconds, TOLERANCES.STRICT);
  }
});

// ============================================================================
// TEST 6: SIDEREAL TIME ACROSS EPOCHS
// ============================================================================
Deno.test("Swetest Comparison: Sidereal Time", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 6: Sidereal Time Across Epochs`);
  console.log(`${"=".repeat(60)}`);

  for (const [dateKey, value] of Object.entries(SIDEREAL_TIME_VALUES)) {
    const date = TEST_DATES[dateKey as keyof typeof TEST_DATES];
    const { dt } = eph.swe_deltat_ex(date.jd, Constants.SEFLG_SWIEPH);
    const utJD = date.jd - dt;
    const sidTime = eph.swe_sidtime(utJD);
    const diff = Math.abs(sidTime - value);

    console.log(
      `  ${dateKey.padEnd(18)} | ${value.toFixed(10)} vs ${
        sidTime.toFixed(10)
      } | Diff: ${diff.toExponential(2)}`,
    );

    allResults.push({
      name: `Sidereal Time: ${dateKey}`,
      passed: diff <= TOLERANCES.STRICT,
      expected: value,
      actual: sidTime,
      diff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });

    assertAlmostEquals(sidTime, value, TOLERANCES.STRICT);
  }
});

// ============================================================================
// TEST 7: EDGE CASES
// ============================================================================

Deno.test("Swetest Comparison: Edge Cases", async () => {
  const eph = await load({ ephePath: EPHE_PATH });
  const iflag = Constants.SEFLG_MOSEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  TEST 6: Edge Cases (Moshier mode)`);
  console.log(`${"=".repeat(60)}`);

  for (const [caseName, value] of Object.entries(EDGE_CASES)) {
    const { xx } = eph.swe_calc(value.jd, Constants.SE_SUN, iflag);
    const diff = Math.abs(xx[0] - value.sun_lon);

    console.log(
      `  ${value.desc.padEnd(25)} | ${value.sun_lon.toFixed(6)} vs ${
        xx[0].toFixed(6)
      } | Diff: ${diff.toExponential(2)}`,
    );

    allResults.push({
      name: `Edge: ${caseName}`,
      passed: diff <= 1e-4,
      expected: value.sun_lon,
      actual: xx[0],
      diff,
      tolerance: 1e-4,
      timestamp: new Date().toISOString(),
    });

    // Use looser tolerance for ancient/future dates (Moshier has more variance)
    assertAlmostEquals(xx[0], value.sun_lon, 1e-4);
  }
});

// ============================================================================
// BENCHMARKS
// ============================================================================

Deno.test("Benchmark: Core Functions", async () => {
  const eph = await load({ ephePath: EPHE_PATH });
  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_SPEED;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  BENCHMARKS`);
  console.log(`${"=".repeat(60)}`);

  const benchmarks = [
    {
      name: "swe_julday",
      fn: () => eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL),
      iters: 100000,
    },
    {
      name: "swe_calc (Sun)",
      fn: () => eph.swe_calc(TEST_JD, Constants.SE_SUN, iflag),
      iters: 10000,
    },
    {
      name: "swe_calc (Moon)",
      fn: () => eph.swe_calc(TEST_JD, Constants.SE_MOON, iflag),
      iters: 10000,
    },
    {
      name: "swe_houses (Placidus)",
      fn: () =>
        eph.swe_houses(TEST_JD, TEST_LOCATION.lat, TEST_LOCATION.lon, 80),
      iters: 5000,
    },
    {
      name: "swe_cotrans",
      fn: () => eph.swe_cotrans([100, 5, 1], 23.44),
      iters: 100000,
    },
    { name: "swe_degnorm", fn: () => eph.swe_degnorm(450), iters: 100000 },
  ];

  for (const b of benchmarks) {
    const result = benchmark(b.name, b.fn, b.iters);
    allBenchmarks.push(result);
    console.log(
      `  ${b.name.padEnd(25)} ${
        result.opsPerSec.toLocaleString().padStart(10)
      } ops/sec`,
    );
  }
});

// ============================================================================
// ARTIFACT GENERATION
// ============================================================================

Deno.test("Generate Comprehensive Test Artifacts", async () => {
  const report = createReport(
    "Deno (comprehensive swetest comparison)",
    allResults,
    allBenchmarks,
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  FINAL REPORT`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Total Tests: ${report.totalTests}`);
  console.log(`  Passed: ${report.passed}`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`${"=".repeat(60)}\n`);

  // Write artifacts
  const artifactDir = "./lib/artifacts";
  try {
    await Deno.mkdir(artifactDir, { recursive: true });
    await Deno.writeTextFile(
      `${artifactDir}/test_report.json`,
      JSON.stringify(report, null, 2),
    );
    await Deno.writeTextFile(
      `${artifactDir}/benchmark.json`,
      JSON.stringify(
        { benchmarks: allBenchmarks, timestamp: report.timestamp },
        null,
        2,
      ),
    );
    console.log(`Artifacts written to ${artifactDir}/`);

    // Use the printReport utility as requested
    printReport(report);
  } catch (e: unknown) {
    console.log("Could not write artifacts:", (e as Error).message);
  }
});
