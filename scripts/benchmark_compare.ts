import { load } from "../src/main.ts";
import { Constants } from "../lib/wasi/swisseph_api.generated.ts";

const EPHE_PATH = "./vendor/swisseph/ephe";
const BENCH_NATIVE_PATH = "./bench_native";
const TEST_JD = 2460323.5; // 2024-01-14
const ITERATIONS = 10000;

interface BenchResult {
  name: string;
  ops: number;
  durationMs: number;
}

const WASM_ARTIFACTS = [
  { name: "Legacy WASI (make)", path: "./lib/wasi/swiss_eph.wasm" },
  { name: "WASI SDK (wasmbuild)", path: "./lib/wasm-sdk/swiss_eph.wasm" },
];

async function runWasmBenchmark(
  name: string,
  path: string,
): Promise<BenchResult | null> {
  console.log(`\nBenchmarking: ${name}...`);

  let eph;
  try {
    eph = await load({ wasmSource: path, ephePath: EPHE_PATH });
  } catch (e: unknown) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(`  Artifact not found at ${path}. Skipping.`);
    } else {
      console.error(`  Error loading ${name}: ${(e as Error).message}`);
    }
    return null;
  }

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_SPEED;

  // Warm-up
  for (let i = 0; i < 100; i++) {
    eph.swe_calc(TEST_JD + i / 1000, Constants.SE_SUN, iflag);
    eph.swe_calc(TEST_JD + i / 1000, Constants.SE_MOON, iflag);
  }

  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    eph.swe_calc(TEST_JD + i / 1000, Constants.SE_SUN, iflag);
    eph.swe_calc(TEST_JD + i / 1000, Constants.SE_MOON, iflag);
  }

  const duration = performance.now() - start;
  const opsPerSec = (ITERATIONS * 2) / (duration / 1000);

  console.log(`  Duration: ${duration.toFixed(2)}ms`);
  console.log(`  Throughput: ${opsPerSec.toLocaleString()} ops/sec`);

  return { name, ops: opsPerSec, durationMs: duration };
}

async function runNativeBenchmark(): Promise<BenchResult | null> {
  console.log(`\nBenchmarking: Native C (in-process)...`);

  try {
    await Deno.stat(BENCH_NATIVE_PATH);
  } catch {
    console.log(`  Benchmark binary not found at ${BENCH_NATIVE_PATH}.`);
    console.log(`  Run 'make bench_native' to build it.`);
    return null;
  }

  const cmd = new Deno.Command(BENCH_NATIVE_PATH, {
    args: [String(ITERATIONS)],
    stdout: "piped",
    stderr: "piped",
  });

  const output = await cmd.output();
  const text = new TextDecoder().decode(output.stdout);

  // Parse machine-readable output
  const lines = text.split("\n");
  let opsPerSec = 0;
  let durationMs = 0;

  for (const line of lines) {
    if (line.startsWith("ops_per_sec=")) {
      opsPerSec = parseFloat(line.split("=")[1]);
    } else if (line.startsWith("duration_ms=")) {
      durationMs = parseFloat(line.split("=")[1]);
    }
  }

  if (opsPerSec > 0) {
    console.log(`  Duration: ${durationMs.toFixed(2)}ms`);
    console.log(`  Throughput: ${opsPerSec.toLocaleString()} ops/sec`);
    return { name: "Native C (in-process)", ops: opsPerSec, durationMs };
  }

  console.error("  Failed to parse benchmark output");
  return null;
}

async function main() {
  console.log("============================================================");
  console.log("  SWISS EPHEMERIS PERFORMANCE COMPARISON");
  console.log("  (All benchmarks run in-process for fair comparison)");
  console.log("============================================================");
  console.log(`\nIterations: ${ITERATIONS}`);
  console.log(`Operations per iteration: 2 (Sun + Moon)`);
  console.log(`Total operations: ${ITERATIONS * 2}`);

  const results: BenchResult[] = [];

  // 1. Native C (in-process benchmark)
  const nativeResult = await runNativeBenchmark();
  if (nativeResult) results.push(nativeResult);

  // 2. WASM variants
  for (const artifact of WASM_ARTIFACTS) {
    const result = await runWasmBenchmark(artifact.name, artifact.path);
    if (result) results.push(result);
  }

  if (results.length > 1) {
    console.log(
      "\n============================================================",
    );
    console.log("  COMPARISON SUMMARY");
    console.log("============================================================");

    const fastest = results.reduce((a, b) => (a.ops > b.ops ? a : b));
    console.log(
      `\nFastest: ${fastest.name} (${fastest.ops.toLocaleString()} ops/sec)`,
    );

    console.log("\nAll results:");
    console.log("─".repeat(70));
    console.log(
      `${"Variant".padEnd(30)} ${"Ops/sec".padStart(15)} ${
        "vs Native".padStart(12)
      } ${"Duration".padStart(12)}`,
    );
    console.log("─".repeat(70));

    for (const result of results) {
      const ratio = result.ops / fastest.ops;
      const _pct = (ratio - 1) * 100;
      const _bar = "█".repeat(Math.round(ratio * 10));
      console.log(
        `${result.name.padEnd(30)} ${result.ops.toFixed(0).padStart(15)} ${
          (ratio.toFixed(2) + "x").padStart(12)
        } ${(result.durationMs.toFixed(2) + "ms").padStart(12)}`,
      );
    }
    console.log("─".repeat(70));

    console.log("\nVisual comparison:");
    for (const result of results) {
      const ratio = result.ops / fastest.ops;
      const bar = "█".repeat(Math.round(ratio * 40));
      console.log(
        `  ${result.name.padEnd(25)} ${bar} ${(ratio * 100).toFixed(0)}%`,
      );
    }
  }
}

main();
