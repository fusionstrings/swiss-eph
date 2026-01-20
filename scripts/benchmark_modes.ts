import { SwissEph } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";

async function benchmark() {
  const wasmUrl = new URL("../lib/wasm/swiss_eph.wasm", import.meta.url);
  const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
  const eph = new SwissEph(wasmModule);

  const jd = 2460477.0; // 2024-06-15
  const body = Constants.SE_SUN;
  const iterations = 50000;

  const modes = [
    { name: "Moshier (Analytical)", flag: Constants.SEFLG_MOSEPH },
    { name: "Swiss Ephemeris", flag: Constants.SEFLG_SWIEPH },
    { name: "JPL Ephemeris", flag: Constants.SEFLG_JPLEPH },
  ];

  console.log(
    `\n--- Ephemeris Mode Benchmarks (${iterations.toLocaleString()} iterations) ---\n`,
  );
  console.log(`| Mode | Ops/sec | Precision (Longitude) |`);
  console.log(`| :--- | :--- | :--- |`);

  for (const mode of modes) {
    // Warm up
    for (let i = 0; i < 1000; i++) eph.swe_calc_ut(jd, body, mode.flag);

    const start = performance.now();
    let lastResult: {
      returnCode: number;
      serr?: string;
      xx: number[] | Float64Array;
    } = { returnCode: 0, xx: new Float64Array(6) };
    for (let i = 0; i < iterations; i++) {
      lastResult = eph.swe_calc_ut(jd, body, mode.flag) as {
        returnCode: number;
        serr?: string;
        xx: number[] | Float64Array;
      };
    }
    const end = performance.now();
    const ops = Math.floor((iterations / (end - start)) * 1000);

    let status = "";
    if (lastResult.returnCode < 0) {
      status = `ERR: ${lastResult.serr || "Unknown Error"}`;
    } else if (lastResult.serr) {
      status = `WRN: ${lastResult.serr.split("\n")[0]}`;
    } else {
      status = `${lastResult.xx[0].toFixed(12)}°`;
    }

    console.log(`| ${mode.name} | ${ops.toLocaleString()} | ${status} |`);
  }
  console.log(
    `\nNote: Swiss/JPL modes will fallback to Moshier if .se1/JPL files are not found.\n`,
  );
}

benchmark();
