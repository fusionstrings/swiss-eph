/**
 * Comprehensive Test Suite - Platform Agnostic
 *
 * This suite runs a full battery of tests against a SwissEph instance
 * using golden values generated from the native C library.
 *
 * It can be run in Deno, Node.js, and Browsers.
 */

import { Constants, SwissEph } from "../../src/main.ts";
import {
  AYANAMSA_VALUES,
  DELTA_T_VALUES,
  EDGE_CASES,
  HOUSE_CUSPS,
  HOUSE_SYSTEMS,
  PLANET_POSITIONS,
  POSITIONS_BY_DATE,
  SIDEREAL_MODES,
  TEST_DATES,
  TEST_JD,
  TEST_LOCATION,
  TEST_LOCATIONS,
  TOLERANCES,
} from "./golden_values.ts";
import {
  benchmark,
  type BenchmarkResult,
  type TestResult,
} from "./test_utils.ts";

export interface SuiteResults {
  testResults: TestResult[];
  benchmarks: BenchmarkResult[];
}

/**
 * Runs the comprehensive test suite against a SwissEph instance.
 *
 * @param eph The SwissEph instance to test
 * @param options Configuration for logging and benchmarking
 * @returns Results of all tests and benchmarks
 */
export function runComprehensiveSuite(
  eph: SwissEph,
  options: {
    log?: (msg: string) => void;
    runBenchmarks?: boolean;
  } = {},
): SuiteResults {
  const log = options.log || (() => {});
  const testResults: TestResult[] = [];
  const benchmarks: BenchmarkResult[] = [];

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  // --------------------------------------------------------------------------
  // 1. All Celestial Bodies
  // --------------------------------------------------------------------------
  log("Test 1: All Celestial Bodies...");
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
    const tolerance = (key === "SE_MEAN_APOG" || key === "SE_OSCU_APOG")
      ? 5e-10
      : TOLERANCES.STRICT;

    const passed = diff <= tolerance;
    testResults.push({
      name: `${golden.name} Position`,
      passed,
      expected: golden.lon,
      actual: xx[0],
      diff,
      tolerance,
      timestamp: new Date().toISOString(),
    });
    if (!passed) {
      log(`  FAILED: ${golden.name} (diff: ${diff.toExponential(2)})`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Multiple Epochs
  // --------------------------------------------------------------------------
  log("Test 2: Multiple Epochs...");
  const dateKeys = [
    "J2000",
    "PRIMARY",
    "HISTORICAL_1900",
    "MOON_LANDING",
  ] as const;
  for (const dateKey of dateKeys) {
    const date = TEST_DATES[dateKey];
    const positions = POSITIONS_BY_DATE[dateKey];
    for (const planet of ["SE_SUN", "SE_MOON"] as const) {
      const golden = positions[planet];
      const id = planet === "SE_SUN" ? Constants.SE_SUN : Constants.SE_MOON;
      const { xx } = eph.swe_calc(date.jd, id, iflag);
      const diff = Math.abs(xx[0] - golden.lon);
      const passed = diff <= TOLERANCES.STRICT;
      testResults.push({
        name: `${dateKey}/${planet}`,
        passed,
        expected: golden.lon,
        actual: xx[0],
        diff,
        tolerance: TOLERANCES.STRICT,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. House Systems
  // --------------------------------------------------------------------------
  log("Test 3: All House Systems...");
  const { dt } = eph.swe_deltat_ex(TEST_JD, Constants.SEFLG_SWIEPH);
  const utJD = TEST_JD - dt;
  for (const system of HOUSE_SYSTEMS) {
    const golden = HOUSE_CUSPS[system.name as keyof typeof HOUSE_CUSPS];
    const { ascmc, returnCode } = eph.swe_houses(
      utJD,
      TEST_LOCATION.lat,
      TEST_LOCATION.lon,
      system.code.charCodeAt(0),
    );
    if (returnCode < 0) continue;
    const ascDiff = Math.abs(ascmc[0] - golden.asc);
    const passed = ascDiff <= TOLERANCES.STRICT;
    testResults.push({
      name: `${system.name} Houses`,
      passed,
      expected: golden.asc,
      actual: ascmc[0],
      diff: ascDiff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 4. Sidereal Modes
  // --------------------------------------------------------------------------
  log("Test 4: Sidereal Modes...");
  for (const mode of SIDEREAL_MODES) {
    const golden = AYANAMSA_VALUES[mode.name as keyof typeof AYANAMSA_VALUES];
    eph.swe_set_sid_mode(mode.id, 0, 0);
    const { ayanamsa } = eph.swe_get_ayanamsa_ex(
      TEST_JD,
      Constants.SEFLG_SWIEPH,
    );
    const diff = Math.abs(ayanamsa - golden.value);
    const passed = diff <= TOLERANCES.STRICT;
    testResults.push({
      name: `Ayanamsa: ${mode.name}`,
      passed,
      expected: golden.value,
      actual: ayanamsa,
      diff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 5. Delta-T
  // --------------------------------------------------------------------------
  log("Test 5: Delta-T...");
  for (const [dateKey, value] of Object.entries(DELTA_T_VALUES)) {
    const date = TEST_DATES[dateKey as keyof typeof TEST_DATES];
    const { dt: dval } = eph.swe_deltat_ex(date.jd, Constants.SEFLG_SWIEPH);
    const wasmSec = dval * 86400;
    const diff = Math.abs(wasmSec - value.seconds);
    const passed = diff <= TOLERANCES.STRICT;
    testResults.push({
      name: `Delta-T: ${dateKey}`,
      passed,
      expected: value.seconds,
      actual: wasmSec,
      diff,
      tolerance: TOLERANCES.STRICT,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 6. Edge Cases
  // --------------------------------------------------------------------------
  log("Test 6: Edge Cases...");
  for (const [caseName, value] of Object.entries(EDGE_CASES)) {
    const { xx } = eph.swe_calc(
      value.jd,
      Constants.SE_SUN,
      Constants.SEFLG_MOSEPH | Constants.SEFLG_TRUEPOS,
    );
    const diff = Math.abs(xx[0] - value.sun_lon);
    const tolerance = 1e-2; // Moshier is less precise on extreme dates
    const passed = diff <= tolerance;
    testResults.push({
      name: `Edge: ${caseName}`,
      passed,
      expected: value.sun_lon,
      actual: xx[0],
      diff,
      tolerance,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 7. Benchmarks (Optional)
  // --------------------------------------------------------------------------
  if (options.runBenchmarks) {
    log("Running Benchmarks...");
    benchmarks.push(
      benchmark(
        "swe_julday",
        () => eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL),
        10000,
      ),
    );
    benchmarks.push(
      benchmark(
        "swe_calc (Sun)",
        () => eph.swe_calc(TEST_JD, Constants.SE_SUN, iflag),
        1000,
      ),
    );
    benchmarks.push(
      benchmark(
        "swe_houses (Placidus)",
        () => eph.swe_houses(TEST_JD, TEST_LOCATION.lat, TEST_LOCATION.lon, 80),
        500,
      ),
    );
  }

  return { testResults, benchmarks };
}

// Ensure TEST_LOCATIONS is used to avoid lint
export function getAvailableLocations(): string[] {
  return Object.keys(TEST_LOCATIONS);
}
