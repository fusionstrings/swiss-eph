import { assertAlmostEquals, assertEquals } from "@std/assert";
import { load } from "../src/main.ts";
import { Constants } from "../src/generated/api.ts";

const EPHE_PATH = "./vendor/swisseph/ephe";
const SWETEST_PATH = "./vendor/swisseph/swetest";

async function runNativeSwetest(args: string[]): Promise<string> {
  const command = new Deno.Command(SWETEST_PATH, {
    args: [...args, `-edir${EPHE_PATH}`],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await command.output();
  return new TextDecoder().decode(stdout).trim();
}

/**
 * Parses swetest output for a single planet longitude.
 * Expected format from -fPlJ.15: "Sun 293.817302741521614 2461054.500000000"
 */
function parseSwetestLongitude(output: string): number {
  const lines = output.split("\n");
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(/\s+/).filter(Boolean);
  const val = parseFloat(parts[1]);
  if (isNaN(val)) {
    throw new Error(`Failed to parse swetest output: ${lastLine}`);
  }
  return val;
}

// ============================================================================
// TEST 1: Comprehensive Planet Sweep - Native Comparison
// ============================================================================
Deno.test("Planet Positions vs Native swetest (High Precision)", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const testDate = { y: 2026, m: 1, d: 14, h: 0 };
  const jd = eph.swe_julday(
    testDate.y,
    testDate.m,
    testDate.d,
    testDate.h,
    Constants.SE_GREG_CAL,
  );

  const iflag = Constants.SEFLG_SWIEPH | Constants.SEFLG_SPEED;

  const bodies = [
    { id: Constants.SE_SUN, name: "Sun", flag: "0" },
    { id: Constants.SE_MOON, name: "Moon", flag: "1" },
    { id: Constants.SE_MERCURY, name: "Mercury", flag: "2" },
    { id: Constants.SE_VENUS, name: "Venus", flag: "3" },
    { id: Constants.SE_MARS, name: "Mars", flag: "4" },
    { id: Constants.SE_JUPITER, name: "Jupiter", flag: "5" },
    { id: Constants.SE_SATURN, name: "Saturn", flag: "6" },
    { id: Constants.SE_URANUS, name: "Uranus", flag: "7" },
    { id: Constants.SE_NEPTUNE, name: "Neptune", flag: "8" },
    { id: Constants.SE_PLUTO, name: "Pluto", flag: "9" },
    { id: Constants.SE_CHIRON, name: "Chiron", flag: "D" },
  ];

  console.log(`\n=== Planet Positions for JD ${jd} ===`);

  for (const body of bodies) {
    // Native: Use exact JD, true position, no aberration/nutation for bit-level comparison
    const nativeOut = await runNativeSwetest([
      `-bj${jd}`,
      `-p${body.flag}`,
      "-fPlJ.15",
      "-ep",
      "-true",
      "-noaberr",
      "-nonut",
    ]);
    const nativeValue = parseSwetestLongitude(nativeOut);

    // WASM: Same flags for identical comparison
    const { xx } = eph.swe_calc(
      jd,
      body.id,
      iflag | Constants.SEFLG_TRUEPOS | Constants.SEFLG_NOABERR |
        Constants.SEFLG_NONUT,
    );
    const wasmValue = xx[0];

    const diff = Math.abs(wasmValue - nativeValue);
    console.log(
      `${body.name.padEnd(8)} | Native: ${nativeValue.toFixed(15)} | WASM: ${
        wasmValue.toFixed(15)
      } | Diff: ${diff.toExponential(2)}`,
    );

    // Tolerance: 1e-11 degrees (about 0.04 milliarcseconds)
    assertAlmostEquals(
      wasmValue,
      nativeValue,
      1e-11,
      `Bit-level mismatch for ${body.name}`,
    );
  }
});

// ============================================================================
// TEST 2: House Cusps vs Native swetest (Bit-Level Precision)
// ============================================================================
Deno.test("House Cusps vs Native swetest", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const lat = 47.3769; // Zurich
  const lon = 8.5417;
  const jd = eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL);

  // Get native house cusps using Placidus with extra precision (-ep)
  const nativeOut = await runNativeSwetest([
    "-b14.1.2026",
    "-ut12",
    `-geopos${lon},${lat},0`,
    "-house",
    "-ep", // Extra precision mode
  ]);

  // Parse high-precision DMS format: "57°34' 3.41615149"
  function parseDMSHighPrecision(dmsStr: string): number {
    const match = dmsStr.match(/(-?\d+)°\s*(\d+)'\s*([\d.]+)/);
    if (!match) throw new Error(`Failed to parse DMS: ${dmsStr}`);
    const [, deg, min, sec] = match;
    const sign = deg.startsWith("-") ? -1 : 1;
    return sign *
      (Math.abs(parseInt(deg)) + parseInt(min) / 60 + parseFloat(sec) / 3600);
  }

  // Parse from -ep output format
  const ascMatch = nativeOut.match(/Ascendant\s+(-?\d+°\s*\d+'\s*[\d.]+)/);
  const mcMatch = nativeOut.match(/MC\s+(-?\d+°\s*\d+'\s*[\d.]+)/);

  if (!ascMatch || !mcMatch) {
    console.log("Native output:", nativeOut);
    throw new Error("Could not parse house data from swetest -ep output");
  }

  const nativeAsc = parseDMSHighPrecision(ascMatch[1]);
  const nativeMC = parseDMSHighPrecision(mcMatch[1]);

  // WASM houses
  const { cusps, ascmc } = eph.swe_houses(jd, lat, lon, "P".charCodeAt(0));
  const wasmAsc = ascmc[0];
  const wasmMC = ascmc[1];

  const ascDiff = Math.abs(wasmAsc - nativeAsc);
  const mcDiff = Math.abs(wasmMC - nativeMC);

  console.log(`\n=== House Comparison (Placidus, Zurich) ===`);
  console.log(
    `Ascendant: Native=${nativeAsc.toFixed(15)}° WASM=${
      wasmAsc.toFixed(15)
    }° Diff=${ascDiff.toExponential(2)}`,
  );
  console.log(
    `MC:        Native=${nativeMC.toFixed(15)}° WASM=${
      wasmMC.toFixed(15)
    }° Diff=${mcDiff.toExponential(2)}`,
  );

  // Tolerance: 1e-11 degrees - bit-level precision (floating-point limit)
  assertAlmostEquals(wasmAsc, nativeAsc, 1e-11, "Ascendant mismatch");
  assertAlmostEquals(wasmMC, nativeMC, 1e-11, "MC mismatch");

  // Verify all 12 cusps are populated with reasonable values
  for (let i = 1; i <= 12; i++) {
    if (cusps[i] < 0 || cusps[i] >= 360) {
      throw new Error(`Cusp ${i} out of range: ${cusps[i]}`);
    }
  }
  console.log("All 12 house cusps valid.");
});

// ============================================================================
// TEST 3: Delta-T vs Native swetest (Bit-Level)
// ============================================================================
Deno.test("Delta-T vs Native swetest (Bit-Level)", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const jd = eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL);

  // Get native delta-T
  const nativeOut = await runNativeSwetest(["-b14.1.2026", "-ut12", "-p0"]);

  const deltaTMatch = nativeOut.match(/delta t:\s+([\d.]+)\s+sec/i);
  if (!deltaTMatch) throw new Error("Could not parse delta-T");

  const nativeDeltat = parseFloat(deltaTMatch[1]);
  const { dt } = eph.swe_deltat_ex(jd, Constants.SEFLG_SWIEPH);
  const wasmDeltatSec = dt * 86400;

  const diff = Math.abs(wasmDeltatSec - nativeDeltat);
  console.log(`\n=== Delta-T Comparison ===`);
  console.log(`Native: ${nativeDeltat.toFixed(9)} sec`);
  console.log(`WASM:   ${wasmDeltatSec.toFixed(9)} sec`);
  console.log(`Diff:   ${diff.toExponential(2)} sec`);

  // Tolerance: 1e-6 seconds (1 microsecond)
  assertAlmostEquals(wasmDeltatSec, nativeDeltat, 1e-6, "Delta-T mismatch");
});

// ============================================================================
// TEST 4: Julian Day Conversion (Bit-Level Roundtrip)
// ============================================================================
Deno.test("Julian Day Conversion (Bit-Level Roundtrip)", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  // Test several dates to ensure consistency
  const testDates = [
    { y: 2026, m: 1, d: 14, h: 12.5 },
    { y: 2000, m: 1, d: 1, h: 12.0 }, // J2000.0
    { y: 1900, m: 1, d: 1, h: 0.0 },
    { y: 2100, m: 12, d: 31, h: 23.999 },
  ];

  console.log(`\n=== Julian Day Roundtrip Tests ===`);

  for (const date of testDates) {
    const jd = eph.swe_julday(
      date.y,
      date.m,
      date.d,
      date.h,
      Constants.SE_GREG_CAL,
    );
    const result = eph.swe_revjul(jd, Constants.SE_GREG_CAL);

    console.log(
      `${date.y}-${date.m}-${date.d} ${date.h}h → JD ${
        jd.toFixed(10)
      } → ${result.year}-${result.month}-${result.day} ${
        result.hour.toFixed(10)
      }h`,
    );

    assertEquals(result.year, date.y, `Year mismatch for ${date.y}`);
    assertEquals(result.month, date.m, `Month mismatch for ${date.m}`);
    assertEquals(result.day, date.d, `Day mismatch for ${date.d}`);
    // Hour: allow 1e-8 (about 0.36 milliseconds) due to floating point
    assertAlmostEquals(
      result.hour,
      date.h,
      1e-8,
      `Hour mismatch for ${date.h}`,
    );
  }
});

// ============================================================================
// TEST 5: Sidereal Time vs Native swetest
// ============================================================================
Deno.test("Sidereal Time - WASM Internal Consistency", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const testJDs = [
    eph.swe_julday(2026, 1, 14, 0, Constants.SE_GREG_CAL),
    eph.swe_julday(2026, 1, 14, 6, Constants.SE_GREG_CAL),
    eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL),
    eph.swe_julday(2026, 1, 14, 18, Constants.SE_GREG_CAL),
  ];

  console.log(`\n=== Sidereal Time Tests ===`);

  for (const jd of testJDs) {
    const sidtime = eph.swe_sidtime(jd);

    // Verify range: 0-24 hours
    if (sidtime < 0 || sidtime >= 24) {
      throw new Error(`Sidereal time out of range: ${sidtime}`);
    }

    // Convert to HMS for display
    const h = Math.floor(sidtime);
    const m = Math.floor((sidtime - h) * 60);
    const s = ((sidtime - h) * 60 - m) * 60;

    console.log(
      `JD ${jd.toFixed(6)} → ${h}h ${m}m ${s.toFixed(4)}s (${
        sidtime.toFixed(12)
      } hours)`,
    );
  }

  // Verify that sidereal time increases by ~0.25 day over 6 hours (actually about 6h 9m sidereal)
  const diff = eph.swe_sidtime(testJDs[1]) - eph.swe_sidtime(testJDs[0]);
  const normalizedDiff = diff < 0 ? diff + 24 : diff;
  // In 6 UT hours, sidereal time advances about 6.0164 sidereal hours
  assertAlmostEquals(
    normalizedDiff,
    6.0164,
    0.01,
    "Sidereal time rate incorrect",
  );
});

