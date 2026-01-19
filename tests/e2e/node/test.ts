/**
 * Node.js E2E test using shared comprehensive suite.
 *
 * Run with: npx tsx tests/e2e/node/test.ts
 */

import { SwissEph } from "../../../src/main.ts";
import { runComprehensiveSuite } from "../../fixtures/comprehensive_suite.ts";
import { createReport, printReport } from "../../fixtures/test_utils.ts";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "../../../lib/wasi/swiss_eph.wasm");
const epheDir = join(__dirname, "../../../vendor/swisseph/ephe");

async function run() {
  console.log("\n============================================================");
  console.log("  SwissEph Node.js Comprehensive Test Suite");
  console.log("============================================================\n");

  console.log("Loading WASM module...");
  const wasmBuffer = await fs.readFile(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const eph = new SwissEph(wasmModule);

  console.log("Mounting ephemeris files...");
  const filesToMount = ["sepl_18.se1", "semo_18.se1", "seas_18.se1"];
  for (const file of filesToMount) {
    try {
      const content = await fs.readFile(join(epheDir, file));
      eph.mount(file, new Uint8Array(content));
      console.log(`  ✓ Mounted ${file}`);
    } catch (_e) {
      console.warn(`  ! Could not mount ${file}`);
    }
  }

  // Set path to root since files are mounted there
  eph.set_ephe_path("./");

  console.log("\nRunning comprehensive suite...");
  const { testResults, benchmarks } = runComprehensiveSuite(eph, {
    log: (msg) => console.log(`  ${msg}`),
    runBenchmarks: true,
  });

  const report = createReport("Node.js (tsx)", testResults, benchmarks);
  printReport(report);

  if (report.failed > 0) {
    console.error(`\nFAILED: ${report.failed} tests failed.`);
    process.exit(1);
  } else {
    console.log("\nPASSED: All comprehensive tests satisfied in Node.js.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
