/**
 * Shared calculation logic for SwissEph parity verification.
 * This function is used by all 24 example permutations to ensure
 * they all produce identical results.
 */

/** Minimal interface representing either the high-level SwissEph or a direct export wrapper */
export interface SwissEphProvider {
  swe_julday: (
    y: number,
    m: number,
    d: number,
    h: number,
    cal: number,
  ) => number;
  swe_calc_ut: (
    jd: number,
    body: number,
    flag: number,
  ) => { xx: Float64Array | number[]; error: string };
  swe_houses: (
    jd: number,
    lat: number,
    lon: number,
    hsys: number,
  ) => { cusps: Float64Array | number[]; ascmc: Float64Array | number[] };
  // WASM-specific alternates
  wasm_swe_julday?: (
    y: number,
    m: number,
    d: number,
    h: number,
    cal: number,
  ) => number;
  wasm_swe_calc_ut?: (
    jd: number,
    body: number,
    flag: number,
    xxPtr: number,
    errPtr: number,
  ) => number;
  calc_ut?: (
    jd: number,
    body: number,
    flag: number,
  ) => { longitude: number; [key: string]: unknown };
  wasm_swe_houses?: (
    jd: number,
    lat: number,
    lon: number,
    hsys: number,
    cuspsPtr: number,
    ascmcPtr: number,
  ) => void;
}

export interface VerificationResults {
  jd: number;
  sun: {
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
  };
  cusps: number[];
  ascmc: number[];
  error: string;
}

export function runVerification(
  eph: SwissEphProvider,
  Constants: Record<string, number | undefined>,
): VerificationResults {
  const date = { year: 2024, month: 6, day: 15, hour: 12.0 };
  const SE_GREG_CAL = Constants?.SE_GREG_CAL ?? 1;
  const SE_SUN = Constants?.SE_SUN ?? 0;
  const SEFLG_SPEED = Constants?.SEFLG_SPEED ?? 256;

  // Aliases for build variants with robust binding
  const juldayRaw = eph.swe_julday || eph.wasm_swe_julday;
  const calcRaw = eph.swe_calc_ut || eph.calc_ut || eph.wasm_swe_calc_ut;
  const housesRaw = eph.swe_houses || eph.wasm_swe_houses;

  if (!juldayRaw || !calcRaw) {
    throw new Error(`Missing core functions (julday/calc) on eph instance.`);
  }

  const julday = (juldayRaw as (
    y: number,
    m: number,
    d: number,
    h: number,
    c: number,
  ) => number).bind(eph);
  const calc = (calcRaw as (
    jd: number,
    b: number,
    f: number,
  ) => { xx?: Float64Array | number[]; longitude?: number; error: string })
    .bind(eph);
  const houses = housesRaw
    ? (housesRaw as (
      jd: number,
      lat: number,
      lon: number,
      h: number,
    ) => {
      cusps: Float64Array | number[];
      ascmc: Float64Array | number[];
      [key: number]: Float64Array | number[];
    }).bind(eph)
    : null;

  // 1. Julian Day
  const jd = julday(
    date.year,
    date.month,
    date.day,
    date.hour,
    SE_GREG_CAL,
  );

  // 2. Sun Position (Moshier mode)
  const iflag = Constants?.SEFLG_MOSEPH ?? 2;
  const body = SE_SUN;

  const res = calc(jd, body, iflag | SEFLG_SPEED) as {
    xx?: Float64Array | number[];
    longitude?: number;
    error: string;
    [key: string]: unknown;
  };
  const xx = res.xx || [res.longitude || 0, 0, 0, 0];

  // 3. House Cusps (Placidus)
  const lat = 51.5074;
  const lon = -0.1278;
  const hRes = houses ? houses(jd, lat, lon, "P".charCodeAt(0)) : null;
  const cusps = hRes
    ? (hRes.cusps || (hRes as unknown as Record<number, number[]>)[0])
    : new Float64Array(13);
  const ascmc = hRes
    ? (hRes.ascmc || (hRes as unknown as Record<number, number[]>)[1])
    : new Float64Array(10);

  return {
    jd,
    sun: {
      longitude: xx[0],
      latitude: xx[1],
      distance: xx[2],
      speed: xx[3],
    },
    cusps: Array.from(cusps as number[]).slice(1, 13),
    ascmc: Array.from(ascmc as number[]),
    error: res.error || "",
  };
}

export function runBenchmark(
  eph: SwissEphProvider,
  Constants: Record<string, number | undefined>,
): number {
  const jd = 2460477.0;
  const iflag = Constants?.SEFLG_MOSEPH ?? 2;
  const body = Constants?.SE_SUN ?? 0;
  const iterations = 10000;

  const calcRaw = eph.swe_calc_ut || eph.calc_ut || eph.wasm_swe_calc_ut;
  if (!calcRaw) return 0;
  const fn = calcRaw.bind(eph);

  // Warm up
  for (let i = 0; i < 100; i++) fn(jd, body, iflag);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(jd, body, iflag);
  }
  const end = performance.now();

  return Math.floor((iterations / (end - start)) * 1000);
}

export function printResults(
  platform: string,
  build: string,
  style: string,
  results: VerificationResults,
  benchOps?: number,
) {
  console.log(`--- PARITY REPORT: ${platform} | ${build} | ${style} ---`);
  console.log(`JD:    ${results.jd}`);
  console.log(`Sun λ: ${results.sun.longitude.toFixed(10)}°`);
  console.log(`Asc:   ${results.ascmc[0].toFixed(10)}°`);
  if (benchOps) {
    console.log(`Perf:  ${benchOps.toLocaleString()} ops/sec`);
  }
  console.log(`--------------------------------------------------\n`);
}
