import { load } from "../src/main.ts";
import { runComprehensiveSuite } from "./fixtures/comprehensive_suite.ts";
import { createReport, printReport } from "./fixtures/test_utils.ts";

const EPHE_PATH = "./vendor/swisseph/ephe";

Deno.test("Comprehensive Swetest Comparison (Deno)", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log("\nStarting Comprehensive Test Suite...");
  const { testResults, benchmarks } = runComprehensiveSuite(eph, {
    log: (msg) => console.log(msg),
    runBenchmarks: true,
  });

  const report = createReport("Deno (Full Suite)", testResults, benchmarks);
  printReport(report);

  // Write artifacts
  const artifactDir = "./lib/artifacts";
  try {
    await Deno.mkdir(artifactDir, { recursive: true });
    await Deno.writeTextFile(
      `${artifactDir}/test_report.json`,
      JSON.stringify(report, null, 2),
    );
    console.log(`Artifacts written to ${artifactDir}/`);
  } catch (e: unknown) {
    console.log("Could not write artifacts:", (e as Error).message);
  }

  // Force failure if any test failed
  if (report.failed > 0) {
    throw new Error(`${report.failed} tests failed in comprehensive suite`);
  }
});
