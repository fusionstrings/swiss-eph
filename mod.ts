import { WASI } from "./src/wasi.ts";
import type { WasmExports } from "./src/heap.ts";
import { WasmHeap } from "./src/heap.ts";
import { Constants } from "./src/swisseph_api.generated.ts";
import type { SwissEphExports } from "./src/swisseph_api.generated.ts";

export { Constants };

export class SwissEph {
  private instance: WebAssembly.Instance;
  private heap: WasmHeap;
  private exports: SwissEphExports;
  private wasi: WASI;

  constructor(module: WebAssembly.Module) {
    this.wasi = new WASI();
    const imports = { ...this.wasi.imports };
    this.instance = new WebAssembly.Instance(module, imports);
    this.wasi.setMemory(this.instance.exports.memory as WebAssembly.Memory);
    this.exports = this.instance.exports as unknown as SwissEphExports;
    this.heap = new WasmHeap(
      this.instance.exports.memory as WebAssembly.Memory,
      this.exports as unknown as WasmExports,
    );
  }

  /**
   * Mount a file into the virtual filesystem
   */
  mount(path: string, content: Uint8Array) {
    this.wasi.mount(path, content);
  }

  /**
   * Set ephemeris path inside the library
   */
  set_ephe_path(path: string) {
    const ptr = this.heap.alloc(path.length + 1);
    this.heap.setU8(ptr, new TextEncoder().encode(path + "\0"));
    this.exports.swe_set_ephe_path(ptr);
    this.heap.free(ptr);
  }

