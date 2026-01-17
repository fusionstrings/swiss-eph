/**
 * Cross-Platform Test Utilities
 *
 * These utilities work in all environments: Deno, Node.js, Browser, and Cloudflare Workers.
 * They do NOT require access to the native swetest binary.
 */

import {
  PLANET_POSITIONS,
  TEST_JD,
  TEST_LOCATION,
  TOLERANCES,
} from "./golden_values.ts";

/** Test result interface for artifact generation */
export interface TestResult {
  name: string;
  passed: boolean;
  expected: number;
  actual: number;
  diff: number;
  tolerance: number;
  timestamp: string;
}

/** Benchmark result interface */
export interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgMs: number;
  iterations: number;
}

/** Test report for artifact generation */
export interface TestReport {
  platform: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  benchmarks: BenchmarkResult[];
}

/**
 * Assert two numbers are equal within tolerance
 */
export function assertAlmostEquals(
  actual: number,
  expected: number,
  tolerance: number,
  message?: string,
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `${
        message || "Assertion failed"
      }: Expected ${expected}, got ${actual}, diff=${
        diff.toExponential(2)
      } (tolerance: ${tolerance.toExponential(2)})`,
    );
  }
}

/**
 * Compare WASM result with golden value
 */
export function compareWithGolden(
  planetKey: keyof typeof PLANET_POSITIONS,
  wasmValue: number,
  tolerance = TOLERANCES.STRICT,
): TestResult {
  const golden = PLANET_POSITIONS[planetKey];
  const diff = Math.abs(wasmValue - golden.lon);
  return {
    name: `${golden.name} Position`,
    passed: diff <= tolerance,
    expected: golden.lon,
    actual: wasmValue,
    diff,
    tolerance,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run a simple benchmark
 */
export function benchmark(
  name: string,
  fn: () => void,
  iterations = 1000,
): BenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsed = performance.now() - start;
  const avgMs = elapsed / iterations;
  return {
    name,
    opsPerSec: Math.round(1000 / avgMs),
    avgMs,
    iterations,
  };
}

/**
 * Create a test report
 */
export function createReport(
  platform: string,
  results: TestResult[],
  benchmarks: BenchmarkResult[],
): TestReport {
  return {
    platform,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
    benchmarks,
  };
}

/**
 * Format report as console output
 */
export function printReport(report: TestReport): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Test Report: ${report.platform}`);
  console.log(`  ${report.timestamp}`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`Results: ${report.passed}/${report.totalTests} passed\n`);

  for (const r of report.results) {
    const status = r.passed ? "✓" : "✗";
    console.log(`  ${status} ${r.name}: ${r.actual.toFixed(12)}°`);
    if (!r.passed) {
      console.log(
        `    Expected: ${r.expected.toFixed(12)}°, Diff: ${
          r.diff.toExponential(2)
        }`,
      );
    }
  }

  if (report.benchmarks.length > 0) {
    console.log(`\nBenchmarks:`);
    for (const b of report.benchmarks) {
      console.log(
        `  ${b.name}: ${b.opsPerSec.toLocaleString()} ops/sec (${
          b.avgMs.toFixed(3)
        }ms avg)`,
      );
    }
  }

  console.log(`\n${"=".repeat(60)}\n`);
}

/** Export golden values for convenience */
export { PLANET_POSITIONS, TEST_JD, TEST_LOCATION, TOLERANCES };
