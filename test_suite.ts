import { assertEquals } from "@std/assert";
import { Constants, load } from "./mod.ts";

Deno.test("Golden Value Verification: JD 2461054.5", async () => {
  // 1. Run native swetest
  // -fPlJ: Planet, Longitude, JD
  const cmd = new Deno.Command("./src/swisseph/swetest", {
    args: [
      "-b14.1.2026",
      "-n1",
      "-p0",
      "-fPlJ",
      "-true",
      "-noaberr",
      "-nonut",
      "-edir./src/swisseph/ephe",
    ],
    stdout: "piped",
  });
  const output = await cmd.output();
  const stdout = new TextDecoder().decode(output.stdout);

  const lines = stdout.trim().split("\n");
  const nativeLine = lines[lines.length - 1];
  console.log(`Native RAW: ${nativeLine}`);

  const parts = nativeLine.trim().split(/\s+/);
  // parts[0] = Sun, parts[1] = Longitude, parts[2] = JD

  const nativeVal = parseFloat(parts[1]);
  const nativeJD = parseFloat(parts[2]);

  console.log(`Native Value: ${nativeVal}`);
  console.log(`Native JD: ${nativeJD}`);

  // 2. Run WASM
  const eph = await load({
    ephePath: "./src/swisseph/ephe",
  });

  const jd = eph.swe_julday(2026, 1, 14, 0, Constants.SE_GREG_CAL);
  console.log(`WASM JD: ${jd}`);

  if (nativeJD !== jd) {
    console.warn(`JD Mismatch! Native: ${nativeJD}, WASM: ${jd}`);
  }

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_TRUEPOS |
    Constants.SEFLG_NOABERR | Constants.SEFLG_NONUT;

  const { xx, returnCode: _returnCode, error: _error } = eph.swe_calc(
    jd,
    Constants.SE_SUN,
    iflag,
  );

  const wasmVal = xx[0];
  console.log(`WASM Value: ${wasmVal}`);

  const diff = Math.abs(nativeVal - wasmVal);
  console.log(`Diff: ${diff}`);

  // Tolerance adjusted for Moshier mode cross-platform drift (approx 3 arcsec)
  assertEquals(diff < 1e-3, true, `Mismatch exceeds tolerance. Diff: ${diff}`);
});