// ============================================================================
// TEST 6: Ayanamsa (Lahiri) vs Native swetest
// ============================================================================
Deno.test("Ayanamsa (Lahiri) vs Native swetest", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  // Use TT-based JD to match swetest exactly (swetest -bj uses TT)
  const jd_tt = 2461054.5; // Jan 14, 2026 0:00 TT

  // Set Lahiri ayanamsa
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);

  // Get native swetest Lahiri ayanamsa using exact same JD
  const nativeOut = await runNativeSwetest([`-bj${jd_tt}`, "-sid1", "-p0"]);

  // Parse ayanamsa - look for Lahiri specifically
  const match = nativeOut.match(
    /ayanamsa\s*=\s*(\d+)°\s*(\d+)'[\s]*([\d.]+)\s*\(Lahiri\)/i,
  );

  if (!match) {
    console.log("Native output:", nativeOut);
    throw new Error("Could not parse Lahiri ayanamsa from swetest");
  }

  const [, deg, min, sec] = match;
  const nativeAyanamsa = parseInt(deg) + parseInt(min) / 60 +
    parseFloat(sec) / 3600;

  // IMPORTANT: Use swe_get_ayanamsa_ex with SEFLG_SWIEPH to use the Swiss Ephemeris files.
  // The simpler swe_get_ayanamsa() defaults to Moshier internal ephemeris, which gives
  // slightly different results (~6 arcsec difference for Lahiri).
  const { ayanamsa: wasmAyanamsa } = eph.swe_get_ayanamsa_ex(
    jd_tt,
    Constants.SEFLG_SWIEPH,
  );

  const diff = Math.abs(wasmAyanamsa - nativeAyanamsa);
  console.log(`\n=== Ayanamsa (Lahiri) at JD ${jd_tt} ===`);
  console.log(`Native: ${nativeAyanamsa.toFixed(12)}°`);
  console.log(`WASM:   ${wasmAyanamsa.toFixed(12)}°`);
  console.log(`Diff:   ${diff.toExponential(2)}°`);

  // Tolerance: 1e-8 degrees (about 0.036 arcseconds) - bit-level precision
  assertAlmostEquals(wasmAyanamsa, nativeAyanamsa, 1e-8, "Ayanamsa mismatch");
});

