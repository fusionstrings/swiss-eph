//! Complete FFI bindings to the Swiss Ephemeris library.
//!
//! This crate provides raw, unsafe bindings to all functions and constants
//! exported by the Swiss Ephemeris C library.
//!
//! # Safety
//! All functions in this crate are `unsafe` as they call into C code.
//! Callers must ensure proper buffer sizes and valid pointers.
//!
//! # Safe API
//! For a safe, idiomatic Rust API, use the `safe` module.
//!
//! # License
//! AGPL-3.0 (inherited from Swiss Ephemeris)

#![allow(non_camel_case_types)]
#![allow(non_upper_case_globals)]

use std::os::raw::{c_char, c_double, c_int};



#[cfg(feature = "embedded-ephe")]
pub use swiss_eph_data as data;

pub mod safe;

// =============================================================================
// WASM-only Memory Management and Exports
// These are only compiled for WASM targets to avoid conflicts with native
// system allocators and duplicate symbol errors.
// =============================================================================

#[cfg(target_arch = "wasm32")]
mod wasm_exports {
    use super::*;
    use std::os::raw::{c_char, c_double};

#[cfg(not(target_os = "wasi"))]
mod alloc_exports {


    #[unsafe(export_name = "malloc")]
    pub unsafe extern "C" fn custom_malloc(size: usize) -> *mut u8 {
        unsafe {
            let actual_size = size + 8;
            let layout = std::alloc::Layout::from_size_align_unchecked(actual_size, 8);
            let ptr = std::alloc::alloc(layout);
            if ptr.is_null() {
                return ptr;
            }
            *(ptr as *mut usize) = size;
            ptr.add(8)
        }
    }

    #[unsafe(export_name = "free")]
    pub unsafe extern "C" fn custom_free(ptr: *mut u8) {
        unsafe {
            if ptr.is_null() {
                return;
            }
            let actual_ptr = ptr.sub(8);
            let size = *(actual_ptr as *const usize);
            let layout = std::alloc::Layout::from_size_align_unchecked(size + 8, 8);
            std::alloc::dealloc(actual_ptr, layout);
        }
    }
}

    #[unsafe(export_name = "wasm_swe_calc_ut")]
    pub unsafe extern "C" fn __swe_calc_ut(
        tjd_ut: c_double,
        ipl: int32,
        iflag: int32,
        xx: *mut c_double,
        serr: *mut c_char,
    ) -> int32 {
        unsafe { swe_calc_ut(tjd_ut, ipl, iflag, xx, serr) }
    }

    #[unsafe(export_name = "wasm_swe_calc")]
    pub unsafe extern "C" fn __swe_calc(
        tjd: c_double,
        ipl: int32,
        iflag: int32,
        xx: *mut c_double,
        serr: *mut c_char,
    ) -> int32 {
        unsafe { swe_calc(tjd, ipl, iflag, xx, serr) }
    }

    #[unsafe(export_name = "wasm_swe_set_ephe_path")]
    pub unsafe extern "C" fn __swe_set_ephe_path(path: *mut c_char) {
        unsafe { swe_set_ephe_path(path) }
    }

    #[unsafe(export_name = "wasm_swe_version")]
    pub unsafe extern "C" fn __swe_version(s: *mut c_char) -> *mut c_char {
        unsafe { swe_version(s) }
    }

    #[unsafe(export_name = "wasm_swe_close")]
    pub unsafe extern "C" fn __swe_close() {
        unsafe { swe_close() }
    }

    #[unsafe(export_name = "wasm_swe_julday")]
    pub unsafe extern "C" fn __swe_julday(
        year: c_int,
        month: c_int,
        day: c_int,
        hour: c_double,
        gregflag: c_int,
    ) -> c_double {
        unsafe { swe_julday(year, month, day, hour, gregflag) }
    }

    #[unsafe(export_name = "wasm_swe_revjul")]
    pub unsafe extern "C" fn __swe_revjul(
        jd: c_double,
        gregflag: c_int,
        year: *mut c_int,
        month: *mut c_int,
        day: *mut c_int,
        hour: *mut c_double,
    ) {
        unsafe { swe_revjul(jd, gregflag, year, month, day, hour) }
    }

    #[unsafe(export_name = "wasm_swe_houses")]
    pub unsafe extern "C" fn __swe_houses(
        tjd_ut: c_double,
        geolat: c_double,
        geolon: c_double,
        hsys: c_int,
        cusps: *mut c_double,
        ascmc: *mut c_double,
    ) -> c_int {
        unsafe { swe_houses(tjd_ut, geolat, geolon, hsys, cusps, ascmc) }
    }

    #[unsafe(export_name = "wasm_swe_sidtime")]
    pub unsafe extern "C" fn __swe_sidtime(tjd_ut: c_double) -> c_double {
        unsafe { swe_sidtime(tjd_ut) }
    }

    #[unsafe(export_name = "wasm_swe_set_topo")]
    pub unsafe extern "C" fn __swe_set_topo(geolon: c_double, geolat: c_double, geoalt: c_double) {
        unsafe { swe_set_topo(geolon, geolat, geoalt) }
    }
}

// =============================================================================
// Type definitions (from sweodef.h)
// =============================================================================