  /**
   * swe_calc: Compute planetary position for a given TT date
   */
  swe_calc(
    tjd_et: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; error: string } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_calc(tjd_et, ipl, iflag, xx_ptr, serr_ptr);

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, error };
  }

  /**
   * swe_calc_ut: Compute planetary position for a given UT date
   */
  swe_calc_ut(
    tjd_ut: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; error: string } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_calc_ut(tjd_ut, ipl, iflag, xx_ptr, serr_ptr);

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, error };
  }

  /**
   * swe_houses: Compute house cusps and ascmc values
   */
  swe_houses(
    tjd_ut: number,
    geolat: number,
    geolon: number,
    hsys: number,
  ): { cusps: Float64Array; ascmc: Float64Array; returnCode: number } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);

    const ret = this.exports.swe_houses(
      tjd_ut,
      geolat,
      geolon,
      hsys,
      cusps_ptr,
      ascmc_ptr,
    );

    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();

    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);

    return { cusps, ascmc, returnCode: ret };
  }

  /**
   * swe_julday: Compute Julian Day
   */
  swe_julday(
    year: number,
    month: number,
    day: number,
    hour: number,
    gregflag: number,
  ): number {
    return this.exports.swe_julday(year, month, day, hour, gregflag);
  }

  /**
   * swe_version: Get library version
   */
  swe_version(): string {
    const ptr = this.heap.alloc(256);
    this.exports.swe_version(ptr);
    const ver = this.heap.getString(ptr);
    this.heap.free(ptr);
    return ver;
  }

  // ============================================================
  // Date/Time Functions
  // ============================================================

  /**
   * swe_revjul: Convert Julian Day to calendar date
   */
  swe_revjul(
    jd: number,
    gregflag: number,
  ): { year: number; month: number; day: number; hour: number } {
    const year_ptr = this.heap.alloc(4);
    const month_ptr = this.heap.alloc(4);
    const day_ptr = this.heap.alloc(4);
    const hour_ptr = this.heap.alloc(8);

    this.exports.swe_revjul(
      jd,
      gregflag,
      year_ptr,
      month_ptr,
      day_ptr,
      hour_ptr,
    );

    // Read directly from WASM memory using helper method
    const year = this.heap.getI32(year_ptr);
    const month = this.heap.getI32(month_ptr);
    const day = this.heap.getI32(day_ptr);
    const hour = this.heap.getF64(hour_ptr, 1)[0];

    this.heap.free(year_ptr);
    this.heap.free(month_ptr);
    this.heap.free(day_ptr);
    this.heap.free(hour_ptr);

    return { year, month, day, hour };
  }

  /**
   * swe_utc_to_jd: Convert UTC to Julian Day (both ET and UT)
   */
  swe_utc_to_jd(
    year: number,
    month: number,
    day: number,
    hour: number,
    min: number,
    sec: number,
    gregflag: number,
  ): { et: number; ut: number; returnCode: number; error: string } {
    const dret_ptr = this.heap.alloc(16);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_utc_to_jd(
      year,
      month,
      day,
      hour,
      min,
      sec,
      gregflag,
      dret_ptr,
      serr_ptr,
    );

    const dret = this.heap.getF64(dret_ptr, 2);
    const error = this.heap.getString(serr_ptr);

    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);

    return { et: dret[0], ut: dret[1], returnCode: ret, error };
  }

  /**
   * swe_jdet_to_utc: Convert Julian Day ET to UTC
   */
  swe_jdet_to_utc(
    tjd_et: number,
    gregflag: number,
  ): {
    year: number;
    month: number;
    day: number;
    hour: number;
    min: number;
    sec: number;
  } {
    const year_ptr = this.heap.alloc(4);
    const month_ptr = this.heap.alloc(4);
    const day_ptr = this.heap.alloc(4);
    const hour_ptr = this.heap.alloc(4);
    const min_ptr = this.heap.alloc(4);
    const sec_ptr = this.heap.alloc(8);

    this.exports.swe_jdet_to_utc(
      tjd_et,
      gregflag,
      year_ptr,
      month_ptr,
      day_ptr,
      hour_ptr,
      min_ptr,
      sec_ptr,
    );

    const view = new DataView(this.heap.getU8(year_ptr, 20).buffer);
    const year = view.getInt32(0, true);
    const month = view.getInt32(4, true);
    const day = view.getInt32(8, true);
    const hour = view.getInt32(12, true);
    const min = view.getInt32(16, true);
    const sec = new Float64Array(this.heap.getU8(sec_ptr, 8).buffer)[0];

    this.heap.free(year_ptr);
    this.heap.free(month_ptr);
    this.heap.free(day_ptr);
    this.heap.free(hour_ptr);
    this.heap.free(min_ptr);
    this.heap.free(sec_ptr);

    return { year, month, day, hour, min, sec };
  }

  /**
   * swe_jdut1_to_utc: Convert Julian Day UT1 to UTC
   */
  swe_jdut1_to_utc(
    tjd_ut: number,
    gregflag: number,
  ): {
    year: number;
    month: number;
    day: number;
    hour: number;
    min: number;
    sec: number;
  } {
    const year_ptr = this.heap.alloc(4);
    const month_ptr = this.heap.alloc(4);
    const day_ptr = this.heap.alloc(4);
    const hour_ptr = this.heap.alloc(4);
    const min_ptr = this.heap.alloc(4);
    const sec_ptr = this.heap.alloc(8);

    this.exports.swe_jdut1_to_utc(
      tjd_ut,
      gregflag,
      year_ptr,
      month_ptr,
      day_ptr,
      hour_ptr,
      min_ptr,
      sec_ptr,
    );

    const view = new DataView(this.heap.getU8(year_ptr, 20).buffer);
    const year = view.getInt32(0, true);
    const month = view.getInt32(4, true);
    const day = view.getInt32(8, true);
    const hour = view.getInt32(12, true);
    const min = view.getInt32(16, true);
    const sec = new Float64Array(this.heap.getU8(sec_ptr, 8).buffer)[0];

    this.heap.free(year_ptr);
    this.heap.free(month_ptr);
    this.heap.free(day_ptr);
    this.heap.free(hour_ptr);
    this.heap.free(min_ptr);
    this.heap.free(sec_ptr);

    return { year, month, day, hour, min, sec };
  }

  /**
   * swe_deltat: Delta T (TT - UT) for a given Julian Day
   */
  swe_deltat(tjd: number): number {
    return this.exports.swe_deltat(tjd);
  }

  /**
   * swe_deltat_ex: Delta T with extended error handling and ephemeris flag
   */
  swe_deltat_ex(tjd: number, iflag: number): { dt: number; error: string } {
    const serr_ptr = this.heap.alloc(256);
    const dt = this.exports.swe_deltat_ex(tjd, iflag, serr_ptr);
    const error = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { dt, error };
  }

  // ============================================================
  // Sidereal Time
  // ============================================================

  /**
   * swe_sidtime: Sidereal time at Greenwich
   */
  swe_sidtime(tjd_ut: number): number {
    return this.exports.swe_sidtime(tjd_ut);
  }

  /**
   * swe_sidtime0: Sidereal time at Greenwich with obliquity and nutation
   */
  swe_sidtime0(tjd_ut: number, eps: number, nut: number): number {
    return this.exports.swe_sidtime0(tjd_ut, eps, nut);
  }

  // ============================================================
  // Ayanamsa (Sidereal Mode)
  // ============================================================

  /**
   * swe_set_sid_mode: Set sidereal mode for sidereal calculations
   */
  swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void {
    this.exports.swe_set_sid_mode(sid_mode, t0, ayan_t0);
  }

  /**
   * swe_get_ayanamsa: Get ayanamsa for a given TT Julian Day
   */
  swe_get_ayanamsa(tjd_et: number): number {
    return this.exports.swe_get_ayanamsa(tjd_et);
  }

  /**
   * swe_get_ayanamsa_ut: Get ayanamsa for a given UT Julian Day
   */
  swe_get_ayanamsa_ut(tjd_ut: number): number {
    return this.exports.swe_get_ayanamsa_ut(tjd_ut);
  }

  /**
   * swe_get_ayanamsa_ex: Extended ayanamsa with ephemeris flag
   */
  swe_get_ayanamsa_ex(
    tjd_et: number,
    iflag: number,
  ): { ayanamsa: number; returnCode: number; error: string } {
    const daya_ptr = this.heap.alloc(8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_get_ayanamsa_ex(
      tjd_et,
      iflag,
      daya_ptr,
      serr_ptr,
    );

    const ayanamsa = this.heap.getF64(daya_ptr, 1)[0];
    const error = this.heap.getString(serr_ptr);

    this.heap.free(daya_ptr);
    this.heap.free(serr_ptr);

    return { ayanamsa, returnCode: ret, error };
  }

  /**
   * swe_get_ayanamsa_ex_ut: Extended ayanamsa for UT with ephemeris flag
   */
  swe_get_ayanamsa_ex_ut(
    tjd_ut: number,
    iflag: number,
  ): { ayanamsa: number; returnCode: number; error: string } {
    const daya_ptr = this.heap.alloc(8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_get_ayanamsa_ex_ut(
      tjd_ut,
      iflag,
      daya_ptr,
      serr_ptr,
    );

    const ayanamsa = this.heap.getF64(daya_ptr, 1)[0];
    const error = this.heap.getString(serr_ptr);

    this.heap.free(daya_ptr);
    this.heap.free(serr_ptr);

    return { ayanamsa, returnCode: ret, error };
  }

  /**
   * swe_get_ayanamsa_name: Get name of ayanamsa
   */
  swe_get_ayanamsa_name(isidmode: number): string {
    const ptr = this.exports.swe_get_ayanamsa_name(isidmode);
    return this.heap.getString(ptr);
  }

  // ============================================================
  // Topocentric/Geographic
  // ============================================================

  /**
   * swe_set_topo: Set geographic position for topocentric calculations
   */
  swe_set_topo(geolon: number, geolat: number, geoalt: number): void {
    this.exports.swe_set_topo(geolon, geolat, geoalt);
  }

  // ============================================================
  // Utility Functions
  // ============================================================

  /**
   * swe_get_planet_name: Get name of a planet/body
   */
  swe_get_planet_name(ipl: number): string {
    const ptr = this.heap.alloc(256);
    this.exports.swe_get_planet_name(ipl, ptr);
    const name = this.heap.getString(ptr);
    this.heap.free(ptr);
    return name;
  }

  /**
   * swe_degnorm: Normalize degrees to 0..360
   */
  swe_degnorm(x: number): number {
    return this.exports.swe_degnorm(x);
  }

  /**
   * swe_radnorm: Normalize radians to 0..2*PI
   */
  swe_radnorm(x: number): number {
    return this.exports.swe_radnorm(x);
  }

  /**
   * swe_difdeg2n: Difference of degrees normalized to -180..180
   */
  swe_difdeg2n(p1: number, p2: number): number {
    return this.exports.swe_difdeg2n(p1, p2);
  }

  /**
   * swe_deg_midp: Midpoint of two degree values
   */
  swe_deg_midp(x1: number, x0: number): number {
    return this.exports.swe_deg_midp(x1, x0);
  }

  /**
   * swe_day_of_week: Day of week (0=Monday, 6=Sunday)
   */
  swe_day_of_week(jd: number): number {
    return this.exports.swe_day_of_week(jd);
  }

  /**
   * swe_get_tid_acc: Get tidal acceleration
   */
  swe_get_tid_acc(): number {
    return this.exports.swe_get_tid_acc(0);
  }

  /**
   * swe_set_tid_acc: Set tidal acceleration
   */
  swe_set_tid_acc(t_acc: number): void {
    this.exports.swe_set_tid_acc(t_acc);
  }

  // ============================================================
  // Extended House Calculations
  // ============================================================

  /**
   * swe_houses_ex: Houses with extended flags
   */
  swe_houses_ex(
    tjd_ut: number,
    iflag: number,
    geolat: number,
    geolon: number,
    hsys: number,
  ): { cusps: Float64Array; ascmc: Float64Array; returnCode: number } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);

    const ret = this.exports.swe_houses_ex(
      tjd_ut,
      iflag,
      geolat,
      geolon,
      hsys,
      cusps_ptr,
      ascmc_ptr,
    );

    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();

    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);

    return { cusps, ascmc, returnCode: ret };
  }

  /**
   * swe_houses_armc: Houses from ARMC
   */
  swe_houses_armc(
    armc: number,
    geolat: number,
    eps: number,
    hsys: number,
  ): { cusps: Float64Array; ascmc: Float64Array; returnCode: number } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);

    const ret = this.exports.swe_houses_armc(
      armc,
      geolat,
      eps,
      hsys,
      cusps_ptr,
      ascmc_ptr,
    );

    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();

    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);

    return { cusps, ascmc, returnCode: ret };
  }

  /**
   * swe_house_pos: House position of a planet
   */
  swe_house_pos(
    armc: number,
    geolat: number,
    eps: number,
    hsys: number,
    xpin: [number, number],
  ): { position: number; error: string } {
    const xpin_ptr = this.heap.alloc(16);
    const serr_ptr = this.heap.alloc(256);

    const xpin_arr = new Float64Array([xpin[0], xpin[1]]);
    this.heap.setU8(xpin_ptr, new Uint8Array(xpin_arr.buffer));

    const pos = this.exports.swe_house_pos(
      armc,
      geolat,
      eps,
      hsys,
      xpin_ptr,
      serr_ptr,
    );

    const error = this.heap.getString(serr_ptr);
    this.heap.free(xpin_ptr);
    this.heap.free(serr_ptr);

    return { position: pos, error };
  }

  /**
   * swe_house_name: Get house system name
   */
  swe_house_name(hsys: number): string {
    const ptr = this.exports.swe_house_name(hsys);
    return this.heap.getString(ptr);
  }

  // ============================================================
  // Coordinate Transformations
  // ============================================================

  /**
   * swe_cotrans: Coordinate transformation (ecliptic <-> equatorial)
   */
  swe_cotrans(xpo: [number, number, number], eps: number): Float64Array {
    const xpo_ptr = this.heap.alloc(24);
    const xpn_ptr = this.heap.alloc(24);

    const xpo_arr = new Float64Array([xpo[0], xpo[1], xpo[2]]);
    this.heap.setU8(xpo_ptr, new Uint8Array(xpo_arr.buffer));

    this.exports.swe_cotrans(xpo_ptr, xpn_ptr, eps);

    const result = this.heap.getF64(xpn_ptr, 3).slice();
    this.heap.free(xpo_ptr);
    this.heap.free(xpn_ptr);

    return result;
  }

  /**
   * swe_azalt: Transform ecliptic/equatorial to horizontal coordinates
   */
  swe_azalt(
    tjd_ut: number,
    calc_flag: number,
    geopos: [number, number, number],
    atpress: number,
    attemp: number,
    xin: [number, number, number],
  ): Float64Array {
    const geopos_ptr = this.heap.alloc(24);
    const xin_ptr = this.heap.alloc(24);
    const xaz_ptr = this.heap.alloc(24);

    const geopos_arr = new Float64Array([geopos[0], geopos[1], geopos[2]]);
    const xin_arr = new Float64Array([xin[0], xin[1], xin[2]]);
    this.heap.setU8(geopos_ptr, new Uint8Array(geopos_arr.buffer));
    this.heap.setU8(xin_ptr, new Uint8Array(xin_arr.buffer));

    this.exports.swe_azalt(
      tjd_ut,
      calc_flag,
      geopos_ptr,
      atpress,
      attemp,
      xin_ptr,
      xaz_ptr,
    );

    const result = this.heap.getF64(xaz_ptr, 3).slice();
    this.heap.free(geopos_ptr);
    this.heap.free(xin_ptr);
    this.heap.free(xaz_ptr);

    return result;
  }

  /**
   * swe_azalt_rev: Transform horizontal to ecliptic/equatorial coordinates
   */
  swe_azalt_rev(
    tjd_ut: number,
    calc_flag: number,
    geopos: [number, number, number],
    xin: [number, number],
  ): Float64Array {
    const geopos_ptr = this.heap.alloc(24);
    const xin_ptr = this.heap.alloc(16);
    const xout_ptr = this.heap.alloc(24);

    const geopos_arr = new Float64Array([geopos[0], geopos[1], geopos[2]]);
    const xin_arr = new Float64Array([xin[0], xin[1]]);
    this.heap.setU8(geopos_ptr, new Uint8Array(geopos_arr.buffer));
    this.heap.setU8(xin_ptr, new Uint8Array(xin_arr.buffer));

    this.exports.swe_azalt_rev(
      tjd_ut,
      calc_flag,
      geopos_ptr,
      xin_ptr,
      xout_ptr,
    );

    const result = this.heap.getF64(xout_ptr, 3).slice();
    this.heap.free(geopos_ptr);
    this.heap.free(xin_ptr);
    this.heap.free(xout_ptr);

    return result;
  }

  /**
   * swe_refrac: Atmospheric refraction
   */
  swe_refrac(
    inalt: number,
    atpress: number,
    attemp: number,
    calc_flag: number,
  ): number {
    return this.exports.swe_refrac(inalt, atpress, attemp, calc_flag);
  }

  // ============================================================
  // Fixed Stars
  // ============================================================

  /**
   * swe_fixstar2: Fixed star position (faster version)
   */
  swe_fixstar2(
    star: string,
    tjd: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; starName: string; error: string } {
    const star_ptr = this.heap.alloc(256);
    const xx_ptr = this.heap.alloc(48);
    const serr_ptr = this.heap.alloc(256);

    // Copy star name to buffer (allow 256 chars for return name)
    const starBytes = new TextEncoder().encode(star + "\0");
    this.heap.setU8(star_ptr, starBytes);

    const ret = this.exports.swe_fixstar2(
      star_ptr,
      tjd,
      iflag,
      xx_ptr,
      serr_ptr,
    );

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const starName = this.heap.getString(star_ptr);
    const error = this.heap.getString(serr_ptr);

    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, starName, error };
  }

  /**
   * swe_fixstar2_ut: Fixed star position for UT (faster version)
   */
  swe_fixstar2_ut(
    star: string,
    tjd_ut: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; starName: string; error: string } {
    const star_ptr = this.heap.alloc(256);
    const xx_ptr = this.heap.alloc(48);
    const serr_ptr = this.heap.alloc(256);

    const starBytes = new TextEncoder().encode(star + "\0");
    this.heap.setU8(star_ptr, starBytes);

    const ret = this.exports.swe_fixstar2_ut(
      star_ptr,
      tjd_ut,
      iflag,
      xx_ptr,
      serr_ptr,
    );

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const starName = this.heap.getString(star_ptr);
    const error = this.heap.getString(serr_ptr);

    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, starName, error };
  }

  // ============================================================
  // Eclipse Calculations
  // ============================================================

  /**
   * swe_sol_eclipse_when_glob: Find next solar eclipse globally
   */
  swe_sol_eclipse_when_glob(
    tjd_start: number,
    ifl: number,
    ifltype: number,
    backward: boolean,
  ): { tret: Float64Array; returnCode: number; error: string } {
    const tret_ptr = this.heap.alloc(80); // 10 doubles
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_sol_eclipse_when_glob(
      tjd_start,
      ifl,
      ifltype,
      tret_ptr,
      backward ? 1 : 0,
      serr_ptr,
    );

    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);

    return { tret, returnCode: ret, error };
  }

  /**
   * swe_lun_eclipse_when: Find next lunar eclipse
   */
  swe_lun_eclipse_when(
    tjd_start: number,
    ifl: number,
    ifltype: number,
    backward: boolean,
  ): { tret: Float64Array; returnCode: number; error: string } {
    const tret_ptr = this.heap.alloc(80);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_lun_eclipse_when(
      tjd_start,
      ifl,
      ifltype,
      tret_ptr,
      backward ? 1 : 0,
      serr_ptr,
    );

    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);

    return { tret, returnCode: ret, error };
  }

  // ============================================================
  // Rise/Transit
  // ============================================================

  /**
   * swe_rise_trans: Calculate rise, set, or transit of a body
   */
  swe_rise_trans(
    tjd_ut: number,
    ipl: number,
    starname: string | null,
    epheflag: number,
    rsmi: number,
    geopos: [number, number, number],
    atpress: number,
    attemp: number,
  ): { tret: number; returnCode: number; error: string } {
    const geopos_ptr = this.heap.alloc(24);
    const tret_ptr = this.heap.alloc(8);
    const serr_ptr = this.heap.alloc(256);
    let starname_ptr = 0;

    const geopos_arr = new Float64Array([geopos[0], geopos[1], geopos[2]]);
    this.heap.setU8(geopos_ptr, new Uint8Array(geopos_arr.buffer));

    if (starname) {
      starname_ptr = this.heap.alloc(256);
      const starBytes = new TextEncoder().encode(starname + "\0");
      this.heap.setU8(starname_ptr, starBytes);
    }

    const ret = this.exports.swe_rise_trans(
      tjd_ut,
      ipl,
      starname_ptr,
      epheflag,
      rsmi,
      geopos_ptr,
      atpress,
      attemp,
      tret_ptr,
      serr_ptr,
    );

    const tret = this.heap.getF64(tret_ptr, 1)[0];
    const error = this.heap.getString(serr_ptr);

    this.heap.free(geopos_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);
    if (starname_ptr) this.heap.free(starname_ptr);

    return { tret, returnCode: ret, error };
  }

  // ============================================================
  // Phenomenological
  // ============================================================

  /**
   * swe_pheno_ut: Planetary phenomena for UT
   */
  swe_pheno_ut(
    tjd_ut: number,
    ipl: number,
    iflag: number,
  ): { attr: Float64Array; returnCode: number; error: string } {
    const attr_ptr = this.heap.alloc(160); // 20 doubles
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_pheno_ut(
      tjd_ut,
      ipl,
      iflag,
      attr_ptr,
      serr_ptr,
    );

    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);

    return { attr, returnCode: ret, error };
  }

  // ============================================================
  // Nodal/Orbital
  // ============================================================

  /**
   * swe_nod_aps: Compute nodes and apsides of planets
   */
  swe_nod_aps(
    tjd_et: number,
    ipl: number,
    iflag: number,
    method: number,
  ): {
    xnasc: Float64Array;
    xndsc: Float64Array;
    xperi: Float64Array;
    xaphe: Float64Array;
    returnCode: number;
    error: string;
  } {
    const xnasc_ptr = this.heap.alloc(48);
    const xndsc_ptr = this.heap.alloc(48);
    const xperi_ptr = this.heap.alloc(48);
    const xaphe_ptr = this.heap.alloc(48);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_nod_aps(
      tjd_et,
      ipl,
      iflag,
      method,
      xnasc_ptr,
      xndsc_ptr,
      xperi_ptr,
      xaphe_ptr,
      serr_ptr,
    );

    const xnasc = this.heap.getF64(xnasc_ptr, 6).slice();
    const xndsc = this.heap.getF64(xndsc_ptr, 6).slice();
    const xperi = this.heap.getF64(xperi_ptr, 6).slice();
    const xaphe = this.heap.getF64(xaphe_ptr, 6).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(xnasc_ptr);
    this.heap.free(xndsc_ptr);
    this.heap.free(xperi_ptr);
    this.heap.free(xaphe_ptr);
    this.heap.free(serr_ptr);

    return { xnasc, xndsc, xperi, xaphe, returnCode: ret, error };
  }

  /**
   * swe_get_orbital_elements: Compute orbital elements
   */
  swe_get_orbital_elements(
    tjd_et: number,
    ipl: number,
    iflag: number,
  ): { elements: Float64Array; returnCode: number; error: string } {
    const dret_ptr = this.heap.alloc(400); // 50 doubles
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_get_orbital_elements(
      tjd_et,
      ipl,
      iflag,
      dret_ptr,
      serr_ptr,
    );

    const elements = this.heap.getF64(dret_ptr, 50).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);

    return { elements, returnCode: ret, error };
  }

  /**
   * Close the library and free resources
   */
  close() {
    this.exports.swe_close(0);
  }
}