// ============================================================================
// TEST 7: Coordinate Transformations (Self-Consistency)
// ============================================================================
Deno.test("Coordinate Transformations", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const jd = eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL);

  // Get Sun's ecliptic coordinates
  const { xx } = eph.swe_calc(jd, Constants.SE_SUN, Constants.SEFLG_SWIEPH);
  const eclLon = xx[0];
  const eclLat = xx[1];

  console.log(`\n=== Coordinate Transformation Tests ===`);
  console.log(
    `Sun ecliptic: lon=${eclLon.toFixed(10)}° lat=${eclLat.toFixed(10)}°`,
  );

  // Transform to equatorial
  const eps = 23.44; // Approximate obliquity
  const equatorial = eph.swe_cotrans([eclLon, eclLat, 1.0], -eps); // Negative for ecl->equ

  console.log(
    `Sun equatorial: RA=${equatorial[0].toFixed(10)}° Dec=${
      equatorial[1].toFixed(10)
    }°`,
  );

  // Transform back to ecliptic
  const backToEcl = eph.swe_cotrans([equatorial[0], equatorial[1], 1.0], eps);

  console.log(
    `Back to ecliptic: lon=${backToEcl[0].toFixed(10)}° lat=${
      backToEcl[1].toFixed(10)
    }°`,
  );

  // Roundtrip should match within floating point precision
  assertAlmostEquals(
    backToEcl[0],
    eclLon,
    1e-10,
    "Ecliptic longitude roundtrip failed",
  );
  assertAlmostEquals(
    backToEcl[1],
    eclLat,
    1e-10,
    "Ecliptic latitude roundtrip failed",
  );

  // Test degnorm
  assertEquals(eph.swe_degnorm(450), 90, "degnorm(450) should be 90");
  assertEquals(eph.swe_degnorm(-90), 270, "degnorm(-90) should be 270");
  assertEquals(eph.swe_degnorm(0), 0, "degnorm(0) should be 0");
  assertEquals(eph.swe_degnorm(360), 0, "degnorm(360) should be 0");

  console.log("Coordinate transformations pass.");
});