/// 32-bit signed integer
pub type int32 = c_int;
/// 64-bit signed integer  
pub type int64 = i64;
/// 32-bit unsigned integer
pub type uint32 = u32;
/// 16-bit signed integer
pub type int16 = i16;
/// Real with at least 64-bit precision
pub type REAL8 = c_double;
/// Signed integer with at least 32-bit precision
pub type INT4 = c_int;
/// Unsigned integer with at least 32-bit precision
pub type UINT4 = u32;
/// Boolean type
pub type AS_BOOL = c_int;
/// Unsigned 16-bit integer
pub type UINT2 = u16;
/// Centiseconds used for angles and times
pub type centisec = int32;
/// Alias for centisec
pub type CSEC = centisec;

// =============================================================================
// Calendar constants
// =============================================================================
pub const SE_JUL_CAL: c_int = 0;
pub const SE_GREG_CAL: c_int = 1;

// =============================================================================
// Planet numbers for swe_calc()
// =============================================================================
pub const SE_ECL_NUT: c_int = -1;
pub const SE_SUN: c_int = 0;
pub const SE_MOON: c_int = 1;
pub const SE_MERCURY: c_int = 2;
pub const SE_VENUS: c_int = 3;
pub const SE_MARS: c_int = 4;
pub const SE_JUPITER: c_int = 5;
pub const SE_SATURN: c_int = 6;
pub const SE_URANUS: c_int = 7;
pub const SE_NEPTUNE: c_int = 8;
pub const SE_PLUTO: c_int = 9;
pub const SE_MEAN_NODE: c_int = 10;
pub const SE_TRUE_NODE: c_int = 11;
pub const SE_MEAN_APOG: c_int = 12;
pub const SE_OSCU_APOG: c_int = 13;
pub const SE_EARTH: c_int = 14;
pub const SE_CHIRON: c_int = 15;
pub const SE_PHOLUS: c_int = 16;
pub const SE_CERES: c_int = 17;
pub const SE_PALLAS: c_int = 18;
pub const SE_JUNO: c_int = 19;
pub const SE_VESTA: c_int = 20;
pub const SE_INTP_APOG: c_int = 21;
pub const SE_INTP_PERG: c_int = 22;
pub const SE_NPLANETS: c_int = 23;
pub const SE_PLMOON_OFFSET: c_int = 9000;
pub const SE_AST_OFFSET: c_int = 10000;
pub const SE_VARUNA: c_int = SE_AST_OFFSET + 20000;
pub const SE_FICT_OFFSET: c_int = 40;
pub const SE_FICT_OFFSET_1: c_int = 39;
pub const SE_FICT_MAX: c_int = 999;
pub const SE_NFICT_ELEM: c_int = 15;
pub const SE_COMET_OFFSET: c_int = 1000;
pub const SE_NALL_NAT_POINTS: c_int = SE_NPLANETS + SE_NFICT_ELEM;

// Hamburger/Uranian planets
pub const SE_CUPIDO: c_int = 40;
pub const SE_HADES: c_int = 41;
pub const SE_ZEUS: c_int = 42;
pub const SE_KRONOS: c_int = 43;
pub const SE_APOLLON: c_int = 44;
pub const SE_ADMETOS: c_int = 45;
pub const SE_VULKANUS: c_int = 46;
pub const SE_POSEIDON: c_int = 47;
pub const SE_ISIS: c_int = 48;
pub const SE_NIBIRU: c_int = 49;
pub const SE_HARRINGTON: c_int = 50;
pub const SE_NEPTUNE_LEVERRIER: c_int = 51;
pub const SE_NEPTUNE_ADAMS: c_int = 52;
pub const SE_PLUTO_LOWELL: c_int = 53;
pub const SE_PLUTO_PICKERING: c_int = 54;
pub const SE_VULCAN: c_int = 55;
pub const SE_WHITE_MOON: c_int = 56;
pub const SE_PROSERPINA: c_int = 57;
pub const SE_WALDEMATH: c_int = 58;
pub const SE_FIXSTAR: c_int = -10;

pub const SE_FNAME_DE200: &str = "de200.eph";
pub const SE_FNAME_DE403: &str = "de403.eph";
pub const SE_FNAME_DE404: &str = "de404.eph";
pub const SE_FNAME_DE405: &str = "de405.eph";
pub const SE_FNAME_DE406: &str = "de406.eph";
pub const SE_FNAME_DE431: &str = "de431.eph";
pub const SE_FNAME_DFT: &str = SE_FNAME_DE431;
pub const SE_FNAME_DFT2: &str = SE_FNAME_DE406;

pub const SE_STARFILE_OLD: &str = "fixstars.cat";
pub const SE_STARFILE: &str = "sefstars.txt";
pub const SE_ASTNAMFILE: &str = "seasnam.txt";
pub const SE_FICTFILE: &str = "seorbel.txt";

pub const SE_DE_NUMBER: c_int = 431;

// House/angle identifiers
pub const SE_ASC: c_int = 0;
pub const SE_MC: c_int = 1;
pub const SE_ARMC: c_int = 2;
pub const SE_VERTEX: c_int = 3;
pub const SE_EQUASC: c_int = 4;
pub const SE_COASC1: c_int = 5;
pub const SE_COASC2: c_int = 6;
pub const SE_POLASC: c_int = 7;
pub const SE_NASCMC: c_int = 8;

