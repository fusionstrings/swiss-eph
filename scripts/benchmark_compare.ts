import { load } from "../src/main.ts";
import { Constants } from "../lib/wasi/swisseph_api.generated.ts";

const EPHE_PATH = "./vendor/swisseph/ephe";
const TEST_JD = 2460323.5; // 2024-01-14

interface Artifact {
  name: string;
  path: string;
}

const ARTIFACTS: Artifact[] = [
  { name: "Legacy WASI (make)", path: "./lib/wasi/swiss_eph.wasm" },
  { name: "WASI SDK (wasmbuild)", path: "./lib/wasm-sdk/swiss_eph.wasm" },
  { name: "System CC (wasmbuild)", path: "./lib/wasm-system/swiss_eph.wasm" },
];

async function runBenchmark(artifact: Artifact) {
  console.log(`\nBenchmarking: ${artifact.name}...`);

  let eph;
  try {
    eph = await load({ wasmSource: artifact.path, ephePath: EPHE_PATH });
  } catch (e: any) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(`  Artifact not found at ${artifact.path}. Skipping.`);
    } else {
      console.error(`  Error loading ${artifact.name}: ${e.message}`);
      try {
        const bytes = await Deno.readFile(artifact.path);
        const module = await WebAssembly.compile(bytes);
        const exports = WebAssembly.Module.exports(module);
        console.log(
          `  Available exports (first 20): ${
            exports.map((ex) => ex.name).slice(0, 20).join(", ")
          }...`,
        );
      } catch { /* ignore */ }
    }
    return null;
  }

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_SPEED;

  const iters = 10000;
  const start = performance.now();

  for (let i = 0; i < iters; i++) {
    eph.swe_calc(TEST_JD + (i / 1000), Constants.SE_SUN, iflag);
    eph.swe_calc(TEST_JD + (i / 1000), Constants.SE_MOON, iflag);
  }

  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iters * 2) / (duration / 1000);

  console.log(`  Duration: ${duration.toFixed(2)}ms`);
  console.log(`  Throughput: ${opsPerSec.toLocaleString()} ops/sec`);

  return opsPerSec;
}

async function main() {
  console.log("============================================================");
  console.log("  SWISS EPHEMERIS WASM PERFORMANCE COMPARISON");
  console.log("============================================================");

  const results = [];
  for (const artifact of ARTIFACTS) {
    const ops = await runBenchmark(artifact);
    if (ops) results.push({ name: artifact.name, ops });
  }

  if (results.length > 1) {
    console.log("\nComparison:");
    const base = results[0];
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const ratio = current.ops / base.ops;
      const pct = (ratio - 1) * 100;
      console.log(
        `  ${current.name} vs ${base.name}: ${ratio.toFixed(2)}x (${
          pct > 0 ? "+" : ""
        }${pct.toFixed(1)}%)`,
      );
    }
  }
}

main();