export interface LoadOptions {
  wasmSource?: string | URL | Uint8Array;
  ephePath?: string;
}

/**
 * Load the SwissEph WASM module and optionally mount ephemeris files
 */
export async function load(
  options: string | URL | Uint8Array | LoadOptions = {},
): Promise<SwissEph> {
  let wasmSource: string | URL | Uint8Array | undefined;
  let ephePath: string | undefined;

  if (
    options instanceof Uint8Array || typeof options === "string" ||
    options instanceof URL
  ) {
    wasmSource = options;
  } else {
    wasmSource = options.wasmSource;
    ephePath = options.ephePath;
  }

  let bytes: Uint8Array;
  if (wasmSource instanceof Uint8Array) {
    bytes = wasmSource;
  } else {
    const url = wasmSource || new URL("./libswephe.wasm", import.meta.url);
    if (typeof Deno !== "undefined") {
      bytes = await Deno.readFile(
        url instanceof URL ? url : new URL(url, import.meta.url),
      );
    } else {
      const response = await fetch(url);
      bytes = new Uint8Array(await response.arrayBuffer());
    }
  }

  const module = new WebAssembly.Module(bytes as unknown as BufferSource);
  const eph = new SwissEph(module);

  if (ephePath && typeof Deno !== "undefined") {
    // Recursively load .se1 and .sweph files from the path
    for await (const entry of Deno.readDir(ephePath)) {
      if (
        entry.isFile &&
        (entry.name.endsWith(".se1") || entry.name.endsWith(".sweph"))
      ) {
        const content = await Deno.readFile(`${ephePath}/${entry.name}`);
        eph.mount(entry.name, content);
      }
    }
    // Set internal path to current dir as we mounted them at root
    eph.set_ephe_path(".");
  }

  return eph;
}
