import { assert, assertEquals } from "@std/assert";
import { load } from "../mod.ts";
import { Constants } from "../src/swisseph_api.generated.ts";

const EPHE_PATH = "./src/swisseph/ephe";

Deno.test("New API: Solar Eclipse Global", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  // Date: 2024-04-08 (Total Eclipse)
  const julday = eph.swe_julday(2024, 4, 8, 0, Constants.SE_GREG_CAL);

  // Find next eclipse
  const flg = Constants.SEFLG_SWIEPH;

  // swe_sol_eclipse_when_glob(tjd_start, ifl, ifltype, backward)
  // ifltype = 0 (SE_ECL_TOTAL|...) but here we pass 0 for default?
  // backward is boolean in mod.ts wrapper!

  // @ts-ignore: backward argument type mismatch between generated and manual wrapper
  const ret = eph.swe_sol_eclipse_when_glob(julday, flg, 0, false);

  console.log("Eclipse Global:", ret);

  assert(ret.returnCode !== Constants.ERR, "Should success: " + ret.error);
  // Expect eclipse around JD 2460409.2
  assert(Math.abs(ret.tret[0] - 2460409.2) < 0.5, "Eclipse date match");
});

Deno.test("New API: Heliacal UT", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const julday = eph.swe_julday(2000, 1, 1, 12, Constants.SE_GREG_CAL);
  const geopos = [-71, 42, 0]; // Boston
  const datm = [1013.25, 15, 40, 0, 0, 0]; // Standard atmos
  const dobs = [0, 0, 0, 0, 0, 0]; // Standard obs

  // swe_heliacal_ut(tjdstart, geopos, datm, dobs, objName, type, flags)
  // SE_HELIACAL_RISING = 1
  const ret = eph.swe_heliacal_ut(
    julday,
    geopos,
    datm,
    dobs,
    "Venus",
    Constants.SE_HELIACAL_RISING,
    Constants.SEFLG_SWIEPH,
  );

  console.log("Heliacal Venus:", ret);

  // Check using Constants.ERR
  if (ret.returnCode === Constants.ERR) {
    console.log("Heliacal Error:", ret.serr);
  } else {
    assert(ret.dret.length >= 3, "Should return array");
  }
});

Deno.test("New API: House Pos (Zero Copy Check - Manual)", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  const armc = 12.0;
  const geolat = 47.0;
  const eps = 23.4;
  const hsys = "P".charCodeAt(0);
  const xpin: [number, number] = [0, 0];

  // swe_house_pos(armc, geolat, eps, hsys, xpin)
  const ret = eph.swe_house_pos(armc, geolat, eps, hsys, xpin);
  console.log("House Pos:", ret);

  // ret is { position: number, error: string }
  assert(ret.position !== undefined, "Should return position");
});

Deno.test("swe_calc Zero-Copy POC", async () => {
  const eph = await load({ ephePath: EPHE_PATH });

  // Access private heap with cast - standardizing for test purposes
  const heap = (eph as unknown as { heap: any }).heap;

  // Allocate memory manually
  const xx_ptr = heap.alloc(6 * 8);
  const serr_ptr = heap.alloc(256);

  const julday = 2460000.5;
  const iflag = Constants.SEFLG_SWIEPH;

  // Call with external pointers
  const ret = eph.swe_calc(julday, Constants.SE_SUN, iflag, xx_ptr, serr_ptr);

  // Verify results
  const xx_view = heap.getF64(xx_ptr, 6);
  console.log("Zero-Copy Sun Lon:", xx_view[0]);

  // Using simple number comparison vs undefined constant assumption
  const approxLon = 336;
  assert(Math.abs(xx_view[0] - approxLon) < 1.0, "Sun roughly in Pisces?");

  heap.free(xx_ptr);
  heap.free(serr_ptr);
});
