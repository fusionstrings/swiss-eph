/**
 * Cross-Platform E2E Test Suite Wrapper
 *
 * This file wraps the comprehensive suite for consumption by
 * environment-specific runners (like the browser script).
 */

import { runComprehensiveSuite } from "./comprehensive_suite.ts";
import { createReport, type TestReport } from "./test_utils.ts";

/**
 * Run the unified E2E test suite
 * Works with any SwissEph instance
 */
export function runE2ETests(
  eph: any,
  _Constants: any,
  platform: string,
): TestReport {
  console.log(`\nStarting Unified E2E Suite: ${platform}`);

  const { testResults, benchmarks } = runComprehensiveSuite(eph, {
    log: (msg) => console.log(`  ${msg}`),
    runBenchmarks: true,
  });

  return createReport(platform, testResults, benchmarks);
}

export { runComprehensiveSuite };
