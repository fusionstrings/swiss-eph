import type { SwissEph as _SwissEph } from "../../../src/main.ts";
import { runE2ETests } from "../../fixtures/e2e_suite.ts";
import { Constants } from "../../../src/generated/api.ts";

console.log("Running Cross-Platform E2E Suite on Deno...");

// Instantiate SwissEph using the WASI build (Server-side Deno)
// We use the WASI build because Deno server environment supports file access nicely for precision
// NOTE: We could also test the WASM build (inline) if we wanted to verify "client behavior" in Deno.
// But usually Deno on server wants high precision + files.
import { instantiate } from "../../../src/loader.ts";

const eph = await instantiate();

// Set ephemeris path to root (where we mount or expect files)
// For WASI loader, it mounts local files.
eph.set_ephe_path("./");

// Mount ephemeris files for high precision
const ephePath = "crates/swiss-eph-data/ephe";
const epheFiles = ["sepl_18.se1", "semo_18.se1", "seas_18.se1"];
for (const file of epheFiles) {
  try {
    const data = await Deno.readFile(`${ephePath}/${file}`);
    eph.mount(file, data);
    console.log(`  ✓ Mounted ${file}`);
  } catch (_e) {
    console.warn(`  ! Could not load ${file} (precision may be lower)`);
  }
}

const report = runE2ETests(
  eph,
  Constants as unknown as Record<string, number>,
  "Deno (WASI)",
);

if (report.failed > 0) {
  console.error(`\nFAILED: ${report.failed} tests failed.`);
  Deno.exit(1);
} else {
  console.log(`\nSUCCESS: All ${report.passed} tests passed.`);
  Deno.exit(0);
}
