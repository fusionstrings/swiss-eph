import { WASI } from "./wasi.ts";
import type { WasmExports } from "./heap.ts";
import { WasmHeap } from "./heap.ts";
import { Constants } from "../generated/swisseph_api.generated.ts";
import type { SwissEphExports } from "../generated/swisseph_api.generated.ts";

export { Constants };

/**
 * Main class for Swiss Ephemeris functionality.
 *
 * This class wraps the WebAssembly module and provides a high-level API
 * for astronomical calculations. It manages the WASM memory/heap and
 * provides methods that mirror the C API of the Swiss Ephemeris library.
 */
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
   * Mount a file into the virtual filesystem.
   *
   * This is necessary for loading ephemeris files (e.g., .se1 files)
   * into the WASM environment so that the library can access them.
   *
   * @param path The virtual path where the file should be mounted (e.g., "sepl_18.se1")
   * @param content The binary content of the file
   */
  mount(path: string, content: Uint8Array) {
    this.wasi.mount(path, content);
  }

  /**
   * Set the directory path where ephemeris files are located.
   *
   * @param path The directory path (usually matches where files were mounted)
   */
  set_ephe_path(path: string) {
    const ptr = this.heap.alloc(path.length + 1);
    this.heap.setU8(ptr, new TextEncoder().encode(path + "\0"));
    this.exports.swe_set_ephe_path(ptr);
    this.heap.free(ptr);
  }

  /**
   * Compute planetary position for a given Terrestrial Time (TT) date.
   *
   * @param tjd_et Julian Day in Terrestrial Time (ET/TT)
   * @param ipl Body number (e.g., `Constants.SE_SUN`)
   * @param iflag Calculation flags (e.g., `Constants.SEFLG_SPEED`)
   * @param xx_ptr Optional pointer to pre-allocated output buffer (optimization)
   * @param serr_ptr Optional pointer to pre-allocated error buffer (optimization)
   * @returns Object containing status code, position array `xx`, and error string
   */
  swe_calc(
    tjd_et: number,
    ipl: number,
    iflag: number,
    xx_ptr?: number,
    serr_ptr?: number,
  ): { returnCode: number; xx: Float64Array; error: string } {
    let internal_xx = false;
    let internal_serr = false;
    if (xx_ptr === undefined) {
      xx_ptr = this.heap.alloc(6 * 8);
      internal_xx = true;
    }
    if (serr_ptr === undefined) {
      serr_ptr = this.heap.alloc(256);
      internal_serr = true;
    }
    const ret = this.exports.swe_calc(tjd_et, ipl, iflag, xx_ptr, serr_ptr);

    const xx = internal_xx
      ? this.heap.getF64(xx_ptr, 6).slice()
      : this.heap.getF64(xx_ptr, 6);
    const error = this.heap.getString(serr_ptr);

    if (internal_xx) this.heap.free(xx_ptr);
    if (internal_serr) this.heap.free(serr_ptr);

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
   * Compute house cusps and Ascendant/MC.
   *
   * @param tjd_ut Julian Day in Universal Time (UT)
   * @param geolat Geographic latitude (positive for north)
   * @param geolon Geographic longitude (positive for east)
   * @param hsys House system character code (e.g., 'P'.charCodeAt(0) for Placidus)
   * @returns Object containing `cusps` (array of 13 doubles, index 1-12 used) and `ascmc` (array of 10 doubles)
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
   * Compute Julian Day number from calendar date.
   *
   * @param year Year (e.g., 2024)
   * @param month Month (1-12)
   * @param day Day of month
   * @param hour Hour (decimal, e.g., 13.5 for 13:30)
   * @param gregflag Calendar flag (`Constants.SE_GREG_CAL` or `Constants.SE_JUL_CAL`)
   * @returns Julian Day number
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
   * Get the version of the underlying Swiss Ephemeris library.
   *
   * @returns Version string (e.g., "2.10.03")
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
   * Convert Julian Day number to calendar date.
   *
   * @param jd Julian Day number
   * @param gregflag Calendar flag (`Constants.SE_GREG_CAL` or `Constants.SE_JUL_CAL`)
   * @returns Object containing year, month, day, and fractional hour
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
   * Convert UTC date to Julian Day (both ET and UT).
   *
   * @param year Year
   * @param month Month
   * @param day Day
   * @param hour Hour
   * @param min Minute
   * @param sec Second
   * @param gregflag Calendar flag
   * @returns Object containing `et` (Ephemeris Time JD), `ut` (Universal Time JD), status code, and error string
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
   * Compute Delta T (TT - UT) for a given Julian Day.
   *
   * @param tjd Julian Day
   * @param iflag Ephemeris flag (ensure `SEFLG_SWIEPH` is set for best accuracy)
   * @returns Object containing `dt` (Delta T in days) and error string
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
   * Compute fixed star position.
   *
   * @param star Star name
   * @param tjd Julian Day (TT)
   * @param iflag Ephemeris flags
   * @returns Object containing status code, position array `xx`, star name (resolved), and error string
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
   * Compute fixed star position (UT).
   *
   * @param star Star name
   * @param tjd_ut Julian Day (UT)
   * @param iflag Ephemeris flags
   * @returns Object containing status code, position array `xx`, star name (resolved), and error string
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
   * Find the next solar eclipse globally.
   *
   * @param tjd_start Start Julian Day for search
   * @param ifl Ephemeris flags
   * @param ifltype Eclipse type to search for (0 for any)
   * @param backward True to search backward in time
   * @returns Object containing `tret` (results array), status code, and error string
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
   * Calculate rise, set, or transit times for a body.
   *
   * @param tjd_ut Start Julian Day (UT)
   * @param ipl Body number
   * @param starname Star name (if ipl is 0)
   * @param epheflag Ephemeris flags
   * @param rsmi Event flag (e.g., `Constants.SE_CALC_RISE`)
   * @param geopos Geographic position [lon, lat, alt]
   * @param atpress Atmospheric pressure (mbar)
   * @param attemp Atmospheric temperature (deg C)
   * @returns Object containing `tret` (time of event), status code, and error string
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

  // ============================================================
  // Heliacal Events
  // ============================================================

  /**
   * Calculate heliacal events (rise, set, etc.) for a body.
   *
   * @param tjdstart_ut Start Julian Day (UT)
   * @param geopos Geographic position [lon, lat, alt]
   * @param datm Atmospheric parameters [press, temp, humid, ...]
   * @param dobs Observer parameters
   * @param ObjectName Name of the object
   * @param TypeEvent Type of event
   * @param iflag Ephemeris flags
   * @returns Object containing status code, result array `dret`, and error string
   */
  swe_heliacal_ut(
    tjdstart_ut: number,
    geopos: number[],
    datm: number[],
    dobs: number[],
    ObjectName: string,
    TypeEvent: number,
    iflag: number,
  ): { returnCode: number; dret: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_ut(
      tjdstart_ut,
      geopos_ptr,
      datm_ptr,
      dobs_ptr,
      ObjectName_ptr,
      TypeEvent,
      iflag,
      dret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dret = this.heap.getF64(dret_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(datm_ptr);
    this.heap.free(dobs_ptr);
    this.heap.free(ObjectName_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dret, serr };
  }

  /**
   * swe_heliacal_pheno_ut
   */
  swe_heliacal_pheno_ut(
    tjd_ut: number,
    geopos: number[],
    datm: number[],
    dobs: number[],
    ObjectName: string,
    TypeEvent: number,
    helflag: number,
  ): { returnCode: number; darr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const darr_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_pheno_ut(
      tjd_ut,
      geopos_ptr,
      datm_ptr,
      dobs_ptr,
      ObjectName_ptr,
      TypeEvent,
      helflag,
      darr_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const darr = this.heap.getF64(darr_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(datm_ptr);
    this.heap.free(dobs_ptr);
    this.heap.free(ObjectName_ptr);
    this.heap.free(darr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, darr, serr };
  }

  /**
   * swe_vis_limit_mag
   */
  swe_vis_limit_mag(
    tjdut: number,
    geopos: number[],
    datm: number[],
    dobs: number[],
    ObjectName: string,
    helflag: number,
  ): { returnCode: number; dret: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_vis_limit_mag(
      tjdut,
      geopos_ptr,
      datm_ptr,
      dobs_ptr,
      ObjectName_ptr,
      helflag,
      dret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dret = this.heap.getF64(dret_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(datm_ptr);
    this.heap.free(dobs_ptr);
    this.heap.free(ObjectName_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dret, serr };
  }

  /**
   * swe_heliacal_angle
   */
  swe_heliacal_angle(
    tjdut: number,
    datm: number[],
    dobs: number[],
    helflag: number,
    mag: number,
    azi_obj: number,
    azi_sun: number,
    azi_moon: number,
    alt_moon: number,
  ): { returnCode: number; dgeo: any; dret: any; serr: any } {
    const dgeo_ptr = this.heap.alloc(6 * 8);
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_angle(
      tjdut,
      dgeo_ptr,
      datm_ptr,
      dobs_ptr,
      helflag,
      mag,
      azi_obj,
      azi_sun,
      azi_moon,
      alt_moon,
      dret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dgeo = this.heap.getF64(dgeo_ptr, 6).slice();
    const dret = this.heap.getF64(dret_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(dgeo_ptr);
    this.heap.free(datm_ptr);
    this.heap.free(dobs_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dgeo, dret, serr };
  }

  /**
   * swe_topo_arcus_visionis
   */
  swe_topo_arcus_visionis(
    tjdut: number,
    datm: number[],
    dobs: number[],
    helflag: number,
    mag: number,
    azi_obj: number,
    alt_obj: number,
    azi_sun: number,
    azi_moon: number,
    alt_moon: number,
  ): { returnCode: number; dgeo: any; dret: any; serr: any } {
    const dgeo_ptr = this.heap.alloc(6 * 8);
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_topo_arcus_visionis(
      tjdut,
      dgeo_ptr,
      datm_ptr,
      dobs_ptr,
      helflag,
      mag,
      azi_obj,
      alt_obj,
      azi_sun,
      azi_moon,
      alt_moon,
      dret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dgeo = this.heap.getF64(dgeo_ptr, 6).slice();
    const dret = this.heap.getF64(dret_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(dgeo_ptr);
    this.heap.free(datm_ptr);
    this.heap.free(dobs_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dgeo, dret, serr };
  }

  /**
   * swe_set_astro_models
   */
  swe_set_astro_models(samod: string, iflag: number): void {
    const samod_ptr = this.heap.putString(samod);
    this.exports.swe_set_astro_models(samod_ptr, iflag);
    this.heap.free(samod_ptr);
  }

  /**
   * swe_get_astro_models
   */
  swe_get_astro_models(samod: string, sdet: string, iflag: number): void {
    const samod_ptr = this.heap.putString(samod);
    const sdet_ptr = this.heap.putString(sdet);
    this.exports.swe_get_astro_models(samod_ptr, sdet_ptr, iflag);
    this.heap.free(samod_ptr);
    this.heap.free(sdet_ptr);
  }

  /**
   * swe_get_library_path
   */
  swe_get_library_path(arg0: string): { returnCode: number } {
    const arg0_ptr = this.heap.putString(arg0);
    const ret = this.exports.swe_get_library_path(arg0_ptr);
    const returnCode = ret;
    this.heap.free(arg0_ptr);
    return { returnCode };
  }

  /**
   * swe_calc_pctr
   */
  swe_calc_pctr(
    tjd: number,
    ipl: number,
    iplctr: number,
    iflag: number,
  ): { returnCode: number; xxret: any; serr: any } {
    const xxret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_calc_pctr(
      tjd,
      ipl,
      iplctr,
      iflag,
      xxret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xxret = this.heap.getF64(xxret_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(xxret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xxret, serr };
  }

  /**
   * swe_solcross
   */
  swe_solcross(
    x2cross: number,
    jd_et: number,
    flag: number,
  ): { returnCode: number; serr: any } {
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_solcross(x2cross, jd_et, flag, serr_ptr);
    const returnCode = ret;
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
  }

  /**
   * swe_solcross_ut
   */
  swe_solcross_ut(
    x2cross: number,
    jd_ut: number,
    flag: number,
  ): { returnCode: number; serr: any } {
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_solcross_ut(x2cross, jd_ut, flag, serr_ptr);
    const returnCode = ret;
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
  }

  /**
   * swe_mooncross
   */
  swe_mooncross(
    x2cross: number,
    jd_et: number,
    flag: number,
  ): { returnCode: number; serr: any } {
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross(x2cross, jd_et, flag, serr_ptr);
    const returnCode = ret;
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
  }

  /**
   * swe_mooncross_ut
   */
  swe_mooncross_ut(
    x2cross: number,
    jd_ut: number,
    flag: number,
  ): { returnCode: number; serr: any } {
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross_ut(x2cross, jd_ut, flag, serr_ptr);
    const returnCode = ret;
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
  }

  /**
   * swe_mooncross_node
   */
  swe_mooncross_node(
    jd_et: number,
    flag: number,
  ): { returnCode: number; xlon: any; xlat: any; serr: any } {
    const xlon_ptr = this.heap.alloc(6 * 8);
    const xlat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross_node(
      jd_et,
      flag,
      xlon_ptr,
      xlat_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xlon = this.heap.getF64(xlon_ptr, 6).slice();
    const xlat = this.heap.getF64(xlat_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(xlon_ptr);
    this.heap.free(xlat_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xlon, xlat, serr };
  }

  /**
   * swe_mooncross_node_ut
   */
  swe_mooncross_node_ut(
    jd_ut: number,
    flag: number,
  ): { returnCode: number; xlon: any; xlat: any; serr: any } {
    const xlon_ptr = this.heap.alloc(6 * 8);
    const xlat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross_node_ut(
      jd_ut,
      flag,
      xlon_ptr,
      xlat_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xlon = this.heap.getF64(xlon_ptr, 6).slice();
    const xlat = this.heap.getF64(xlat_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(xlon_ptr);
    this.heap.free(xlat_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xlon, xlat, serr };
  }

  /**
   * swe_helio_cross
   */
  swe_helio_cross(
    ipl: number,
    x2cross: number,
    jd_et: number,
    iflag: number,
    dir: number,
  ): { returnCode: number; jd_cross: any; serr: any } {
    const jd_cross_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_helio_cross(
      ipl,
      x2cross,
      jd_et,
      iflag,
      dir,
      jd_cross_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const jd_cross = this.heap.getF64(jd_cross_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(jd_cross_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, jd_cross, serr };
  }

  /**
   * swe_helio_cross_ut
   */
  swe_helio_cross_ut(
    ipl: number,
    x2cross: number,
    jd_ut: number,
    iflag: number,
    dir: number,
  ): { returnCode: number; jd_cross: any; serr: any } {
    const jd_cross_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_helio_cross_ut(
      ipl,
      x2cross,
      jd_ut,
      iflag,
      dir,
      jd_cross_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const jd_cross = this.heap.getF64(jd_cross_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(jd_cross_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, jd_cross, serr };
  }

  /**
   * swe_fixstar
   */
  swe_fixstar(
    star: string,
    tjd: number,
    iflag: number,
  ): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar(
      star_ptr,
      tjd,
      iflag,
      xx_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
  }

  /**
   * swe_fixstar_ut
   */
  swe_fixstar_ut(
    star: string,
    tjd_ut: number,
    iflag: number,
  ): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar_ut(
      star_ptr,
      tjd_ut,
      iflag,
      xx_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
  }

  /**
   * swe_fixstar_mag
   */
  swe_fixstar_mag(star: string): { returnCode: number; mag: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const mag_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar_mag(star_ptr, mag_ptr, serr_ptr);
    const returnCode = ret;
    const mag = this.heap.getF64(mag_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(mag_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, mag, serr };
  }

  /**
   * swe_fixstar2_mag
   */
  swe_fixstar2_mag(star: string): { returnCode: number; mag: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const mag_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar2_mag(star_ptr, mag_ptr, serr_ptr);
    const returnCode = ret;
    const mag = this.heap.getF64(mag_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(mag_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, mag, serr };
  }

  /**
   * swe_close
   */
  swe_close(arg0: number): void {
    this.exports.swe_close(arg0);
  }

  /**
   * swe_set_ephe_path
   */
  swe_set_ephe_path(path: number): void {
    this.exports.swe_set_ephe_path(path);
  }

  /**
   * swe_set_jpl_file
   */
  swe_set_jpl_file(fname: number): void {
    this.exports.swe_set_jpl_file(fname);
  }

  /**
   * swe_get_current_file_data
   */
  swe_get_current_file_data(
    ifno: number,
  ): { returnCode: number; tfstart: any; tfend: any; denum: any } {
    const tfstart_ptr = this.heap.alloc(6 * 8);
    const tfend_ptr = this.heap.alloc(6 * 8);
    const denum_ptr = this.heap.alloc(4);
    const ret = this.exports.swe_get_current_file_data(
      ifno,
      tfstart_ptr,
      tfend_ptr,
      denum_ptr,
    );
    const returnCode = ret;
    const tfstart = this.heap.getF64(tfstart_ptr, 6).slice();
    const tfend = this.heap.getF64(tfend_ptr, 6).slice();
    const denum = this.heap.getI32(denum_ptr);
    this.heap.free(tfstart_ptr);
    this.heap.free(tfend_ptr);
    this.heap.free(denum_ptr);
    return { returnCode, tfstart, tfend, denum };
  }

  /**
   * swe_set_timeout
   */
  swe_set_timeout(tsec: number): void {
    this.exports.swe_set_timeout(tsec);
  }

  /**
   * swe_date_conversion
   */
  swe_date_conversion(
    y: number,
    m: number,
    d: number,
    year: number,
    arg4: number,
    c: number,
  ): { returnCode: number; utime: any; tjd: any } {
    const utime_ptr = this.heap.alloc(6 * 8);
    const tjd_ptr = this.heap.alloc(6 * 8);
    const ret = this.exports.swe_date_conversion(
      y,
      m,
      d,
      year,
      arg4,
      utime_ptr,
      c,
      tjd_ptr,
    );
    const returnCode = ret;
    const utime = this.heap.getF64(utime_ptr, 6).slice();
    const tjd = this.heap.getF64(tjd_ptr, 6).slice();
    this.heap.free(utime_ptr);
    this.heap.free(tjd_ptr);
    return { returnCode, utime, tjd };
  }

  /**
   * swe_utc_time_zone
   */
  swe_utc_time_zone(
    iyear: number,
    imonth: number,
    iday: number,
    ihour: number,
    imin: number,
    dsec: number,
    d_timezone: number,
  ): {
    iyear_out: any;
    imonth_out: any;
    iday_out: any;
    ihour_out: any;
    imin_out: any;
    dsec_out: any;
  } {
    const iyear_out_ptr = this.heap.alloc(4);
    const imonth_out_ptr = this.heap.alloc(4);
    const iday_out_ptr = this.heap.alloc(4);
    const ihour_out_ptr = this.heap.alloc(4);
    const imin_out_ptr = this.heap.alloc(4);
    const dsec_out_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_utc_time_zone(
      iyear,
      imonth,
      iday,
      ihour,
      imin,
      dsec,
      d_timezone,
      iyear_out_ptr,
      imonth_out_ptr,
      iday_out_ptr,
      ihour_out_ptr,
      imin_out_ptr,
      dsec_out_ptr,
    );
    const iyear_out = this.heap.getI32(iyear_out_ptr);
    const imonth_out = this.heap.getI32(imonth_out_ptr);
    const iday_out = this.heap.getI32(iday_out_ptr);
    const ihour_out = this.heap.getI32(ihour_out_ptr);
    const imin_out = this.heap.getI32(imin_out_ptr);
    const dsec_out = this.heap.getF64(dsec_out_ptr, 6).slice();
    this.heap.free(iyear_out_ptr);
    this.heap.free(imonth_out_ptr);
    this.heap.free(iday_out_ptr);
    this.heap.free(ihour_out_ptr);
    this.heap.free(imin_out_ptr);
    this.heap.free(dsec_out_ptr);
    return { iyear_out, imonth_out, iday_out, ihour_out, imin_out, dsec_out };
  }

  /**
   * swe_houses_ex2
   */
  swe_houses_ex2(
    tjd_ut: number,
    iflag: number,
    geolat: number,
    geolon: number,
    hsys: number,
  ): {
    returnCode: number;
    cusps: any;
    ascmc: any;
    cusp_speed: any;
    ascmc_speed: any;
    serr: any;
  } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const cusp_speed_ptr = this.heap.alloc(13 * 8);
    const ascmc_speed_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_houses_ex2(
      tjd_ut,
      iflag,
      geolat,
      geolon,
      hsys,
      cusps_ptr,
      ascmc_ptr,
      cusp_speed_ptr,
      ascmc_speed_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();
    const cusp_speed = this.heap.getF64(cusp_speed_ptr, 13).slice();
    const ascmc_speed = this.heap.getF64(ascmc_speed_ptr, 10).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    this.heap.free(cusp_speed_ptr);
    this.heap.free(ascmc_speed_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, cusps, ascmc, cusp_speed, ascmc_speed, serr };
  }

  /**
   * swe_houses_armc_ex2
   */
  swe_houses_armc_ex2(
    armc: number,
    geolat: number,
    eps: number,
    hsys: number,
  ): {
    returnCode: number;
    cusps: any;
    ascmc: any;
    cusp_speed: any;
    ascmc_speed: any;
    serr: any;
  } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const cusp_speed_ptr = this.heap.alloc(13 * 8);
    const ascmc_speed_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_houses_armc_ex2(
      armc,
      geolat,
      eps,
      hsys,
      cusps_ptr,
      ascmc_ptr,
      cusp_speed_ptr,
      ascmc_speed_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();
    const cusp_speed = this.heap.getF64(cusp_speed_ptr, 13).slice();
    const ascmc_speed = this.heap.getF64(ascmc_speed_ptr, 10).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    this.heap.free(cusp_speed_ptr);
    this.heap.free(ascmc_speed_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, cusps, ascmc, cusp_speed, ascmc_speed, serr };
  }

  /**
   * swe_gauquelin_sector
   */
  swe_gauquelin_sector(
    t_ut: number,
    ipl: number,
    starname: string,
    iflag: number,
    imeth: number,
    geopos: number[],
    atpress: number,
    attemp: number,
  ): { returnCode: number; dgsect: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const dgsect_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_gauquelin_sector(
      t_ut,
      ipl,
      starname_ptr,
      iflag,
      imeth,
      geopos_ptr,
      atpress,
      attemp,
      dgsect_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dgsect = this.heap.getF64(dgsect_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(starname_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(dgsect_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dgsect, serr };
  }

  /**
   * swe_sol_eclipse_where
   */
  swe_sol_eclipse_where(
    tjd: number,
    ifl: number,
    geopos: number[],
  ): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_where(
      tjd,
      ifl,
      geopos_ptr,
      attr_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_lun_occult_where
   */
  swe_lun_occult_where(
    tjd: number,
    ipl: number,
    starname: string,
    ifl: number,
    geopos: number[],
  ): { returnCode: number; attr: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_where(
      tjd,
      ipl,
      starname_ptr,
      ifl,
      geopos_ptr,
      attr_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(starname_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_sol_eclipse_how
   */
  swe_sol_eclipse_how(
    tjd: number,
    ifl: number,
    geopos: number[],
  ): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_how(
      tjd,
      ifl,
      geopos_ptr,
      attr_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_sol_eclipse_when_loc
   */
  swe_sol_eclipse_when_loc(
    tjd_start: number,
    ifl: number,
    geopos: number[],
    backward: number,
  ): { returnCode: number; tret: any; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_when_loc(
      tjd_start,
      ifl,
      geopos_ptr,
      tret_ptr,
      attr_ptr,
      backward,
      serr_ptr,
    );
    const returnCode = ret;
    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, attr, serr };
  }

  /**
   * swe_lun_occult_when_loc
   */
  swe_lun_occult_when_loc(
    tjd_start: number,
    ipl: number,
    starname: string,
    ifl: number,
    geopos: number[],
    backward: number,
  ): { returnCode: number; tret: any; attr: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_when_loc(
      tjd_start,
      ipl,
      starname_ptr,
      ifl,
      geopos_ptr,
      tret_ptr,
      attr_ptr,
      backward,
      serr_ptr,
    );
    const returnCode = ret;
    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(starname_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, attr, serr };
  }

  /**
   * swe_lun_occult_when_glob
   */
  swe_lun_occult_when_glob(
    tjd_start: number,
    ipl: number,
    starname: string,
    ifl: number,
    ifltype: number,
    backward: number,
  ): { returnCode: number; tret: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_when_glob(
      tjd_start,
      ipl,
      starname_ptr,
      ifl,
      ifltype,
      tret_ptr,
      backward,
      serr_ptr,
    );
    const returnCode = ret;
    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(starname_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, serr };
  }

  /**
   * swe_lun_eclipse_how
   */
  swe_lun_eclipse_how(
    tjd_ut: number,
    ifl: number,
    geopos: number[],
  ): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_eclipse_how(
      tjd_ut,
      ifl,
      geopos_ptr,
      attr_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_lun_eclipse_when_loc
   */
  swe_lun_eclipse_when_loc(
    tjd_start: number,
    ifl: number,
    geopos: number[],
    backward: number,
  ): { returnCode: number; tret: any; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_eclipse_when_loc(
      tjd_start,
      ifl,
      geopos_ptr,
      tret_ptr,
      attr_ptr,
      backward,
      serr_ptr,
    );
    const returnCode = ret;
    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, attr, serr };
  }

  /**
   * swe_pheno
   */
  swe_pheno(
    tjd: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; attr: any; serr: any } {
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_pheno(tjd, ipl, iflag, attr_ptr, serr_ptr);
    const returnCode = ret;
    const attr = this.heap.getF64(attr_ptr, 20).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_refrac_extended
   */
  swe_refrac_extended(
    inalt: number,
    geoalt: number,
    atpress: number,
    attemp: number,
    lapse_rate: number,
    calc_flag: number,
  ): { returnCode: number; dret: any } {
    const dret_ptr = this.heap.alloc(6 * 8);
    const ret = this.exports.swe_refrac_extended(
      inalt,
      geoalt,
      atpress,
      attemp,
      lapse_rate,
      calc_flag,
      dret_ptr,
    );
    const returnCode = ret;
    const dret = this.heap.getF64(dret_ptr, 6).slice();
    this.heap.free(dret_ptr);
    return { returnCode, dret };
  }

  /**
   * swe_set_lapse_rate
   */
  swe_set_lapse_rate(lapse_rate: number): void {
    this.exports.swe_set_lapse_rate(lapse_rate);
  }

  /**
   * swe_rise_trans_true_hor
   */
  swe_rise_trans_true_hor(
    tjd_ut: number,
    ipl: number,
    starname: string,
    epheflag: number,
    rsmi: number,
    geopos: number[],
    atpress: number,
    attemp: number,
    horhgt: number,
  ): { returnCode: number; tret: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(
      geopos_ptr,
      new Uint8Array(new Float64Array(geopos).buffer),
    );
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_rise_trans_true_hor(
      tjd_ut,
      ipl,
      starname_ptr,
      epheflag,
      rsmi,
      geopos_ptr,
      atpress,
      attemp,
      horhgt,
      tret_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const tret = this.heap.getF64(tret_ptr, 10).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(starname_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, serr };
  }

  /**
   * swe_nod_aps_ut
   */
  swe_nod_aps_ut(
    tjd_ut: number,
    ipl: number,
    iflag: number,
    method: number,
  ): {
    returnCode: number;
    xnasc: any;
    xndsc: any;
    xperi: any;
    xaphe: any;
    serr: any;
  } {
    const xnasc_ptr = this.heap.alloc(6 * 8);
    const xndsc_ptr = this.heap.alloc(6 * 8);
    const xperi_ptr = this.heap.alloc(6 * 8);
    const xaphe_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_nod_aps_ut(
      tjd_ut,
      ipl,
      iflag,
      method,
      xnasc_ptr,
      xndsc_ptr,
      xperi_ptr,
      xaphe_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const xnasc = this.heap.getF64(xnasc_ptr, 6).slice();
    const xndsc = this.heap.getF64(xndsc_ptr, 6).slice();
    const xperi = this.heap.getF64(xperi_ptr, 6).slice();
    const xaphe = this.heap.getF64(xaphe_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(xnasc_ptr);
    this.heap.free(xndsc_ptr);
    this.heap.free(xperi_ptr);
    this.heap.free(xaphe_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xnasc, xndsc, xperi, xaphe, serr };
  }

  /**
   * swe_orbit_max_min_true_distance
   */
  swe_orbit_max_min_true_distance(
    tjd_et: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; dmax: any; dmin: any; dtrue: any; serr: any } {
    const dmax_ptr = this.heap.alloc(6 * 8);
    const dmin_ptr = this.heap.alloc(6 * 8);
    const dtrue_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_orbit_max_min_true_distance(
      tjd_et,
      ipl,
      iflag,
      dmax_ptr,
      dmin_ptr,
      dtrue_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const dmax = this.heap.getF64(dmax_ptr, 6).slice();
    const dmin = this.heap.getF64(dmin_ptr, 6).slice();
    const dtrue = this.heap.getF64(dtrue_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(dmax_ptr);
    this.heap.free(dmin_ptr);
    this.heap.free(dtrue_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dmax, dmin, dtrue, serr };
  }

  /**
   * swe_time_equ
   */
  swe_time_equ(tjd: number): { returnCode: number; te: any; serr: any } {
    const te_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_time_equ(tjd, te_ptr, serr_ptr);
    const returnCode = ret;
    const te = this.heap.getF64(te_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(te_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, te, serr };
  }

  /**
   * swe_lmt_to_lat
   */
  swe_lmt_to_lat(
    tjd_lmt: number,
    geolon: number,
  ): { returnCode: number; tjd_lat: any; serr: any } {
    const tjd_lat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lmt_to_lat(
      tjd_lmt,
      geolon,
      tjd_lat_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const tjd_lat = this.heap.getF64(tjd_lat_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(tjd_lat_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tjd_lat, serr };
  }

  /**
   * swe_lat_to_lmt
   */
  swe_lat_to_lmt(
    tjd_lat: number,
    geolon: number,
  ): { returnCode: number; tjd_lmt: any; serr: any } {
    const tjd_lmt_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lat_to_lmt(
      tjd_lat,
      geolon,
      tjd_lmt_ptr,
      serr_ptr,
    );
    const returnCode = ret;
    const tjd_lmt = this.heap.getF64(tjd_lmt_ptr, 6).slice();
    const serr = this.heap.getString(serr_ptr);
    this.heap.free(tjd_lmt_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tjd_lmt, serr };
  }

  /**
   * swe_set_interpolate_nut
   */
  swe_set_interpolate_nut(do_interpolate: number): void {
    this.exports.swe_set_interpolate_nut(do_interpolate);
  }

  /**
   * swe_cotrans_sp
   */
  swe_cotrans_sp(xpo: number[], eps: number): { xpn: any } {
    const xpo_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(xpo_ptr, new Uint8Array(new Float64Array(xpo).buffer));
    const xpn_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_cotrans_sp(xpo_ptr, xpn_ptr, eps);
    const xpn = this.heap.getF64(xpn_ptr, 6).slice();
    this.heap.free(xpo_ptr);
    this.heap.free(xpn_ptr);
    return { xpn };
  }

  /**
   * swe_set_delta_t_userdef
   */
  swe_set_delta_t_userdef(dt: number): void {
    this.exports.swe_set_delta_t_userdef(dt);
  }

  /**
   * swe_rad_midp
   */
  swe_rad_midp(x1: number, x0: number): { returnCode: number } {
    const ret = this.exports.swe_rad_midp(x1, x0);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_split_deg
   */
  swe_split_deg(
    ddeg: number,
    roundflag: number,
  ): { ideg: any; imin: any; isec: any; dsecfr: any; isgn: any } {
    const ideg_ptr = this.heap.alloc(4);
    const imin_ptr = this.heap.alloc(4);
    const isec_ptr = this.heap.alloc(4);
    const dsecfr_ptr = this.heap.alloc(6 * 8);
    const isgn_ptr = this.heap.alloc(4);
    this.exports.swe_split_deg(
      ddeg,
      roundflag,
      ideg_ptr,
      imin_ptr,
      isec_ptr,
      dsecfr_ptr,
      isgn_ptr,
    );
    const ideg = this.heap.getI32(ideg_ptr);
    const imin = this.heap.getI32(imin_ptr);
    const isec = this.heap.getI32(isec_ptr);
    const dsecfr = this.heap.getF64(dsecfr_ptr, 6).slice();
    const isgn = this.heap.getI32(isgn_ptr);
    this.heap.free(ideg_ptr);
    this.heap.free(imin_ptr);
    this.heap.free(isec_ptr);
    this.heap.free(dsecfr_ptr);
    this.heap.free(isgn_ptr);
    return { ideg, imin, isec, dsecfr, isgn };
  }

  /**
   * swe_csnorm
   */
  swe_csnorm(p: number): { returnCode: number } {
    const ret = this.exports.swe_csnorm(p);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_difcsn
   */
  swe_difcsn(p1: number, p2: number): { returnCode: number } {
    const ret = this.exports.swe_difcsn(p1, p2);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_difdegn
   */
  swe_difdegn(p1: number, p2: number): { returnCode: number } {
    const ret = this.exports.swe_difdegn(p1, p2);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_difcs2n
   */
  swe_difcs2n(p1: number, p2: number): { returnCode: number } {
    const ret = this.exports.swe_difcs2n(p1, p2);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_difrad2n
   */
  swe_difrad2n(p1: number, p2: number): { returnCode: number } {
    const ret = this.exports.swe_difrad2n(p1, p2);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_csroundsec
   */
  swe_csroundsec(x: number): { returnCode: number } {
    const ret = this.exports.swe_csroundsec(x);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_d2l
   */
  swe_d2l(x: number): { returnCode: number } {
    const ret = this.exports.swe_d2l(x);
    const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_cs2timestr
   */
  swe_cs2timestr(
    t: number,
    sep: number,
    suppressZero: number,
    a: string,
  ): { returnCode: number } {
    const a_ptr = this.heap.putString(a);
    const ret = this.exports.swe_cs2timestr(t, sep, suppressZero, a_ptr);
    const returnCode = ret;
    this.heap.free(a_ptr);
    return { returnCode };
  }

  /**
   * swe_cs2lonlatstr
   */
  swe_cs2lonlatstr(
    t: number,
    pchar: number,
    mchar: number,
    s: string,
  ): { returnCode: number } {
    const s_ptr = this.heap.putString(s);
    const ret = this.exports.swe_cs2lonlatstr(t, pchar, mchar, s_ptr);
    const returnCode = ret;
    this.heap.free(s_ptr);
    return { returnCode };
  }

  /**
   * swe_cs2degstr
   */
  swe_cs2degstr(t: number, a: string): { returnCode: number } {
    const a_ptr = this.heap.putString(a);
    const ret = this.exports.swe_cs2degstr(t, a_ptr);
    const returnCode = ret;
    this.heap.free(a_ptr);
    return { returnCode };
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
    const url = wasmSource ||
      new URL("../generated/libswephe.wasm", import.meta.url);
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