// ============================================================================
// TEST 8: Utility Functions
// ============================================================================
Deno.test("Utility Functions", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  console.log(`\n=== Utility Function Tests ===`);

  // Test difdeg2n
  assertAlmostEquals(
    eph.swe_difdeg2n(350, 10),
    -20,
    1e-10,
    "difdeg2n(350, 10) failed",
  );
  assertAlmostEquals(
    eph.swe_difdeg2n(10, 350),
    20,
    1e-10,
    "difdeg2n(10, 350) failed",
  );

  // Test deg_midp
  assertAlmostEquals(
    eph.swe_deg_midp(350, 10),
    0,
    1e-10,
    "deg_midp(350, 10) failed",
  );
  assertAlmostEquals(
    eph.swe_deg_midp(90, 270),
    180,
    1e-10,
    "deg_midp(90, 270) failed",
  );

  // Test day_of_week
  const jdWed = eph.swe_julday(2026, 1, 14, 12, Constants.SE_GREG_CAL); // Wednesday
  assertEquals(
    eph.swe_day_of_week(jdWed),
    2,
    "2026-01-14 should be Wednesday (2)",
  );

  const jdSun = eph.swe_julday(2026, 1, 18, 12, Constants.SE_GREG_CAL); // Sunday
  assertEquals(
    eph.swe_day_of_week(jdSun),
    6,
    "2026-01-18 should be Sunday (6)",
  );

  // Test planet names
  assertEquals(eph.swe_get_planet_name(Constants.SE_SUN), "Sun");
  assertEquals(eph.swe_get_planet_name(Constants.SE_MOON), "Moon");
  assertEquals(eph.swe_get_planet_name(Constants.SE_MARS), "Mars");

  // Test house name
  const placidusName = eph.swe_house_name("P".charCodeAt(0));
  if (!placidusName.toLowerCase().includes("placidus")) {
    throw new Error(
      `Expected Placidus house system name, got: ${placidusName}`,
    );
  }

  // Test version
  const version = eph.swe_version();
  if (!version.match(/\d+\.\d+/)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  console.log(`SwissEph version: ${version}`);

  console.log("All utility functions pass.");
});
