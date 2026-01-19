/**
 * Shared calculation logic for SwissEph parity verification.
 * This function is used by all 24 example permutations to ensure
 * they all produce identical results.
 */
export function runVerification(eph: any, Constants: any) {
  const date = { year: 2024, month: 6, day: 15, hour: 12.0 };

  // 1. Julian Day
  const jd = eph.swe_julday(
    date.year,
    date.month,
    date.day,
    date.hour,
    Constants.SE_GREG_CAL,
  );

  // 2. Sun Position (Moshier mode)
  const iflag = Constants.SEFLG_MOSEPH | Constants.SEFLG_SPEED;
  const { xx, error } = eph.swe_calc_ut(jd, Constants.SE_SUN, iflag);

  // 3. House Cusps (Placidus)
  const lat = 51.5074; // London
  const lon = -0.1278;
  const { cusps, ascmc } = eph.swe_houses(jd, lat, lon, "P".charCodeAt(0));

  return {
    jd,
    sun: {
      longitude: xx[0],
      latitude: xx[1],
      distance: xx[2],
      speed: xx[3],
    },
    cusps: Array.from(cusps).slice(1, 13),
    ascmc: Array.from(ascmc),
    error,
  };
}

export function printResults(
  platform: string,
  build: string,
  style: string,
  results: any,
) {
  console.log(`--- PARITY REPORT: ${platform} | ${build} | ${style} ---`);
  console.log(`JD:    ${results.jd}`);
  console.log(`Sun λ: ${results.sun.longitude.toFixed(10)}°`);
  console.log(`Asc:   ${results.ascmc[0].toFixed(10)}°`);
  console.log(`MC:    ${results.ascmc[1].toFixed(10)}°`);
  console.log(`--------------------------------------------------\n`);
}
