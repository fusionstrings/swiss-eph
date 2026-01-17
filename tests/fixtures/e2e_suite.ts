/**
 * Cross-Platform E2E Test Suite
 *
 * This file contains portable tests that can run on any platform:
 * - Deno (native)
 * - Node.js (via npm package)
 * - Browser (via bundled JS)
 * - Cloudflare Workers (edge runtime)
 *
 * It uses the golden values from swetest for accuracy verification.
 */

import {
  HOUSE_SYSTEMS,
  PLANET_POSITIONS,
  TEST_DATES,
  TEST_JD,
  TEST_LOCATION,
  TOLERANCES,
} from "./golden_values.ts";

import type { BenchmarkResult, TestReport, TestResult } from "./test_utils.ts";

/**
 * Run the complete E2E test suite
 * Works with any SwissEph instance (Deno, Node, Browser, Workers)
 */
export function runE2ETests(
  eph: {
    swe_calc: Function;
    swe_julday: Function;
    swe_revjul: Function;
    swe_houses: Function;
    swe_cotrans: Function;
    swe_version: Function;
    swe_degnorm: Function;
  },
  Constants: Record<string, number>,
  platform: string,
): TestReport {
  const results: TestResult[] = [];
  const benchmarks: BenchmarkResult[] = [];
  const startTime = performance.now();

  console.log(`\n${"=".repeat(50)}`);
  console.log(`  SwissEph E2E Tests: ${platform}`);
  console.log(`${"=".repeat(50)}\n`);

  // =========================================================================
  // TEST 1: Planet Positions (swetest comparison)
  // =========================================================================
  console.log("Test 1: Planet Positions vs swetest golden values");

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
    try {
      const { xx } = eph.swe_calc(TEST_JD, body.id, iflag);
      const golden =
        PLANET_POSITIONS[body.key as keyof typeof PLANET_POSITIONS];
      const diff = Math.abs(xx[0] - golden.lon);
      const passed = diff <= TOLERANCES.PLANET_POSITION;

      results.push({
        name: `${golden.name} Position`,
        passed,
        expected: golden.lon,
        actual: xx[0],
        diff,
        tolerance: TOLERANCES.PLANET_POSITION,
        timestamp: new Date().toISOString(),
      });

      const status = passed ? "✓" : "✗";
      console.log(
        `  ${status} ${golden.name}: ${xx[0].toFixed(8)}° (diff: ${
          diff.toExponential(2)
        })`,
      );
    } catch (e: unknown) {
      results.push({
        name: `${body.key} Position`,
        passed: false,
        expected: 0,
        actual: 0,
        diff: Infinity,
        tolerance: TOLERANCES.PLANET_POSITION,
        timestamp: new Date().toISOString(),
      });
      console.log(`  ✗ ${body.key}: ERROR - ${(e as Error).message}`);
    }
  }

  // =========================================================================
  // TEST 2: Julian Day Conversions
  // =========================================================================
  console.log("\nTest 2: Julian Day Conversions");

  for (const date of TEST_DATES) {
    try {
      const jd = eph.swe_julday(
        date.year,
        date.month,
        date.day,
        date.hour,
        Constants.SE_GREG_CAL,
      );
      const back = eph.swe_revjul(jd, Constants.SE_GREG_CAL);

      const yearMatch = back.year === date.year;
      const monthMatch = back.month === date.month;
      const dayMatch = back.day === date.day;
      const hourDiff = Math.abs(back.hour - date.hour);
      const passed = yearMatch && monthMatch && dayMatch && hourDiff < 1e-6;

      results.push({
        name: `JD Roundtrip: ${date.desc}`,
        passed,
        expected: date.year,
        actual: back.year,
        diff: hourDiff,
        tolerance: 1e-6,
        timestamp: new Date().toISOString(),
      });

      const status = passed ? "✓" : "✗";
      console.log(`  ${status} ${date.desc}: JD ${jd.toFixed(6)}`);
    } catch (e: unknown) {
      results.push({
        name: `JD Roundtrip: ${date.desc}`,
        passed: false,
        expected: 0,
        actual: 0,
        diff: Infinity,
        tolerance: 1e-6,
        timestamp: new Date().toISOString(),
      });
      console.log(`  ✗ ${date.desc}: ERROR - ${(e as Error).message}`);
    }
  }

  // =========================================================================
  // TEST 3: House Systems
  // =========================================================================
  console.log("\nTest 3: House Systems");

  for (const system of HOUSE_SYSTEMS.slice(0, 5)) {
    try {
      const { cusps: _cusps, ascmc, returnCode } = eph.swe_houses(
        TEST_JD,
        TEST_LOCATION.lat,
        TEST_LOCATION.lon,
        system.code.charCodeAt(0),
      );

      const passed = returnCode >= 0 && ascmc[0] > 0 && ascmc[0] < 360;

      results.push({
        name: `House System: ${system.name}`,
        passed,
        expected: 0,
        actual: ascmc[0],
        diff: 0,
        tolerance: TOLERANCES.HOUSE_CUSP,
        timestamp: new Date().toISOString(),
      });

      const status = passed ? "✓" : "✗";
      console.log(
        `  ${status} ${system.name}: ASC=${ascmc[0].toFixed(4)}° MC=${
          ascmc[1].toFixed(4)
        }°`,
      );
    } catch (e: unknown) {
      results.push({
        name: `House System: ${system.name}`,
        passed: false,
        expected: 0,
        actual: 0,
        diff: Infinity,
        tolerance: TOLERANCES.HOUSE_CUSP,
        timestamp: new Date().toISOString(),
      });
      console.log(`  ✗ ${system.name}: ERROR - ${(e as Error).message}`);
    }
  }

  // =========================================================================
  // TEST 4: Coordinate Transformations
  // =========================================================================
  console.log("\nTest 4: Coordinate Transformations");

  try {
    const eps = 23.44;
    const ecliptic = [100.0, 5.0, 1.0];
    const equatorial = eph.swe_cotrans(ecliptic, -eps);
    const backToEcl = eph.swe_cotrans([equatorial[0], equatorial[1], 1.0], eps);

    const lonDiff = Math.abs(backToEcl[0] - ecliptic[0]);
    const passed = lonDiff < 1e-8;

    results.push({
      name: "Coordinate Transform Roundtrip",
      passed,
      expected: ecliptic[0],
      actual: backToEcl[0],
      diff: lonDiff,
      tolerance: 1e-8,
      timestamp: new Date().toISOString(),
    });

    const status = passed ? "✓" : "✗";
    console.log(
      `  ${status} Ecliptic → Equatorial → Ecliptic (diff: ${
        lonDiff.toExponential(2)
      })`,
    );
  } catch (e: unknown) {
    results.push({
      name: "Coordinate Transform Roundtrip",
      passed: false,
      expected: 0,
      actual: 0,
      diff: Infinity,
      tolerance: 1e-8,
      timestamp: new Date().toISOString(),
    });
    console.log(`  ✗ Coordinate Transform: ERROR - ${(e as Error).message}`);
  }

  // =========================================================================
  // TEST 5: Utility Functions
  // =========================================================================
  console.log("\nTest 5: Utility Functions");

  try {
    const version = eph.swe_version();
    const versionValid = /\d+\.\d+/.test(version);

    results.push({
      name: "Version String",
      passed: versionValid,
      expected: 2.10,
      actual: parseFloat(version),
      diff: 0,
      tolerance: 1,
      timestamp: new Date().toISOString(),
    });

    console.log(`  ${versionValid ? "✓" : "✗"} Version: ${version}`);

    const degnorm = eph.swe_degnorm(450);
    const degnormValid = Math.abs(degnorm - 90) < 0.0001;

    results.push({
      name: "Degree Normalization",
      passed: degnormValid,
      expected: 90,
      actual: degnorm,
      diff: Math.abs(degnorm - 90),
      tolerance: 0.0001,
      timestamp: new Date().toISOString(),
    });

    console.log(`  ${degnormValid ? "✓" : "✗"} degnorm(450) = ${degnorm}`);
  } catch (e: unknown) {
    console.log(`  ✗ Utility Functions: ERROR - ${(e as Error).message}`);
  }

  // =========================================================================
  // BENCHMARKS
  // =========================================================================
  console.log("\nBenchmarks:");

  // Benchmark swe_julday
  const jdStart = performance.now();
  for (let i = 0; i < 10000; i++) {
    eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL);
  }
  const jdElapsed = performance.now() - jdStart;
  benchmarks.push({
    name: "swe_julday",
    opsPerSec: Math.round(10000 / (jdElapsed / 1000)),
    avgMs: jdElapsed / 10000,
    iterations: 10000,
  });
  console.log(
    `  swe_julday: ${benchmarks[0].opsPerSec.toLocaleString()} ops/sec`,
  );

  // Benchmark swe_calc
  const calcStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    eph.swe_calc(TEST_JD, Constants.SE_SUN, iflag);
  }
  const calcElapsed = performance.now() - calcStart;
  benchmarks.push({
    name: "swe_calc",
    opsPerSec: Math.round(1000 / (calcElapsed / 1000)),
    avgMs: calcElapsed / 1000,
    iterations: 1000,
  });
  console.log(
    `  swe_calc: ${benchmarks[1].opsPerSec.toLocaleString()} ops/sec`,
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const totalTime = performance.now() - startTime;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(
    `  RESULTS: ${passed}/${results.length} passed, ${failed} failed`,
  );
  console.log(`  Time: ${totalTime.toFixed(2)}ms`);
  console.log(`${"=".repeat(50)}\n`);

  return {
    platform,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    results,
    benchmarks,
  };
}

/** Export for all platforms */
export { PLANET_POSITIONS, TEST_JD, TEST_LOCATION, TOLERANCES };