// =============================================================================
// Calculation flags for swe_calc()
// =============================================================================
pub const SEFLG_JPLEPH: int32 = 1;
pub const SEFLG_SWIEPH: int32 = 2;
pub const SEFLG_MOSEPH: int32 = 4;
pub const SEFLG_HELCTR: int32 = 8;
pub const SEFLG_TRUEPOS: int32 = 16;
pub const SEFLG_J2000: int32 = 32;
pub const SEFLG_NONUT: int32 = 64;
pub const SEFLG_SPEED3: int32 = 128;
pub const SEFLG_SPEED: int32 = 256;
pub const SEFLG_NOGDEFL: int32 = 512;
pub const SEFLG_NOABERR: int32 = 1024;
pub const SEFLG_ASTROMETRIC: int32 = SEFLG_NOABERR | SEFLG_NOGDEFL;
pub const SEFLG_EQUATORIAL: int32 = 2 * 1024;
pub const SEFLG_XYZ: int32 = 4 * 1024;
pub const SEFLG_RADIANS: int32 = 8 * 1024;
pub const SEFLG_BARYCTR: int32 = 16 * 1024;
pub const SEFLG_TOPOCTR: int32 = 32 * 1024;
pub const SEFLG_ORBEL_AA: int32 = SEFLG_TOPOCTR;
pub const SEFLG_TROPICAL: int32 = 0;
pub const SEFLG_SIDEREAL: int32 = 64 * 1024;
pub const SEFLG_ICRS: int32 = 128 * 1024;
pub const SEFLG_DPSIDEPS_1980: int32 = 256 * 1024;
pub const SEFLG_JPLHOR: int32 = SEFLG_DPSIDEPS_1980;
pub const SEFLG_JPLHOR_APPROX: int32 = 512 * 1024;
pub const SEFLG_CENTER_BODY: int32 = 1024 * 1024;
pub const SEFLG_DEFAULTEPH: int32 = SEFLG_SWIEPH;

// =============================================================================
// Sidereal modes (ayanamsas)
// =============================================================================
pub const SE_SIDM_FAGAN_BRADLEY: c_int = 0;
pub const SE_SIDM_LAHIRI: c_int = 1;
pub const SE_SIDM_DELUCE: c_int = 2;
pub const SE_SIDM_RAMAN: c_int = 3;
pub const SE_SIDM_USHASHASHI: c_int = 4;
pub const SE_SIDM_KRISHNAMURTI: c_int = 5;
pub const SE_SIDM_DJWHAL_KHUL: c_int = 6;
pub const SE_SIDM_YUKTESHWAR: c_int = 7;
pub const SE_SIDM_JN_BHASIN: c_int = 8;
pub const SE_SIDM_BABYL_KUGLER1: c_int = 9;
pub const SE_SIDM_BABYL_KUGLER2: c_int = 10;
pub const SE_SIDM_BABYL_KUGLER3: c_int = 11;
pub const SE_SIDM_BABYL_HUBER: c_int = 12;
pub const SE_SIDM_BABYL_ETPSC: c_int = 13;
pub const SE_SIDM_ALDEBARAN_15TAU: c_int = 14;
pub const SE_SIDM_HIPPARCHOS: c_int = 15;
pub const SE_SIDM_SASSANIAN: c_int = 16;
pub const SE_SIDM_GALCENT_0SAG: c_int = 17;
pub const SE_SIDM_J2000: c_int = 18;
pub const SE_SIDM_J1900: c_int = 19;
pub const SE_SIDM_B1950: c_int = 20;
pub const SE_SIDM_SURYASIDDHANTA: c_int = 21;
pub const SE_SIDM_SURYASIDDHANTA_MSUN: c_int = 22;
pub const SE_SIDM_ARYABHATA: c_int = 23;
pub const SE_SIDM_ARYABHATA_MSUN: c_int = 24;
pub const SE_SIDM_SS_REVATI: c_int = 25;
pub const SE_SIDM_SS_CITRA: c_int = 26;
pub const SE_SIDM_TRUE_CITRA: c_int = 27;
pub const SE_SIDM_TRUE_REVATI: c_int = 28;
pub const SE_SIDM_TRUE_PUSHYA: c_int = 29;
pub const SE_SIDM_GALCENT_RGILBRAND: c_int = 30;
pub const SE_SIDM_GALEQU_IAU1958: c_int = 31;
pub const SE_SIDM_GALEQU_TRUE: c_int = 32;
pub const SE_SIDM_GALEQU_MULA: c_int = 33;
pub const SE_SIDM_GALALIGN_MARDYKS: c_int = 34;
pub const SE_SIDM_TRUE_MULA: c_int = 35;
pub const SE_SIDM_GALCENT_MULA_WILHELM: c_int = 36;
pub const SE_SIDM_ARYABHATA_522: c_int = 37;
pub const SE_SIDM_BABYL_BRITTON: c_int = 38;
pub const SE_SIDM_TRUE_SHEORAN: c_int = 39;
pub const SE_SIDM_GALCENT_COCHRANE: c_int = 40;
pub const SE_SIDM_GALEQU_FIORENZA: c_int = 41;
pub const SE_SIDM_VALENS_MOON: c_int = 42;
pub const SE_SIDM_LAHIRI_1940: c_int = 43;
pub const SE_SIDM_LAHIRI_VP285: c_int = 44;
pub const SE_SIDM_KRISHNAMURTI_VP291: c_int = 45;
pub const SE_SIDM_LAHIRI_ICRC: c_int = 46;
pub const SE_SIDM_USER: c_int = 255;
pub const SE_NSIDM_PREDEF: c_int = 47;

// Sidereal mode bits
pub const SE_SIDBITS: c_int = 256;
pub const SE_SIDBIT_ECL_T0: c_int = 256;
pub const SE_SIDBIT_SSY_PLANE: c_int = 512;
pub const SE_SIDBIT_USER_UT: c_int = 1024;
pub const SE_SIDBIT_ECL_DATE: c_int = 2048;
pub const SE_SIDBIT_NO_PREC_OFFSET: c_int = 4096;
pub const SE_SIDBIT_PREC_ORIG: c_int = 8192;

