import { calc_ut } from "@fusionstrings/swiss-eph/inline";

// Ephemeris Mode: SWISS (flag: 2)
const CALC_FLAG = 2;

// Verification with SWISS mode
// 2024-06-15 12:01 UT -> JD 2460477.0006944444
const jd = 2460477.0006944444;
const result = calc_ut(jd, 0, CALC_FLAG); // SE_SUN

console.log(
  `deno | wasmbuild | inline | swiss: Sun longitude = ${
    result.longitude.toFixed(6)
  }°`,
);
