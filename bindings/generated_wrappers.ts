// Auto-generated wrappers by scripts/codegen.ts
// Copy these methods into mod.ts SwissEph class

  /**
   * swe_heliacal_ut
   */
  swe_heliacal_ut(tjdstart_ut: number, geopos: number[], datm: number[], dobs: number[], ObjectName: string, TypeEvent: number, iflag: number): { returnCode: number; dret: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_ut(tjdstart_ut, geopos_ptr, datm_ptr, dobs_ptr, ObjectName_ptr, TypeEvent, iflag, dret_ptr, serr_ptr);
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
  swe_heliacal_pheno_ut(tjd_ut: number, geopos: number[], datm: number[], dobs: number[], ObjectName: string, TypeEvent: number, helflag: number): { returnCode: number; darr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const darr_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_pheno_ut(tjd_ut, geopos_ptr, datm_ptr, dobs_ptr, ObjectName_ptr, TypeEvent, helflag, darr_ptr, serr_ptr);
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
  swe_vis_limit_mag(tjdut: number, geopos: number[], datm: number[], dobs: number[], ObjectName: string, helflag: number): { returnCode: number; dret: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const ObjectName_ptr = this.heap.putString(ObjectName);
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_vis_limit_mag(tjdut, geopos_ptr, datm_ptr, dobs_ptr, ObjectName_ptr, helflag, dret_ptr, serr_ptr);
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
  swe_heliacal_angle(tjdut: number, datm: number[], dobs: number[], helflag: number, mag: number, azi_obj: number, azi_sun: number, azi_moon: number, alt_moon: number): { returnCode: number; dgeo: any; dret: any; serr: any } {
    const dgeo_ptr = this.heap.alloc(6 * 8);
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_heliacal_angle(tjdut, dgeo_ptr, datm_ptr, dobs_ptr, helflag, mag, azi_obj, azi_sun, azi_moon, alt_moon, dret_ptr, serr_ptr);
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
  swe_topo_arcus_visionis(tjdut: number, datm: number[], dobs: number[], helflag: number, mag: number, azi_obj: number, alt_obj: number, azi_sun: number, azi_moon: number, alt_moon: number): { returnCode: number; dgeo: any; dret: any; serr: any } {
    const dgeo_ptr = this.heap.alloc(6 * 8);
    const datm_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(datm_ptr, new Uint8Array(new Float64Array(datm).buffer));
    const dobs_ptr = this.heap.alloc(6 * 8);
    this.heap.setU8(dobs_ptr, new Uint8Array(new Float64Array(dobs).buffer));
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_topo_arcus_visionis(tjdut, dgeo_ptr, datm_ptr, dobs_ptr, helflag, mag, azi_obj, alt_obj, azi_sun, azi_moon, alt_moon, dret_ptr, serr_ptr);
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
   * swe_version
   */
  swe_version(arg0: string): { returnCode: number } {
    const arg0_ptr = this.heap.putString(arg0);
    const ret = this.exports.swe_version(arg0_ptr);
const returnCode = ret;
    this.heap.free(arg0_ptr);
    return { returnCode };
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
   * swe_calc
   */
  swe_calc(tjd: number, ipl: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_calc(tjd, ipl, iflag, xx_ptr, serr_ptr);
const returnCode = ret;
const xx = this.heap.getF64(xx_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
  }

  /**
   * swe_calc_ut
   */
  swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_calc_ut(tjd_ut, ipl, iflag, xx_ptr, serr_ptr);
const returnCode = ret;
const xx = this.heap.getF64(xx_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
  }

  /**
   * swe_calc_pctr
   */
  swe_calc_pctr(tjd: number, ipl: number, iplctr: number, iflag: number): { returnCode: number; xxret: any; serr: any } {
    const xxret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_calc_pctr(tjd, ipl, iplctr, iflag, xxret_ptr, serr_ptr);
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
  swe_solcross(x2cross: number, jd_et: number, flag: number): { returnCode: number; serr: any } {
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
  swe_solcross_ut(x2cross: number, jd_ut: number, flag: number): { returnCode: number; serr: any } {
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
  swe_mooncross(x2cross: number, jd_et: number, flag: number): { returnCode: number; serr: any } {
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
  swe_mooncross_ut(x2cross: number, jd_ut: number, flag: number): { returnCode: number; serr: any } {
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
  swe_mooncross_node(jd_et: number, flag: number): { returnCode: number; xlon: any; xlat: any; serr: any } {
    const xlon_ptr = this.heap.alloc(6 * 8);
    const xlat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross_node(jd_et, flag, xlon_ptr, xlat_ptr, serr_ptr);
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
  swe_mooncross_node_ut(jd_ut: number, flag: number): { returnCode: number; xlon: any; xlat: any; serr: any } {
    const xlon_ptr = this.heap.alloc(6 * 8);
    const xlat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_mooncross_node_ut(jd_ut, flag, xlon_ptr, xlat_ptr, serr_ptr);
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
  swe_helio_cross(ipl: number, x2cross: number, jd_et: number, iflag: number, dir: number): { returnCode: number; jd_cross: any; serr: any } {
    const jd_cross_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_helio_cross(ipl, x2cross, jd_et, iflag, dir, jd_cross_ptr, serr_ptr);
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
  swe_helio_cross_ut(ipl: number, x2cross: number, jd_ut: number, iflag: number, dir: number): { returnCode: number; jd_cross: any; serr: any } {
    const jd_cross_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_helio_cross_ut(ipl, x2cross, jd_ut, iflag, dir, jd_cross_ptr, serr_ptr);
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
  swe_fixstar(star: string, tjd: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar(star_ptr, tjd, iflag, xx_ptr, serr_ptr);
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
  swe_fixstar_ut(star: string, tjd_ut: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar_ut(star_ptr, tjd_ut, iflag, xx_ptr, serr_ptr);
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
   * swe_fixstar2
   */
  swe_fixstar2(star: string, tjd: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar2(star_ptr, tjd, iflag, xx_ptr, serr_ptr);
const returnCode = ret;
const xx = this.heap.getF64(xx_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
  }

  /**
   * swe_fixstar2_ut
   */
  swe_fixstar2_ut(star: string, tjd_ut: number, iflag: number): { returnCode: number; xx: any; serr: any } {
    const star_ptr = this.heap.putString(star);
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_fixstar2_ut(star_ptr, tjd_ut, iflag, xx_ptr, serr_ptr);
const returnCode = ret;
const xx = this.heap.getF64(xx_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(star_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, xx, serr };
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
   * swe_get_planet_name
   */
  swe_get_planet_name(ipl: number, spname: string): { returnCode: number } {
    const spname_ptr = this.heap.putString(spname);
    const ret = this.exports.swe_get_planet_name(ipl, spname_ptr);
const returnCode = ret;
    this.heap.free(spname_ptr);
    return { returnCode };
  }

  /**
   * swe_set_topo
   */
  swe_set_topo(geolon: number, geolat: number, geoalt: number): void {
    this.exports.swe_set_topo(geolon, geolat, geoalt);
  }

  /**
   * swe_set_sid_mode
   */
  swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void {
    this.exports.swe_set_sid_mode(sid_mode, t0, ayan_t0);
  }

  /**
   * swe_get_ayanamsa_ex
   */
  swe_get_ayanamsa_ex(tjd_et: number, iflag: number): { returnCode: number; daya: any; serr: any } {
    const daya_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_get_ayanamsa_ex(tjd_et, iflag, daya_ptr, serr_ptr);
const returnCode = ret;
const daya = this.heap.getF64(daya_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(daya_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, daya, serr };
  }

  /**
   * swe_get_ayanamsa_ex_ut
   */
  swe_get_ayanamsa_ex_ut(tjd_ut: number, iflag: number): { returnCode: number; daya: any; serr: any } {
    const daya_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_get_ayanamsa_ex_ut(tjd_ut, iflag, daya_ptr, serr_ptr);
const returnCode = ret;
const daya = this.heap.getF64(daya_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(daya_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, daya, serr };
  }

  /**
   * swe_get_ayanamsa
   */
  swe_get_ayanamsa(tjd_et: number): { returnCode: number } {
    const ret = this.exports.swe_get_ayanamsa(tjd_et);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_get_ayanamsa_ut
   */
  swe_get_ayanamsa_ut(tjd_ut: number): { returnCode: number } {
    const ret = this.exports.swe_get_ayanamsa_ut(tjd_ut);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_get_ayanamsa_name
   */
  swe_get_ayanamsa_name(isidmode: number): { returnCode: number } {
    const ret = this.exports.swe_get_ayanamsa_name(isidmode);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_get_current_file_data
   */
  swe_get_current_file_data(ifno: number): { returnCode: number; tfstart: any; tfend: any; denum: any } {
    const tfstart_ptr = this.heap.alloc(6 * 8);
    const tfend_ptr = this.heap.alloc(6 * 8);
    const denum_ptr = this.heap.alloc(4);
    const ret = this.exports.swe_get_current_file_data(ifno, tfstart_ptr, tfend_ptr, denum_ptr);
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
  swe_date_conversion(y: number, m: number, d: number, year: number, arg4: number, c: number): { returnCode: number; utime: any; tjd: any } {
    const utime_ptr = this.heap.alloc(6 * 8);
    const tjd_ptr = this.heap.alloc(6 * 8);
    const ret = this.exports.swe_date_conversion(y, m, d, year, arg4, utime_ptr, c, tjd_ptr);
const returnCode = ret;
const utime = this.heap.getF64(utime_ptr, 6).slice();
const tjd = this.heap.getF64(tjd_ptr, 6).slice();
    this.heap.free(utime_ptr);
    this.heap.free(tjd_ptr);
    return { returnCode, utime, tjd };
  }

  /**
   * swe_julday
   */
  swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): { returnCode: number } {
    const ret = this.exports.swe_julday(year, month, day, hour, gregflag);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_revjul
   */
  swe_revjul(jd: number, gregflag: number): { jyear: any; jmon: any; jday: any; jut: any } {
    const jyear_ptr = this.heap.alloc(4);
    const jmon_ptr = this.heap.alloc(4);
    const jday_ptr = this.heap.alloc(4);
    const jut_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_revjul(jd, gregflag, jyear_ptr, jmon_ptr, jday_ptr, jut_ptr);
const jyear = this.heap.getI32(jyear_ptr);
const jmon = this.heap.getI32(jmon_ptr);
const jday = this.heap.getI32(jday_ptr);
const jut = this.heap.getF64(jut_ptr, 6).slice();
    this.heap.free(jyear_ptr);
    this.heap.free(jmon_ptr);
    this.heap.free(jday_ptr);
    this.heap.free(jut_ptr);
    return { jyear, jmon, jday, jut };
  }

  /**
   * swe_utc_to_jd
   */
  swe_utc_to_jd(iyear: number, imonth: number, iday: number, ihour: number, imin: number, dsec: number, gregflag: number): { returnCode: number; dret: any; serr: any } {
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_utc_to_jd(iyear, imonth, iday, ihour, imin, dsec, gregflag, dret_ptr, serr_ptr);
const returnCode = ret;
const dret = this.heap.getF64(dret_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dret, serr };
  }

  /**
   * swe_jdet_to_utc
   */
  swe_jdet_to_utc(tjd_et: number, gregflag: number): { iyear: any; imonth: any; iday: any; ihour: any; imin: any; dsec: any } {
    const iyear_ptr = this.heap.alloc(4);
    const imonth_ptr = this.heap.alloc(4);
    const iday_ptr = this.heap.alloc(4);
    const ihour_ptr = this.heap.alloc(4);
    const imin_ptr = this.heap.alloc(4);
    const dsec_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_jdet_to_utc(tjd_et, gregflag, iyear_ptr, imonth_ptr, iday_ptr, ihour_ptr, imin_ptr, dsec_ptr);
const iyear = this.heap.getI32(iyear_ptr);
const imonth = this.heap.getI32(imonth_ptr);
const iday = this.heap.getI32(iday_ptr);
const ihour = this.heap.getI32(ihour_ptr);
const imin = this.heap.getI32(imin_ptr);
const dsec = this.heap.getF64(dsec_ptr, 6).slice();
    this.heap.free(iyear_ptr);
    this.heap.free(imonth_ptr);
    this.heap.free(iday_ptr);
    this.heap.free(ihour_ptr);
    this.heap.free(imin_ptr);
    this.heap.free(dsec_ptr);
    return { iyear, imonth, iday, ihour, imin, dsec };
  }

  /**
   * swe_jdut1_to_utc
   */
  swe_jdut1_to_utc(tjd_ut: number, gregflag: number): { iyear: any; imonth: any; iday: any; ihour: any; imin: any; dsec: any } {
    const iyear_ptr = this.heap.alloc(4);
    const imonth_ptr = this.heap.alloc(4);
    const iday_ptr = this.heap.alloc(4);
    const ihour_ptr = this.heap.alloc(4);
    const imin_ptr = this.heap.alloc(4);
    const dsec_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_jdut1_to_utc(tjd_ut, gregflag, iyear_ptr, imonth_ptr, iday_ptr, ihour_ptr, imin_ptr, dsec_ptr);
const iyear = this.heap.getI32(iyear_ptr);
const imonth = this.heap.getI32(imonth_ptr);
const iday = this.heap.getI32(iday_ptr);
const ihour = this.heap.getI32(ihour_ptr);
const imin = this.heap.getI32(imin_ptr);
const dsec = this.heap.getF64(dsec_ptr, 6).slice();
    this.heap.free(iyear_ptr);
    this.heap.free(imonth_ptr);
    this.heap.free(iday_ptr);
    this.heap.free(ihour_ptr);
    this.heap.free(imin_ptr);
    this.heap.free(dsec_ptr);
    return { iyear, imonth, iday, ihour, imin, dsec };
  }

  /**
   * swe_utc_time_zone
   */
  swe_utc_time_zone(iyear: number, imonth: number, iday: number, ihour: number, imin: number, dsec: number, d_timezone: number): { iyear_out: any; imonth_out: any; iday_out: any; ihour_out: any; imin_out: any; dsec_out: any } {
    const iyear_out_ptr = this.heap.alloc(4);
    const imonth_out_ptr = this.heap.alloc(4);
    const iday_out_ptr = this.heap.alloc(4);
    const ihour_out_ptr = this.heap.alloc(4);
    const imin_out_ptr = this.heap.alloc(4);
    const dsec_out_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_utc_time_zone(iyear, imonth, iday, ihour, imin, dsec, d_timezone, iyear_out_ptr, imonth_out_ptr, iday_out_ptr, ihour_out_ptr, imin_out_ptr, dsec_out_ptr);
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
   * swe_houses
   */
  swe_houses(tjd_ut: number, geolat: number, geolon: number, hsys: number): { returnCode: number; cusps: any; ascmc: any } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const ret = this.exports.swe_houses(tjd_ut, geolat, geolon, hsys, cusps_ptr, ascmc_ptr);
const returnCode = ret;
const cusps = this.heap.getF64(cusps_ptr, 13).slice();
const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    return { returnCode, cusps, ascmc };
  }

  /**
   * swe_houses_ex
   */
  swe_houses_ex(tjd_ut: number, iflag: number, geolat: number, geolon: number, hsys: number): { returnCode: number; cusps: any; ascmc: any } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const ret = this.exports.swe_houses_ex(tjd_ut, iflag, geolat, geolon, hsys, cusps_ptr, ascmc_ptr);
const returnCode = ret;
const cusps = this.heap.getF64(cusps_ptr, 13).slice();
const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    return { returnCode, cusps, ascmc };
  }

  /**
   * swe_houses_ex2
   */
  swe_houses_ex2(tjd_ut: number, iflag: number, geolat: number, geolon: number, hsys: number): { returnCode: number; cusps: any; ascmc: any; cusp_speed: any; ascmc_speed: any; serr: any } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const cusp_speed_ptr = this.heap.alloc(13 * 8);
    const ascmc_speed_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_houses_ex2(tjd_ut, iflag, geolat, geolon, hsys, cusps_ptr, ascmc_ptr, cusp_speed_ptr, ascmc_speed_ptr, serr_ptr);
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
   * swe_houses_armc
   */
  swe_houses_armc(armc: number, geolat: number, eps: number, hsys: number): { returnCode: number; cusps: any; ascmc: any } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const ret = this.exports.swe_houses_armc(armc, geolat, eps, hsys, cusps_ptr, ascmc_ptr);
const returnCode = ret;
const cusps = this.heap.getF64(cusps_ptr, 13).slice();
const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    return { returnCode, cusps, ascmc };
  }

  /**
   * swe_houses_armc_ex2
   */
  swe_houses_armc_ex2(armc: number, geolat: number, eps: number, hsys: number): { returnCode: number; cusps: any; ascmc: any; cusp_speed: any; ascmc_speed: any; serr: any } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const cusp_speed_ptr = this.heap.alloc(13 * 8);
    const ascmc_speed_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_houses_armc_ex2(armc, geolat, eps, hsys, cusps_ptr, ascmc_ptr, cusp_speed_ptr, ascmc_speed_ptr, serr_ptr);
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
   * swe_house_pos
   */
  swe_house_pos(armc: number, geolat: number, eps: number, hsys: number, xpin: number[]): { returnCode: number; serr: any } {
    const xpin_ptr = this.heap.alloc(2 * 8);
    this.heap.setU8(xpin_ptr, new Uint8Array(new Float64Array(xpin).buffer));
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_house_pos(armc, geolat, eps, hsys, xpin_ptr, serr_ptr);
const returnCode = ret;
const serr = this.heap.getString(serr_ptr);
    this.heap.free(xpin_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
  }

  /**
   * swe_house_name
   */
  swe_house_name(hsys: number): { returnCode: number } {
    const ret = this.exports.swe_house_name(hsys);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_gauquelin_sector
   */
  swe_gauquelin_sector(t_ut: number, ipl: number, starname: string, iflag: number, imeth: number, geopos: number[], atpress: number, attemp: number): { returnCode: number; dgsect: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const dgsect_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_gauquelin_sector(t_ut, ipl, starname_ptr, iflag, imeth, geopos_ptr, atpress, attemp, dgsect_ptr, serr_ptr);
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
  swe_sol_eclipse_where(tjd: number, ifl: number, geopos: number[]): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_where(tjd, ifl, geopos_ptr, attr_ptr, serr_ptr);
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
  swe_lun_occult_where(tjd: number, ipl: number, starname: string, ifl: number, geopos: number[]): { returnCode: number; attr: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_where(tjd, ipl, starname_ptr, ifl, geopos_ptr, attr_ptr, serr_ptr);
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
  swe_sol_eclipse_how(tjd: number, ifl: number, geopos: number[]): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_how(tjd, ifl, geopos_ptr, attr_ptr, serr_ptr);
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
  swe_sol_eclipse_when_loc(tjd_start: number, ifl: number, geopos: number[], backward: number): { returnCode: number; tret: any; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_when_loc(tjd_start, ifl, geopos_ptr, tret_ptr, attr_ptr, backward, serr_ptr);
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
  swe_lun_occult_when_loc(tjd_start: number, ipl: number, starname: string, ifl: number, geopos: number[], backward: number): { returnCode: number; tret: any; attr: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_when_loc(tjd_start, ipl, starname_ptr, ifl, geopos_ptr, tret_ptr, attr_ptr, backward, serr_ptr);
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
   * swe_sol_eclipse_when_glob
   */
  swe_sol_eclipse_when_glob(tjd_start: number, ifl: number, ifltype: number, backward: number): { returnCode: number; tret: any; serr: any } {
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_sol_eclipse_when_glob(tjd_start, ifl, ifltype, tret_ptr, backward, serr_ptr);
const returnCode = ret;
const tret = this.heap.getF64(tret_ptr, 10).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, serr };
  }

  /**
   * swe_lun_occult_when_glob
   */
  swe_lun_occult_when_glob(tjd_start: number, ipl: number, starname: string, ifl: number, ifltype: number, backward: number): { returnCode: number; tret: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_occult_when_glob(tjd_start, ipl, starname_ptr, ifl, ifltype, tret_ptr, backward, serr_ptr);
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
  swe_lun_eclipse_how(tjd_ut: number, ifl: number, geopos: number[]): { returnCode: number; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_eclipse_how(tjd_ut, ifl, geopos_ptr, attr_ptr, serr_ptr);
const returnCode = ret;
const attr = this.heap.getF64(attr_ptr, 20).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(geopos_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_lun_eclipse_when
   */
  swe_lun_eclipse_when(tjd_start: number, ifl: number, ifltype: number, backward: number): { returnCode: number; tret: any; serr: any } {
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_eclipse_when(tjd_start, ifl, ifltype, tret_ptr, backward, serr_ptr);
const returnCode = ret;
const tret = this.heap.getF64(tret_ptr, 10).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(tret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tret, serr };
  }

  /**
   * swe_lun_eclipse_when_loc
   */
  swe_lun_eclipse_when_loc(tjd_start: number, ifl: number, geopos: number[], backward: number): { returnCode: number; tret: any; attr: any; serr: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const tret_ptr = this.heap.alloc(10 * 8);
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lun_eclipse_when_loc(tjd_start, ifl, geopos_ptr, tret_ptr, attr_ptr, backward, serr_ptr);
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
  swe_pheno(tjd: number, ipl: number, iflag: number): { returnCode: number; attr: any; serr: any } {
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
   * swe_pheno_ut
   */
  swe_pheno_ut(tjd_ut: number, ipl: number, iflag: number): { returnCode: number; attr: any; serr: any } {
    const attr_ptr = this.heap.alloc(20 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_pheno_ut(tjd_ut, ipl, iflag, attr_ptr, serr_ptr);
const returnCode = ret;
const attr = this.heap.getF64(attr_ptr, 20).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(attr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, attr, serr };
  }

  /**
   * swe_refrac
   */
  swe_refrac(inalt: number, atpress: number, attemp: number, calc_flag: number): { returnCode: number } {
    const ret = this.exports.swe_refrac(inalt, atpress, attemp, calc_flag);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_refrac_extended
   */
  swe_refrac_extended(inalt: number, geoalt: number, atpress: number, attemp: number, lapse_rate: number, calc_flag: number): { returnCode: number; dret: any } {
    const dret_ptr = this.heap.alloc(6 * 8);
    const ret = this.exports.swe_refrac_extended(inalt, geoalt, atpress, attemp, lapse_rate, calc_flag, dret_ptr);
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
   * swe_azalt
   */
  swe_azalt(tjd_ut: number, calc_flag: number, geopos: number[], atpress: number, attemp: number, xin: number[]): { xaz: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const xin_ptr = this.heap.alloc(2 * 8);
    this.heap.setU8(xin_ptr, new Uint8Array(new Float64Array(xin).buffer));
    const xaz_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_azalt(tjd_ut, calc_flag, geopos_ptr, atpress, attemp, xin_ptr, xaz_ptr);
const xaz = this.heap.getF64(xaz_ptr, 6).slice();
    this.heap.free(geopos_ptr);
    this.heap.free(xin_ptr);
    this.heap.free(xaz_ptr);
    return { xaz };
  }

  /**
   * swe_azalt_rev
   */
  swe_azalt_rev(tjd_ut: number, calc_flag: number, geopos: number[], xin: number[]): { xout: any } {
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const xin_ptr = this.heap.alloc(2 * 8);
    this.heap.setU8(xin_ptr, new Uint8Array(new Float64Array(xin).buffer));
    const xout_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_azalt_rev(tjd_ut, calc_flag, geopos_ptr, xin_ptr, xout_ptr);
const xout = this.heap.getF64(xout_ptr, 6).slice();
    this.heap.free(geopos_ptr);
    this.heap.free(xin_ptr);
    this.heap.free(xout_ptr);
    return { xout };
  }

  /**
   * swe_rise_trans_true_hor
   */
  swe_rise_trans_true_hor(tjd_ut: number, ipl: number, starname: string, epheflag: number, rsmi: number, geopos: number[], atpress: number, attemp: number, horhgt: number): { returnCode: number; tret: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_rise_trans_true_hor(tjd_ut, ipl, starname_ptr, epheflag, rsmi, geopos_ptr, atpress, attemp, horhgt, tret_ptr, serr_ptr);
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
   * swe_rise_trans
   */
  swe_rise_trans(tjd_ut: number, ipl: number, starname: string, epheflag: number, rsmi: number, geopos: number[], atpress: number, attemp: number): { returnCode: number; tret: any; serr: any } {
    const starname_ptr = this.heap.putString(starname);
    const geopos_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(geopos_ptr, new Uint8Array(new Float64Array(geopos).buffer));
    const tret_ptr = this.heap.alloc(10 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_rise_trans(tjd_ut, ipl, starname_ptr, epheflag, rsmi, geopos_ptr, atpress, attemp, tret_ptr, serr_ptr);
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
   * swe_nod_aps
   */
  swe_nod_aps(tjd_et: number, ipl: number, iflag: number, method: number): { returnCode: number; xnasc: any; xndsc: any; xperi: any; xaphe: any; serr: any } {
    const xnasc_ptr = this.heap.alloc(6 * 8);
    const xndsc_ptr = this.heap.alloc(6 * 8);
    const xperi_ptr = this.heap.alloc(6 * 8);
    const xaphe_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_nod_aps(tjd_et, ipl, iflag, method, xnasc_ptr, xndsc_ptr, xperi_ptr, xaphe_ptr, serr_ptr);
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
   * swe_nod_aps_ut
   */
  swe_nod_aps_ut(tjd_ut: number, ipl: number, iflag: number, method: number): { returnCode: number; xnasc: any; xndsc: any; xperi: any; xaphe: any; serr: any } {
    const xnasc_ptr = this.heap.alloc(6 * 8);
    const xndsc_ptr = this.heap.alloc(6 * 8);
    const xperi_ptr = this.heap.alloc(6 * 8);
    const xaphe_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_nod_aps_ut(tjd_ut, ipl, iflag, method, xnasc_ptr, xndsc_ptr, xperi_ptr, xaphe_ptr, serr_ptr);
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
   * swe_get_orbital_elements
   */
  swe_get_orbital_elements(tjd_et: number, ipl: number, iflag: number): { returnCode: number; dret: any; serr: any } {
    const dret_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_get_orbital_elements(tjd_et, ipl, iflag, dret_ptr, serr_ptr);
const returnCode = ret;
const dret = this.heap.getF64(dret_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(dret_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, dret, serr };
  }

  /**
   * swe_orbit_max_min_true_distance
   */
  swe_orbit_max_min_true_distance(tjd_et: number, ipl: number, iflag: number): { returnCode: number; dmax: any; dmin: any; dtrue: any; serr: any } {
    const dmax_ptr = this.heap.alloc(6 * 8);
    const dmin_ptr = this.heap.alloc(6 * 8);
    const dtrue_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_orbit_max_min_true_distance(tjd_et, ipl, iflag, dmax_ptr, dmin_ptr, dtrue_ptr, serr_ptr);
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
   * swe_deltat
   */
  swe_deltat(tjd: number): { returnCode: number } {
    const ret = this.exports.swe_deltat(tjd);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_deltat_ex
   */
  swe_deltat_ex(tjd: number, iflag: number): { returnCode: number; serr: any } {
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_deltat_ex(tjd, iflag, serr_ptr);
const returnCode = ret;
const serr = this.heap.getString(serr_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, serr };
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
  swe_lmt_to_lat(tjd_lmt: number, geolon: number): { returnCode: number; tjd_lat: any; serr: any } {
    const tjd_lat_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lmt_to_lat(tjd_lmt, geolon, tjd_lat_ptr, serr_ptr);
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
  swe_lat_to_lmt(tjd_lat: number, geolon: number): { returnCode: number; tjd_lmt: any; serr: any } {
    const tjd_lmt_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);
    const ret = this.exports.swe_lat_to_lmt(tjd_lat, geolon, tjd_lmt_ptr, serr_ptr);
const returnCode = ret;
const tjd_lmt = this.heap.getF64(tjd_lmt_ptr, 6).slice();
const serr = this.heap.getString(serr_ptr);
    this.heap.free(tjd_lmt_ptr);
    this.heap.free(serr_ptr);
    return { returnCode, tjd_lmt, serr };
  }

  /**
   * swe_sidtime0
   */
  swe_sidtime0(tjd_ut: number, eps: number, nut: number): { returnCode: number } {
    const ret = this.exports.swe_sidtime0(tjd_ut, eps, nut);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_sidtime
   */
  swe_sidtime(tjd_ut: number): { returnCode: number } {
    const ret = this.exports.swe_sidtime(tjd_ut);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_set_interpolate_nut
   */
  swe_set_interpolate_nut(do_interpolate: number): void {
    this.exports.swe_set_interpolate_nut(do_interpolate);
  }

  /**
   * swe_cotrans
   */
  swe_cotrans(xpo: number[], eps: number): { xpn: any } {
    const xpo_ptr = this.heap.alloc(3 * 8);
    this.heap.setU8(xpo_ptr, new Uint8Array(new Float64Array(xpo).buffer));
    const xpn_ptr = this.heap.alloc(6 * 8);
    this.exports.swe_cotrans(xpo_ptr, xpn_ptr, eps);
const xpn = this.heap.getF64(xpn_ptr, 6).slice();
    this.heap.free(xpo_ptr);
    this.heap.free(xpn_ptr);
    return { xpn };
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
   * swe_get_tid_acc
   */
  swe_get_tid_acc(arg0: number): { returnCode: number } {
    const ret = this.exports.swe_get_tid_acc(arg0);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_set_tid_acc
   */
  swe_set_tid_acc(t_acc: number): void {
    this.exports.swe_set_tid_acc(t_acc);
  }

  /**
   * swe_set_delta_t_userdef
   */
  swe_set_delta_t_userdef(dt: number): void {
    this.exports.swe_set_delta_t_userdef(dt);
  }

  /**
   * swe_degnorm
   */
  swe_degnorm(x: number): { returnCode: number } {
    const ret = this.exports.swe_degnorm(x);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_radnorm
   */
  swe_radnorm(x: number): { returnCode: number } {
    const ret = this.exports.swe_radnorm(x);
const returnCode = ret;
    return { returnCode };
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
   * swe_deg_midp
   */
  swe_deg_midp(x1: number, x0: number): { returnCode: number } {
    const ret = this.exports.swe_deg_midp(x1, x0);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_split_deg
   */
  swe_split_deg(ddeg: number, roundflag: number): { ideg: any; imin: any; isec: any; dsecfr: any; isgn: any } {
    const ideg_ptr = this.heap.alloc(4);
    const imin_ptr = this.heap.alloc(4);
    const isec_ptr = this.heap.alloc(4);
    const dsecfr_ptr = this.heap.alloc(6 * 8);
    const isgn_ptr = this.heap.alloc(4);
    this.exports.swe_split_deg(ddeg, roundflag, ideg_ptr, imin_ptr, isec_ptr, dsecfr_ptr, isgn_ptr);
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
   * swe_difdeg2n
   */
  swe_difdeg2n(p1: number, p2: number): { returnCode: number } {
    const ret = this.exports.swe_difdeg2n(p1, p2);
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
   * swe_day_of_week
   */
  swe_day_of_week(jd: number): { returnCode: number } {
    const ret = this.exports.swe_day_of_week(jd);
const returnCode = ret;
    return { returnCode };
  }

  /**
   * swe_cs2timestr
   */
  swe_cs2timestr(t: number, sep: number, suppressZero: number, a: string): { returnCode: number } {
    const a_ptr = this.heap.putString(a);
    const ret = this.exports.swe_cs2timestr(t, sep, suppressZero, a_ptr);
const returnCode = ret;
    this.heap.free(a_ptr);
    return { returnCode };
  }

  /**
   * swe_cs2lonlatstr
   */
  swe_cs2lonlatstr(t: number, pchar: number, mchar: number, s: string): { returnCode: number } {
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