// =============================================================================
// Node/apse bits
// =============================================================================
pub const SE_NODBIT_MEAN: c_int = 1;
pub const SE_NODBIT_OSCU: c_int = 2;
pub const SE_NODBIT_OSCU_BAR: c_int = 4;
pub const SE_NODBIT_FOPOINT: c_int = 256;

// =============================================================================
// Eclipse flags
// =============================================================================
pub const SE_ECL_CENTRAL: int32 = 1;
pub const SE_ECL_NONCENTRAL: int32 = 2;
pub const SE_ECL_TOTAL: int32 = 4;
pub const SE_ECL_ANNULAR: int32 = 8;
pub const SE_ECL_PARTIAL: int32 = 16;
pub const SE_ECL_ANNULAR_TOTAL: int32 = 32;
pub const SE_ECL_HYBRID: int32 = 32;
pub const SE_ECL_PENUMBRAL: int32 = 64;
pub const SE_ECL_VISIBLE: int32 = 128;
pub const SE_ECL_MAX_VISIBLE: int32 = 256;
pub const SE_ECL_1ST_VISIBLE: int32 = 512;
pub const SE_ECL_PARTBEG_VISIBLE: int32 = 512;
pub const SE_ECL_2ND_VISIBLE: int32 = 1024;
pub const SE_ECL_TOTBEG_VISIBLE: int32 = 1024;
pub const SE_ECL_3RD_VISIBLE: int32 = 2048;
pub const SE_ECL_TOTEND_VISIBLE: int32 = 2048;
pub const SE_ECL_4TH_VISIBLE: int32 = 4096;
pub const SE_ECL_PARTEND_VISIBLE: int32 = 4096;
pub const SE_ECL_PENUMBBEG_VISIBLE: int32 = 8192;
pub const SE_ECL_PENUMBEND_VISIBLE: int32 = 16384;
pub const SE_ECL_OCC_BEG_DAYLIGHT: int32 = 8192;
pub const SE_ECL_OCC_END_DAYLIGHT: int32 = 16384;
pub const SE_ECL_ALLTYPES_SOLAR: int32 = SE_ECL_CENTRAL | SE_ECL_NONCENTRAL | SE_ECL_TOTAL | SE_ECL_ANNULAR | SE_ECL_PARTIAL | SE_ECL_ANNULAR_TOTAL;
pub const SE_ECL_ALLTYPES_LUNAR: int32 = SE_ECL_TOTAL | SE_ECL_PARTIAL | SE_ECL_PENUMBRAL;
pub const SE_ECL_ONE_TRY: int32 = 32 * 1024;

// =============================================================================
// Rise/transit flags
// =============================================================================
pub const SE_CALC_RISE: c_int = 1;
pub const SE_CALC_SET: c_int = 2;
pub const SE_CALC_MTRANSIT: c_int = 4;
pub const SE_CALC_ITRANSIT: c_int = 8;
pub const SE_BIT_DISC_CENTER: c_int = 256;
pub const SE_BIT_DISC_BOTTOM: c_int = 8192;
pub const SE_BIT_GEOCTR_NO_ECL_LAT: c_int = 128;
pub const SE_BIT_NO_REFRACTION: c_int = 512;
pub const SE_BIT_CIVIL_TWILIGHT: c_int = 1024;
pub const SE_BIT_NAUTIC_TWILIGHT: c_int = 2048;
pub const SE_BIT_ASTRO_TWILIGHT: c_int = 4096;
pub const SE_BIT_FIXED_DISC_SIZE: c_int = 16384;
pub const SE_BIT_FORCE_SLOW_METHOD: c_int = 32768;
pub const SE_BIT_HINDU_RISING: c_int = SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION | SE_BIT_GEOCTR_NO_ECL_LAT;

// Azimuth/altitude conversion
pub const SE_ECL2HOR: c_int = 0;
pub const SE_EQU2HOR: c_int = 1;
pub const SE_HOR2ECL: c_int = 0;
pub const SE_HOR2EQU: c_int = 1;

// Refraction
pub const SE_TRUE_TO_APP: c_int = 0;
pub const SE_APP_TO_TRUE: c_int = 1;

// =============================================================================
// Heliacal event types
// =============================================================================
pub const SE_HELIACAL_RISING: c_int = 1;
pub const SE_HELIACAL_SETTING: c_int = 2;
pub const SE_MORNING_FIRST: c_int = SE_HELIACAL_RISING;
pub const SE_EVENING_LAST: c_int = SE_HELIACAL_SETTING;
pub const SE_EVENING_FIRST: c_int = 3;
pub const SE_MORNING_LAST: c_int = 4;
pub const SE_ACRONYCHAL_RISING: c_int = 5;
pub const SE_ACRONYCHAL_SETTING: c_int = 6;
pub const SE_COSMICAL_SETTING: c_int = SE_ACRONYCHAL_SETTING;

// Heliacal flags
pub const SE_HELFLAG_LONG_SEARCH: int32 = 128;
pub const SE_HELFLAG_HIGH_PRECISION: int32 = 256;
pub const SE_HELFLAG_OPTICAL_PARAMS: int32 = 512;
pub const SE_HELFLAG_NO_DETAILS: int32 = 1024;
pub const SE_HELFLAG_SEARCH_1_PERIOD: int32 = 1 << 11;
pub const SE_HELFLAG_VISLIM_DARK: int32 = 1 << 12;
pub const SE_HELFLAG_VISLIM_NOMOON: int32 = 1 << 13;
pub const SE_HELFLAG_VISLIM_PHOTOPIC: int32 = 1 << 14;
pub const SE_HELFLAG_VISLIM_SCOTOPIC: int32 = 1 << 15;
pub const SE_HELFLAG_AV: int32 = 1 << 16;
pub const SE_HELFLAG_AVKIND_VR: int32 = 1 << 16;
pub const SE_HELFLAG_AVKIND_PTO: int32 = 1 << 17;
pub const SE_HELFLAG_AVKIND_MIN7: int32 = 1 << 18;
pub const SE_HELFLAG_AVKIND_MIN9: int32 = 1 << 19;
pub const SE_HELFLAG_AVKIND: int32 = SE_HELFLAG_AVKIND_VR | SE_HELFLAG_AVKIND_PTO | SE_HELFLAG_AVKIND_MIN7 | SE_HELFLAG_AVKIND_MIN9;
pub const SE_HELIACAL_AVKIND: int32 = SE_HELFLAG_AVKIND;

pub const SE_HELIACAL_HIGH_PRECISION: int32 = SE_HELFLAG_HIGH_PRECISION;
pub const SE_HELIACAL_LONG_SEARCH: int32 = SE_HELFLAG_LONG_SEARCH;
pub const SE_HELIACAL_NO_DETAILS: int32 = SE_HELFLAG_NO_DETAILS;
pub const SE_HELIACAL_OPTICAL_PARAMS: int32 = SE_HELFLAG_OPTICAL_PARAMS;
pub const SE_HELIACAL_SEARCH_1_PERIOD: int32 = SE_HELFLAG_SEARCH_1_PERIOD;
pub const SE_HELIACAL_VISLIM_DARK: int32 = SE_HELFLAG_VISLIM_DARK;
pub const SE_HELIACAL_VISLIM_NOMOON: int32 = SE_HELFLAG_VISLIM_NOMOON;
pub const SE_HELIACAL_VISLIM_PHOTOPIC: int32 = SE_HELFLAG_VISLIM_PHOTOPIC;

pub const SE_PHOTOPIC_FLAG: c_int = 0;
pub const SE_SCOTOPIC_FLAG: c_int = 1;
pub const SE_MIXEDOPIC_FLAG: c_int = 2;

// =============================================================================
// Split degree flags
// =============================================================================
pub const SE_SPLIT_DEG_ROUND_SEC: c_int = 1;
pub const SE_SPLIT_DEG_ROUND_MIN: c_int = 2;
pub const SE_SPLIT_DEG_ROUND_DEG: c_int = 4;
pub const SE_SPLIT_DEG_ZODIACAL: c_int = 8;
pub const SE_SPLIT_DEG_NAKSHATRA: c_int = 1024;
pub const SE_SPLIT_DEG_KEEP_SIGN: c_int = 16;
pub const SE_SPLIT_DEG_KEEP_DEG: c_int = 32;

// =============================================================================
// Unit conversions
// =============================================================================
pub const SE_AUNIT_TO_KM: c_double = 149597870.700;
pub const SE_AUNIT_TO_LIGHTYEAR: c_double = 1.0 / 63241.07708427;
pub const SE_AUNIT_TO_PARSEC: c_double = 1.0 / 206264.8062471;

// Degree constants (in centiseconds)
pub const DEG: centisec = 360000;
pub const DEG7_30: centisec = 2700000;
pub const DEG15: centisec = 15 * DEG;
pub const DEG24: centisec = 24 * DEG;
pub const DEG30: centisec = 30 * DEG;
pub const DEG60: centisec = 60 * DEG;
pub const DEG90: centisec = 90 * DEG;
pub const DEG120: centisec = 120 * DEG;
pub const DEG150: centisec = 150 * DEG;
pub const DEG180: centisec = 180 * DEG;
pub const DEG270: centisec = 270 * DEG;
pub const DEG360: centisec = 360 * DEG;

pub const SE_MAX_STNAME: usize = 256;

// =============================================================================
// Delta T models
// =============================================================================
pub const SE_TIDAL_DE200: c_double = -23.8946;
pub const SE_TIDAL_DE403: c_double = -25.580;
pub const SE_TIDAL_DE404: c_double = -25.580;
pub const SE_TIDAL_DE405: c_double = -25.826;
pub const SE_TIDAL_DE406: c_double = -25.826;
pub const SE_TIDAL_DE421: c_double = -25.85;
pub const SE_TIDAL_DE422: c_double = -25.85;
pub const SE_TIDAL_DE430: c_double = -25.82;
pub const SE_TIDAL_DE431: c_double = -25.80;
pub const SE_TIDAL_DE441: c_double = -25.936;
pub const SE_TIDAL_DEFAULT: c_double = SE_TIDAL_DE431;
pub const SE_TIDAL_AUTOMATIC: c_double = 999999.0;
pub const SE_TIDAL_26: c_double = -26.0;
pub const SE_TIDAL_STEPHENSON_2016: c_double = -25.85;
pub const SE_TIDAL_MOSEPH: c_double = SE_TIDAL_DE404;
pub const SE_TIDAL_SWIEPH: c_double = SE_TIDAL_DEFAULT;
pub const SE_TIDAL_JPLEPH: c_double = SE_TIDAL_DEFAULT;

pub const SE_MODEL_DELTAT: c_int = 0;
pub const SE_MODEL_PREC_LONGTERM: c_int = 1;
pub const SE_MODEL_PREC_SHORTTERM: c_int = 2;
pub const SE_MODEL_NUT: c_int = 3;
pub const SE_MODEL_BIAS: c_int = 4;
pub const SE_MODEL_JPLHOR_MODE: c_int = 5;
pub const SE_MODEL_JPLHORA_MODE: c_int = 6;
pub const SE_MODEL_SIDT: c_int = 7;
pub const SE_DELTAT_AUTOMATIC: c_double = -1E-10;

// =============================================================================
// FFI Function declarations
// =============================================================================

#[link(name = "swisseph")]
unsafe extern "C" {
    // Version and path
    pub fn swe_version(s: *mut c_char) -> *mut c_char;
    pub fn swe_get_library_path(s: *mut c_char) -> *mut c_char;

    // Core calculation functions
    pub fn swe_calc(tjd: c_double, ipl: c_int, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_calc_ut(tjd_ut: c_double, ipl: int32, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_calc_pctr(tjd: c_double, ipl: int32, iplctr: int32, iflag: int32, xxret: *mut c_double, serr: *mut c_char) -> int32;

    // Fixed stars
    pub fn swe_fixstar(star: *mut c_char, tjd: c_double, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_fixstar_ut(star: *mut c_char, tjd_ut: c_double, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_fixstar_mag(star: *mut c_char, mag: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_fixstar2(star: *mut c_char, tjd: c_double, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_fixstar2_ut(star: *mut c_char, tjd_ut: c_double, iflag: int32, xx: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_fixstar2_mag(star: *mut c_char, mag: *mut c_double, serr: *mut c_char) -> int32;

    // Configuration
    pub fn swe_close();
    pub fn swe_set_ephe_path(path: *const c_char);
    pub fn swe_set_jpl_file(fname: *const c_char);
    pub fn swe_get_planet_name(ipl: c_int, spname: *mut c_char) -> *mut c_char;
    pub fn swe_set_topo(geolon: c_double, geolat: c_double, geoalt: c_double);
    pub fn swe_set_sid_mode(sid_mode: int32, t0: c_double, ayan_t0: c_double);

    // Ayanamsa
    pub fn swe_get_ayanamsa_ex(tjd_et: c_double, iflag: int32, daya: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_get_ayanamsa_ex_ut(tjd_ut: c_double, iflag: int32, daya: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_get_ayanamsa(tjd_et: c_double) -> c_double;
    pub fn swe_get_ayanamsa_ut(tjd_ut: c_double) -> c_double;
    pub fn swe_get_ayanamsa_name(isidmode: int32) -> *const c_char;

    // Date/time functions
    pub fn swe_date_conversion(y: c_int, m: c_int, d: c_int, utime: c_double, c: c_char, tjd: *mut c_double) -> c_int;
    pub fn swe_julday(year: c_int, month: c_int, day: c_int, hour: c_double, gregflag: c_int) -> c_double;
    pub fn swe_revjul(jd: c_double, gregflag: c_int, jyear: *mut c_int, jmon: *mut c_int, jday: *mut c_int, jut: *mut c_double);
    pub fn swe_utc_to_jd(iyear: int32, imonth: int32, iday: int32, ihour: int32, imin: int32, dsec: c_double, gregflag: int32, dret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_jdet_to_utc(tjd_et: c_double, gregflag: int32, iyear: *mut int32, imonth: *mut int32, iday: *mut int32, ihour: *mut int32, imin: *mut int32, dsec: *mut c_double);
    pub fn swe_jdut1_to_utc(tjd_ut: c_double, gregflag: int32, iyear: *mut int32, imonth: *mut int32, iday: *mut int32, ihour: *mut int32, imin: *mut int32, dsec: *mut c_double);
    pub fn swe_utc_time_zone(iyear: int32, imonth: int32, iday: int32, ihour: int32, imin: int32, dsec: c_double, d_timezone: c_double, iyear_out: *mut int32, imonth_out: *mut int32, iday_out: *mut int32, ihour_out: *mut int32, imin_out: *mut int32, dsec_out: *mut c_double);

    // House calculation
    pub fn swe_houses(tjd_ut: c_double, geolat: c_double, geolon: c_double, hsys: c_int, cusps: *mut c_double, ascmc: *mut c_double) -> c_int;
    pub fn swe_houses_ex(tjd_ut: c_double, iflag: int32, geolat: c_double, geolon: c_double, hsys: c_int, cusps: *mut c_double, ascmc: *mut c_double) -> c_int;
    pub fn swe_houses_ex2(tjd_ut: c_double, iflag: int32, geolat: c_double, geolon: c_double, hsys: c_int, cusps: *mut c_double, ascmc: *mut c_double, cusp_speed: *mut c_double, ascmc_speed: *mut c_double, serr: *mut c_char) -> c_int;
    pub fn swe_houses_armc(armc: c_double, geolat: c_double, eps: c_double, hsys: c_int, cusps: *mut c_double, ascmc: *mut c_double) -> c_int;
    pub fn swe_houses_armc_ex2(armc: c_double, geolat: c_double, eps: c_double, hsys: c_int, cusps: *mut c_double, ascmc: *mut c_double, cusp_speed: *mut c_double, ascmc_speed: *mut c_double, serr: *mut c_char) -> c_int;
    pub fn swe_house_pos(armc: c_double, geolat: c_double, eps: c_double, hsys: c_int, xpin: *mut c_double, serr: *mut c_char) -> c_double;
    pub fn swe_house_name(hsys: c_int) -> *const c_char;

    // Eclipse functions
    pub fn swe_sol_eclipse_where(tjd: c_double, ifl: int32, geopos: *mut c_double, attr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_sol_eclipse_how(tjd: c_double, ifl: int32, geopos: *mut c_double, attr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_sol_eclipse_when_loc(tjd_start: c_double, ifl: int32, geopos: *mut c_double, tret: *mut c_double, attr: *mut c_double, backward: int32, serr: *mut c_char) -> int32;
    pub fn swe_sol_eclipse_when_glob(tjd_start: c_double, ifl: int32, ifltype: int32, tret: *mut c_double, backward: int32, serr: *mut c_char) -> int32;
    pub fn swe_lun_occult_where(tjd: c_double, ipl: int32, starname: *mut c_char, ifl: int32, geopos: *mut c_double, attr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_lun_occult_when_loc(tjd_start: c_double, ipl: int32, starname: *mut c_char, ifl: int32, geopos: *mut c_double, tret: *mut c_double, attr: *mut c_double, backward: int32, serr: *mut c_char) -> int32;
    pub fn swe_lun_occult_when_glob(tjd_start: c_double, ipl: int32, starname: *mut c_char, ifl: int32, ifltype: int32, tret: *mut c_double, backward: int32, serr: *mut c_char) -> int32;
    pub fn swe_lun_eclipse_how(tjd_ut: c_double, ifl: int32, geopos: *mut c_double, attr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_lun_eclipse_when(tjd_start: c_double, ifl: int32, ifltype: int32, tret: *mut c_double, backward: int32, serr: *mut c_char) -> int32;
    pub fn swe_lun_eclipse_when_loc(tjd_start: c_double, ifl: int32, geopos: *mut c_double, tret: *mut c_double, attr: *mut c_double, backward: int32, serr: *mut c_char) -> int32;

    // Rise/set/transit
    pub fn swe_rise_trans(tjd_ut: c_double, ipl: int32, starname: *mut c_char, epheflag: int32, rsmi: int32, geopos: *mut c_double, atpress: c_double, attemp: c_double, tret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_rise_trans_true_hor(tjd_ut: c_double, ipl: int32, starname: *mut c_char, epheflag: int32, rsmi: int32, geopos: *mut c_double, atpress: c_double, attemp: c_double, horhgt: c_double, tret: *mut c_double, serr: *mut c_char) -> int32;

    // Phenomena
    pub fn swe_pheno(tjd: c_double, ipl: int32, iflag: int32, attr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_pheno_ut(tjd_ut: c_double, ipl: int32, iflag: int32, attr: *mut c_double, serr: *mut c_char) -> int32;

    // Azimuth/altitude
    pub fn swe_azalt(tjd_ut: c_double, calc_flag: int32, geopos: *mut c_double, atpress: c_double, attemp: c_double, xin: *mut c_double, xaz: *mut c_double);
    pub fn swe_azalt_rev(tjd_ut: c_double, calc_flag: int32, geopos: *mut c_double, xin: *mut c_double, xout: *mut c_double);
    pub fn swe_refrac(inalt: c_double, atpress: c_double, attemp: c_double, calc_flag: int32) -> c_double;
    pub fn swe_refrac_extended(inalt: c_double, geoalt: c_double, atpress: c_double, attemp: c_double, lapse_rate: c_double, calc_flag: int32, dret: *mut c_double) -> c_double;
    pub fn swe_set_lapse_rate(lapse_rate: c_double);

    // Nodes and apsides
    pub fn swe_nod_aps(tjd_et: c_double, ipl: int32, iflag: int32, method: int32, xnasc: *mut c_double, xndsc: *mut c_double, xperi: *mut c_double, xaphe: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_nod_aps_ut(tjd_ut: c_double, ipl: int32, iflag: int32, method: int32, xnasc: *mut c_double, xndsc: *mut c_double, xperi: *mut c_double, xaphe: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_get_orbital_elements(tjd_et: c_double, ipl: int32, iflag: int32, dret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_orbit_max_min_true_distance(tjd_et: c_double, ipl: int32, iflag: int32, dmax: *mut c_double, dmin: *mut c_double, dtrue: *mut c_double, serr: *mut c_char) -> int32;

    // Delta T
    pub fn swe_deltat(tjd: c_double) -> c_double;
    pub fn swe_deltat_ex(tjd: c_double, iflag: int32, serr: *mut c_char) -> c_double;
    pub fn swe_time_equ(tjd: c_double, te: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_lmt_to_lat(tjd_lmt: c_double, geolon: c_double, tjd_lat: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_lat_to_lmt(tjd_lat: c_double, geolon: c_double, tjd_lmt: *mut c_double, serr: *mut c_char) -> int32;

    // Sidereal time
    pub fn swe_sidtime0(tjd_ut: c_double, eps: c_double, nut: c_double) -> c_double;
    pub fn swe_sidtime(tjd_ut: c_double) -> c_double;
    pub fn swe_set_interpolate_nut(do_interpolate: AS_BOOL);

    // Coordinate transformation
    pub fn swe_cotrans(xpo: *mut c_double, xpn: *mut c_double, eps: c_double);
    pub fn swe_cotrans_sp(xpo: *mut c_double, xpn: *mut c_double, eps: c_double);

    // Tidal acceleration
    pub fn swe_get_tid_acc() -> c_double;
    pub fn swe_set_tid_acc(t_acc: c_double);
    pub fn swe_set_delta_t_userdef(dt: c_double);

    // Normalization
    pub fn swe_degnorm(x: c_double) -> c_double;
    pub fn swe_radnorm(x: c_double) -> c_double;
    pub fn swe_rad_midp(x1: c_double, x0: c_double) -> c_double;
    pub fn swe_deg_midp(x1: c_double, x0: c_double) -> c_double;
    pub fn swe_split_deg(ddeg: c_double, roundflag: int32, ideg: *mut int32, imin: *mut int32, isec: *mut int32, dsecfr: *mut c_double, isgn: *mut int32);

    // Centisec functions
    pub fn swe_csnorm(p: centisec) -> centisec;
    pub fn swe_difcsn(p1: centisec, p2: centisec) -> centisec;
    pub fn swe_difdegn(p1: c_double, p2: c_double) -> c_double;
    pub fn swe_difcs2n(p1: centisec, p2: centisec) -> centisec;
    pub fn swe_difdeg2n(p1: c_double, p2: c_double) -> c_double;
    pub fn swe_difrad2n(p1: c_double, p2: c_double) -> c_double;
    pub fn swe_csroundsec(x: centisec) -> centisec;
    pub fn swe_d2l(x: c_double) -> int32;
    pub fn swe_day_of_week(jd: c_double) -> c_int;
    pub fn swe_cs2timestr(t: CSEC, sep: c_int, suppress_zero: AS_BOOL, a: *mut c_char) -> *mut c_char;
    pub fn swe_cs2lonlatstr(t: CSEC, pchar: c_char, mchar: c_char, s: *mut c_char) -> *mut c_char;
    pub fn swe_cs2degstr(t: CSEC, a: *mut c_char) -> *mut c_char;

    // Heliacal events
    pub fn swe_heliacal_ut(tjdstart_ut: c_double, geopos: *mut c_double, datm: *mut c_double, dobs: *mut c_double, object_name: *mut c_char, type_event: int32, iflag: int32, dret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_heliacal_pheno_ut(tjd_ut: c_double, geopos: *mut c_double, datm: *mut c_double, dobs: *mut c_double, object_name: *mut c_char, type_event: int32, helflag: int32, darr: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_vis_limit_mag(tjdut: c_double, geopos: *mut c_double, datm: *mut c_double, dobs: *mut c_double, object_name: *mut c_char, helflag: int32, dret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_heliacal_angle(tjdut: c_double, dgeo: *mut c_double, datm: *mut c_double, dobs: *mut c_double, helflag: int32, mag: c_double, azi_obj: c_double, azi_sun: c_double, azi_moon: c_double, alt_moon: c_double, dret: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_topo_arcus_visionis(tjdut: c_double, dgeo: *mut c_double, datm: *mut c_double, dobs: *mut c_double, helflag: int32, mag: c_double, azi_obj: c_double, alt_obj: c_double, azi_sun: c_double, azi_moon: c_double, alt_moon: c_double, dret: *mut c_double, serr: *mut c_char) -> int32;

    // Cross functions
    pub fn swe_solcross(x2cross: c_double, jd_et: c_double, flag: int32, serr: *mut c_char) -> c_double;
    pub fn swe_solcross_ut(x2cross: c_double, jd_ut: c_double, flag: int32, serr: *mut c_char) -> c_double;
    pub fn swe_mooncross(x2cross: c_double, jd_et: c_double, flag: int32, serr: *mut c_char) -> c_double;
    pub fn swe_mooncross_ut(x2cross: c_double, jd_ut: c_double, flag: int32, serr: *mut c_char) -> c_double;
    pub fn swe_mooncross_node(jd_et: c_double, flag: int32, xlon: *mut c_double, xlat: *mut c_double, serr: *mut c_char) -> c_double;
    pub fn swe_mooncross_node_ut(jd_ut: c_double, flag: int32, xlon: *mut c_double, xlat: *mut c_double, serr: *mut c_char) -> c_double;
    pub fn swe_helio_cross(ipl: int32, x2cross: c_double, jd_et: c_double, iflag: int32, dir: int32, jd_cross: *mut c_double, serr: *mut c_char) -> int32;
    pub fn swe_helio_cross_ut(ipl: int32, x2cross: c_double, jd_ut: c_double, iflag: int32, dir: int32, jd_cross: *mut c_double, serr: *mut c_char) -> int32;

    // Gauquelin
    pub fn swe_gauquelin_sector(t_ut: c_double, ipl: int32, starname: *mut c_char, iflag: int32, imeth: int32, geopos: *mut c_double, atpress: c_double, attemp: c_double, dgsect: *mut c_double, serr: *mut c_char) -> int32;

    // Models
    pub fn swe_set_astro_models(samod: *mut c_char, iflag: int32);
    pub fn swe_get_astro_models(samod: *mut c_char, sdet: *mut c_char, iflag: int32);
    pub fn swe_get_current_file_data(ifno: c_int, tfstart: *mut c_double, tfend: *mut c_double, denum: *mut c_int) -> *const c_char;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_julday() {
        unsafe {
            let jd = swe_julday(2000, 1, 1, 12.0, SE_GREG_CAL);
            // J2000.0 = 2451545.0
            assert!((jd - 2451545.0).abs() < 0.0001);
        }
    }

    #[test]
    fn test_version() {
        unsafe {
            let mut buf = [0i8; 256];
            swe_version(buf.as_mut_ptr());
            // Version should start with a digit
            assert!(buf[0] >= b'0' as i8 && buf[0] <= b'9' as i8);
        }
    }
}
