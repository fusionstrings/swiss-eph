//! Safe, idiomatic Rust wrapper for Swiss Ephemeris
//!
//! This module provides a high-level, safe API on top of the raw FFI bindings.

use crate::*;
use std::ffi::{CStr, CString};
use std::os::raw::c_int;

/// Error returned by Swiss Ephemeris calculations
#[derive(Debug, Clone)]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen(getter_with_clone))]
pub struct SwissEphError {
    /// Error message from the library
    pub message: String,
    /// Return code
    pub code: i32,
}


impl std::fmt::Display for SwissEphError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SwissEph error ({}): {}", self.code, self.message)
    }
}

impl std::error::Error for SwissEphError {}

/// Result type for Swiss Ephemeris operations
pub type Result<T> = std::result::Result<T, SwissEphError>;

/// Planetary position result
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
pub struct Position {
    /// Ecliptic longitude in degrees
    pub longitude: f64,
    /// Ecliptic latitude in degrees  
    pub latitude: f64,
    /// Distance (AU for planets, Earth radii for Moon)
    pub distance: f64,
    /// Longitude speed (degrees/day)
    pub longitude_speed: f64,
    /// Latitude speed (degrees/day)
    pub latitude_speed: f64,
    /// Distance speed (AU/day)
    pub distance_speed: f64,
}

/// House cusps and angles
#[derive(Debug, Clone)]
pub struct HouseCusps {
    /// House cusp positions (12 cusps, indices 0-11)
    pub cusps: [f64; 12],
    /// Ascendant
    pub ascendant: f64,
    /// Midheaven (MC)
    pub mc: f64,
    /// ARMC (sidereal time in degrees)
    pub armc: f64,
    /// Vertex
    pub vertex: f64,
    /// Equatorial Ascendant
    pub equatorial_ascendant: f64,
    /// Co-Ascendant (Koch)
    pub co_ascendant_koch: f64,
    /// Co-Ascendant (Munkasey)
    pub co_ascendant_munkasey: f64,
    /// Polar Ascendant
    pub polar_ascendant: f64,
}

/// Nodes and Apsides
#[derive(Debug, Clone, Copy)]
pub struct NodeApsides {
    pub ascending: f64,
    pub descending: f64,
    pub perihelion: f64,
    pub aphelion: f64,
}

/// Planetary Phenomena (Phase, Magnitude, etc.)
#[derive(Debug, Clone, Copy)]
pub struct Phenomenon {
    pub phase_angle: f64,
    pub phase: f64,
    pub elongation: f64,
    pub diameter_apparent: f64,
    pub magnitude: f64,
}

/// Solar Eclipse Attributes
#[derive(Debug, Clone, Copy)]
pub struct EclipseAttributes {
    pub time_max: f64,
    pub time_beg: f64,
    pub time_end: f64,
    pub tot_beg: f64,
    pub tot_end: f64,
    pub center_line: bool,
    pub annular: bool,
    pub total: bool,
    pub eclipse_magnitude: f64,
    pub saros_series: i32,
    pub saros_member: i32,
}

/// Geographic position for topocentric calculations
#[derive(Debug, Clone, Copy)]
pub struct GeoPos {
    /// Longitude in degrees
    pub longitude: f64,
    /// Latitude in degrees
    pub latitude: f64,
    /// Altitude in meters
    pub altitude: f64,
}

/// Rise, Set, and Transit times
#[derive(Debug, Clone, Copy)]
pub struct RiseSetEvent {
    /// Julian Day of the event
    pub time: f64,
    /// Flag indicating if the event is valid (e.g., circum-polar objects might not rise/set)
    pub valid: bool,
}

/// Calculation flags builder
#[derive(Debug, Clone, Copy, Default)]
pub struct CalcFlags {
    flags: i32,
}

impl CalcFlags {
    /// Create new flags with Swiss Ephemeris
    pub fn new() -> Self {
        Self { flags: SEFLG_SWIEPH }
    }

    /// Include speed values
    pub fn with_speed(mut self) -> Self {
        self.flags |= SEFLG_SPEED;
        self
    }

    /// Use true/geometric position
    pub fn with_true_position(mut self) -> Self {
        self.flags |= SEFLG_TRUEPOS;
        self
    }

    /// No aberration correction
    pub fn with_no_aberration(mut self) -> Self {
        self.flags |= SEFLG_NOABERR;
        self
    }

    /// No nutation
    pub fn with_no_nutation(mut self) -> Self {
        self.flags |= SEFLG_NONUT;
        self
    }

    /// Equatorial coordinates instead of ecliptic
    pub fn with_equatorial(mut self) -> Self {
        self.flags |= SEFLG_EQUATORIAL;
        self
    }

    /// Heliocentric position
    pub fn with_heliocentric(mut self) -> Self {
        self.flags |= SEFLG_HELCTR;
        self
    }

    /// Topocentric position
    pub fn with_topocentric(mut self) -> Self {
        self.flags |= SEFLG_TOPOCTR;
        self
    }

    /// Sidereal zodiac
    pub fn with_sidereal(mut self) -> Self {
        self.flags |= SEFLG_SIDEREAL;
        self
    }

    /// Use Moshier ephemeris (analytical, lower precision)
    pub fn with_moshier(mut self) -> Self {
        self.flags = (self.flags & !SEFLG_DEFAULTEPH) | SEFLG_MOSEPH;
        self
    }

    /// Use Swiss Ephemeris (default, requires ephemeris files)
    pub fn with_swiss_ephemeris(mut self) -> Self {
        self.flags = (self.flags & !SEFLG_MOSEPH & !SEFLG_JPLEPH) | SEFLG_SWIEPH;
        self
    }

    /// Use JPL ephemeris (requires DE*.eph files)
    pub fn with_jpl(mut self) -> Self {
        self.flags = (self.flags & !SEFLG_DEFAULTEPH) | SEFLG_JPLEPH;
        self
    }

    /// Get the raw flags value
    pub fn raw(&self) -> i32 {
        self.flags
    }
}

/// House system identifier
#[derive(Debug, Clone, Copy)]
#[repr(u8)]
pub enum HouseSystem {
    Placidus = b'P',
    Koch = b'K',
    Porphyrius = b'O',
    Regiomontanus = b'R',
    Campanus = b'C',
    Equal = b'E',
    WholeSign = b'W',
    Alcabitus = b'B',
    Morinus = b'M',
    Topocentric = b'T',
    Vehlow = b'V',
}

impl HouseSystem {
    fn as_char(&self) -> c_int {
        *self as c_int
    }
}

/// Set the ephemeris path
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub fn set_ephe_path(path: &str) {
    let c_path = CString::new(path).unwrap();
    unsafe {
        swe_set_ephe_path(c_path.as_ptr());
    }
}

/// Set topocentric observer position
pub fn set_topo(longitude: f64, latitude: f64, altitude: f64) {
    unsafe {
        swe_set_topo(longitude, latitude, altitude);
    }
}

/// Set sidereal mode
pub fn set_sidereal_mode(mode: i32) {
    unsafe {
        swe_set_sid_mode(mode, 0.0, 0.0);
    }
}

/// Close Swiss Ephemeris and free resources
pub fn close() {
    unsafe {
        swe_close();
    }
}

/// Get Swiss Ephemeris version
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub fn version() -> String {
    let mut buf = [0i8; 256];
    unsafe {
        swe_version(buf.as_mut_ptr());
        CStr::from_ptr(buf.as_ptr()).to_string_lossy().into_owned()
    }
}

/// Calculate Julian Day number
pub fn julday(year: i32, month: i32, day: i32, hour: f64) -> f64 {
    unsafe { swe_julday(year, month, day, hour, SE_GREG_CAL) }
}

/// Convert Julian Day to calendar date
pub fn revjul(jd: f64) -> (i32, i32, i32, f64) {
    let mut year = 0;
    let mut month = 0;
    let mut day = 0;
    let mut hour = 0.0;
    unsafe {
        swe_revjul(jd, SE_GREG_CAL, &mut year, &mut month, &mut day, &mut hour);
    }
    (year, month, day, hour)
}

/// Calculate Delta-T (difference between TT and UT)
pub fn deltat(jd: f64) -> f64 {
    unsafe { swe_deltat(jd) }
}

/// Calculate sidereal time at Greenwich
pub fn sidereal_time(jd_ut: f64) -> f64 {
    unsafe { swe_sidtime(jd_ut) }
}

/// Calculate planetary position
/// 
/// # Arguments
/// * `jd` - Julian Day in TT (Terrestrial Time)
/// * `planet` - Planet constant (e.g., SE_SUN, SE_MOON)
/// * `flags` - Calculation flags
/// 
/// # Returns
/// * `Ok(Position)` - Position and speed data
/// * `Err(SwissEphError)` - If calculation fails
pub fn calc(jd: f64, planet: i32, flags: CalcFlags) -> Result<Position> {
    let mut xx = [0.0f64; 6];
    let mut serr = [0i8; 256];
    
    let ret = unsafe {
        swe_calc(jd, planet, flags.raw(), xx.as_mut_ptr(), serr.as_mut_ptr())
    };
    
    if ret < 0 {
        let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }
    
    Ok(Position {
        longitude: xx[0],
        latitude: xx[1],
        distance: xx[2],
        longitude_speed: xx[3],
        latitude_speed: xx[4],
        distance_speed: xx[5],
    })
}

/// Calculate planetary position using UT (Universal Time)
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub fn calc_ut(jd_ut: f64, planet: i32, flags: i32) -> std::result::Result<Position, SwissEphError> {
    let mut xx = [0.0f64; 6];
    let mut serr = [0i8; 256];
    
    let ret = unsafe {
        swe_calc_ut(jd_ut, planet, flags, xx.as_mut_ptr(), serr.as_mut_ptr())
    };
    
    if ret < 0 {
        let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }
    
    Ok(Position {
        longitude: xx[0],
        latitude: xx[1],
        distance: xx[2],
        longitude_speed: xx[3],
        latitude_speed: xx[4],
        distance_speed: xx[5],
    })
}

/// Calculate fixed star position
pub fn calc_star(jd: f64, star: &str, flags: CalcFlags) -> Result<(String, Position)> {
    let mut xx = [0.0f64; 6];
    let mut serr = [0i8; 256];
    let mut star_buf = [0i8; 512];
    
    let c_star = CString::new(star).map_err(|e| SwissEphError {
        message: format!("Invalid star name: {}", e),
        code: -1,
    })?;
    
    let bytes = c_star.as_bytes_with_nul();
    if bytes.len() > 255 {
        return Err(SwissEphError {
            message: "Star name too long".to_string(),
            code: -1,
        });
    }
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), star_buf.as_mut_ptr() as *mut u8, bytes.len());
    }

    let ret = unsafe {
        swe_fixstar2(star_buf.as_mut_ptr(), jd, flags.raw(), xx.as_mut_ptr(), serr.as_mut_ptr())
    };
    
    if ret < 0 {
        let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }
    
    let returned_name = unsafe { CStr::from_ptr(star_buf.as_ptr()) }
        .to_string_lossy()
        .into_owned();

    Ok((returned_name, Position {
        longitude: xx[0],
        latitude: xx[1],
        distance: xx[2],
        longitude_speed: xx[3],
        latitude_speed: xx[4],
        distance_speed: xx[5],
    }))
}

/// Calculate result of a rise, set, or transit event
pub fn rise_trans(
    jd_ut: f64,
    planet: i32,
    star_name: Option<&str>,
    geopos: GeoPos,
    flags: i32, // SE_CALC_RISE, SE_CALC_SET, etc.
) -> Result<f64> {
    let mut tret = 0.0f64;
    let mut serr = [0i8; 256];
    let mut dgeo = [geopos.longitude, geopos.latitude, geopos.altitude];
    
    let mut star_buf = [0i8; 512];
    if let Some(name) = star_name {
        let c_star = CString::new(name).map_err(|e| SwissEphError {
            message: format!("Invalid star name: {}", e),
            code: -1,
        })?;
        let bytes = c_star.as_bytes_with_nul();
        if bytes.len() < 256 {
             unsafe {
                std::ptr::copy_nonoverlapping(bytes.as_ptr(), star_buf.as_mut_ptr() as *mut u8, bytes.len());
            }
        }
    }
    
    let star_ptr = if star_name.is_some() { star_buf.as_mut_ptr() } else { std::ptr::null_mut() };

    let atpress = 1013.25;
    let attemp = 10.0;

    let ret = unsafe {
        swe_rise_trans(
            jd_ut,
            planet,
            star_ptr,
            0, // epheflag (0 = default/SwissEph)
            flags,
            dgeo.as_mut_ptr(),
            atpress,
            attemp,
            &mut tret,
            serr.as_mut_ptr()
        )
    };

    if ret < 0 {
        let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    } else if ret != 0 {
        // Event did not occur (e.g. circumpolar)
         return Err(SwissEphError { message: "Event not found (e.g. circumpolar)".to_string(), code: -2 });
    }

    Ok(tret)
}

/// Calculate solar eclipse attributes
pub fn solar_eclipse_where(jd: f64, flags: i32) -> Result<(f64, f64, f64, f64)> {
    let mut geopos = [0.0; 10];
    let mut attr = [0.0; 20];
    let mut serr = [0i8; 256];

    let ret = unsafe {
        swe_sol_eclipse_where(jd, flags, geopos.as_mut_ptr(), attr.as_mut_ptr(), serr.as_mut_ptr())
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok((geopos[0], geopos[1], attr[0], attr[1]))
}

/// Find next solar eclipse at location
pub fn solar_eclipse_when_loc(
    jd_start: f64, 
    flags: i32, 
    geopos: GeoPos, 
    backward: bool
) -> Result<(f64, EclipseAttributes)> {
    let mut tret = [0.0; 10];
    let mut attr = [0.0; 20];
    let mut serr = [0i8; 256];
    let mut dgeo = [geopos.longitude, geopos.latitude, geopos.altitude];
    
    let ret = unsafe {
        swe_sol_eclipse_when_loc(
            jd_start, 
            flags, 
            dgeo.as_mut_ptr(), 
            tret.as_mut_ptr(), 
            attr.as_mut_ptr(), 
            backward as i32, 
            serr.as_mut_ptr()
        )
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok((tret[0], EclipseAttributes {
        time_max: tret[0],
        time_beg: tret[1],
        time_end: tret[2],
        tot_beg: tret[3],
        tot_end: tret[4],
        center_line: attr[0] != 0.0,
        annular: (ret & SE_ECL_ANNULAR) != 0,
        total: (ret & SE_ECL_TOTAL) != 0,
        eclipse_magnitude: attr[8],
        saros_series: attr[10] as i32,
        saros_member: attr[11] as i32,
    }))
}

/// Calculate heliacal event (rising, setting, etc.)
pub fn heliacal_event(
    jd_start: f64, 
    geopos: GeoPos, 
    datm: [f64; 4],
    dobs: [f64; 6],
    object: &str, 
    event_type: i32, 
    flags: i32
) -> Result<f64> {
    let mut dret = [0.0; 50];
    let mut serr = [0i8; 256];
    let mut dgeo = [geopos.longitude, geopos.latitude, geopos.altitude];
    let mut datm_mut = datm; // pressure, temp, humid, vis_limit
    let mut dobs_mut = dobs; // age, snellen, etc
    
    let c_obj = CString::new(object).unwrap();
    // Copy into mutable buffer as C API expects char* (though acts as const for name)
    let mut obj_buf = [0i8; 256];
    let bytes = c_obj.as_bytes_with_nul();
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), obj_buf.as_mut_ptr() as *mut u8, bytes.len());
    }

    let ret = unsafe {
        swe_heliacal_ut(
            jd_start,
            dgeo.as_mut_ptr(),
            datm_mut.as_mut_ptr(),
            dobs_mut.as_mut_ptr(),
            obj_buf.as_mut_ptr(),
            event_type,
            flags,
            dret.as_mut_ptr(),
            serr.as_mut_ptr()
        )
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok(dret[0])
}


pub fn azimuth_altitude(
    jd_ut: f64, 
    flags: i32, 
    geopos: GeoPos, 
    coord: Position
) -> Result<(f64, f64)> {
    let mut med_geopos = [geopos.longitude, geopos.latitude, geopos.altitude];
    let mut xin = [coord.longitude, coord.latitude, coord.distance];
    let mut xaz = [0.0; 3];
    
    unsafe {
        swe_azalt(
            jd_ut, 
            flags, 
            med_geopos.as_mut_ptr(), 
            1013.25, // pressure
            10.0,    // temp
            xin.as_mut_ptr(), 
            xaz.as_mut_ptr()
        );
    }
    
    // xaz[0] = azimuth, xaz[1] = true altitude, xaz[2] = apparent altitude
    Ok((xaz[0], xaz[1]))
}

/// Find next lunar eclipse at location
pub fn lunar_eclipse_when_loc(
    jd_start: f64, 
    flags: i32, 
    geopos: GeoPos, 
    backward: bool
) -> Result<(f64, EclipseAttributes)> {
    let mut tret = [0.0; 10];
    let mut attr = [0.0; 20];
    let mut serr = [0i8; 256];
    let mut dgeo = [geopos.longitude, geopos.latitude, geopos.altitude];
    
    let ret = unsafe {
        swe_lun_eclipse_when_loc(
            jd_start, 
            flags, 
            dgeo.as_mut_ptr(), 
            tret.as_mut_ptr(), 
            attr.as_mut_ptr(), 
            backward as i32, 
            serr.as_mut_ptr()
        )
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok((tret[0], EclipseAttributes {
        time_max: tret[0],
        time_beg: tret[1],
        time_end: tret[2],
        tot_beg: tret[3],
        tot_end: tret[4],
        center_line: false, // Not applicable for lunar
        annular: false,    // Not applicable
        total: (ret & SE_ECL_TOTAL) != 0,
        eclipse_magnitude: attr[8],
        saros_series: attr[10] as i32,
        saros_member: attr[11] as i32,
    }))
}

/// Convert UTC to Julian Day (ET and UT)
/// Returns (jd_et, jd_ut)
pub fn utc_to_jd(year: i32, month: i32, day: i32, hour: i32, min: i32, sec: f64, gregflag: i32) -> Result<(f64, f64)> {
    let mut dret = [0.0; 2];
    let mut serr = [0i8; 256];

    let ret = unsafe {
        swe_utc_to_jd(year, month, day, hour, min, sec, gregflag, dret.as_mut_ptr(), serr.as_mut_ptr())
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok((dret[0], dret[1]))
}

/// Convert JD (ET) to UTC
/// Returns (year, month, day, hour, min, sec)
pub fn jdet_to_utc(jd_et: f64, gregflag: i32) -> (i32, i32, i32, i32, i32, f64) {
    let mut year = 0;
    let mut month = 0;
    let mut day = 0;
    let mut hour = 0;
    let mut min = 0;
    let mut sec = 0.0;

    unsafe {
        swe_jdet_to_utc(jd_et, gregflag, &mut year, &mut month, &mut day, &mut hour, &mut min, &mut sec);
    }

    (year, month, day, hour, min, sec)
}

/// Coordinate transformation (Ecliptic <-> Equatorial)
/// EPS: mean obliquity of eclipse (must be calculated first if using True position)
pub fn coordinate_transform(position: Position, obliquity: f64) -> Position {
    let mut xin = [position.longitude, position.latitude, position.distance];
    let mut xout = [0.0; 3];

    unsafe {
        swe_cotrans(xin.as_mut_ptr(), xout.as_mut_ptr(), obliquity);
    }
    
    // Note: If transforming Ecliptic -> Equatorial:
    // xout[0] = Right Ascension (RA), xout[1] = Declination (Dec)
    // If Equatorial -> Ecliptic (input eps must be negative? or use cotrans_sp?)
    // swe_cotrans always transforms Ecliptic -> Equatorial if eps > 0
    // and Equatorial -> Ecliptic if eps < 0.

    Position {
        longitude: xout[0],
        latitude:  xout[1],
        distance:  xout[2],
        longitude_speed: 0.0, // Transform doesn't handle speeds automatically here
        latitude_speed: 0.0,
        distance_speed: 0.0,
    }
}

/// Calculate the house position of a body
/// 
/// `armc`: ARMC (Sidereal Time in degrees)
/// `geolat`: Geographic latitude
/// `eps`: Obliquity of ecliptic
/// `hsys`: House system char (e.g. 'P' for Placidus)
/// `xpin`: Body position [longitude, latitude]
pub fn house_pos(armc: f64, geolat: f64, eps: f64, hsys: char, xpin: [f64; 2]) -> Result<f64> {
    let mut serr = [0i8; 256];
    let mut xpin_mut = xpin; // copy array
    
    let ret = unsafe {
        swe_house_pos(armc, geolat, eps, hsys as i32, xpin_mut.as_mut_ptr(), serr.as_mut_ptr())
    };

    if ret == 0.0 {
        // swe_house_pos returns 0.0 on error? No, it returns house position 1.0..12.999
        // Wait, documentations says: returns 0.0 if error (and err msg).
        // Check swisseph docs: "return value ... is the house position ... On error, 0.0 is returned"
        // But 0.0 could be valid? House 0? No, houses are 1-based. 
        // Actually, houses are 1..12. 
        // But what if error? Check serr.
        
        // Let's check if serr is empty.
        let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
           .to_string_lossy();
        if !msg.is_empty() {
             return Err(SwissEphError { message: msg.into_owned(), code: -1 });
        }
    }

    Ok(ret)
}

/// Calculate Gauquelin sector
pub fn gauquelin_sector(
    jd_ut: f64, 
    ipl: i32, 
    star_name: Option<&str>,
    flags: i32, 
    imeth: i32, 
    geopos: GeoPos, 
    atpress: f64, 
    attemp: f64
) -> Result<f64> {
    let mut dgsect = [0.0; 5];
    let mut serr = [0i8; 256];
    let mut geopos_arr = [geopos.longitude, geopos.latitude, geopos.altitude];
    
    let mut star_buf = [0i8; 256];
    if let Some(name) = star_name {
        let c_star = CString::new(name).map_err(|e| SwissEphError {
            message: format!("Invalid star name: {}", e),
            code: -1,
        })?;
        let bytes = c_star.as_bytes_with_nul();
        if bytes.len() < 256 {
            unsafe {
                std::ptr::copy_nonoverlapping(bytes.as_ptr(), star_buf.as_mut_ptr() as *mut u8, bytes.len());
            }
        }
    }

    let ret = unsafe {
        swe_gauquelin_sector(
            jd_ut, 
            ipl, 
            star_buf.as_mut_ptr(), 
            flags, 
            imeth, 
            geopos_arr.as_mut_ptr(), 
            atpress, 
            attemp, 
            dgsect.as_mut_ptr(), 
            serr.as_mut_ptr()
        )
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok(dgsect[0])
}

/// Calculate atmospheric refraction
/// `calc_flag`: SE_TRUE_TO_APP (0) or SE_APP_TO_TRUE (1)
pub fn refraction(inalt: f64, atpress: f64, attemp: f64, calc_flag: i32) -> f64 {
    unsafe {
        swe_refrac(inalt, atpress, attemp, calc_flag)
    }
}

/// Get the ayanamsa (sidereal offset)
pub fn get_ayanamsa(jd: f64) -> f64 {
    unsafe { swe_get_ayanamsa(jd) }
}

/// Calculate nodes and apsides
pub fn nodes_apsides(jd: f64, planet: i32, flags: CalcFlags, method: i32) -> Result<NodeApsides> {
    let mut xnasc = [0.0; 6];
    let mut xndsc = [0.0; 6];
    let mut xperi = [0.0; 6];
    let mut xaphe = [0.0; 6];
    let mut serr = [0i8; 256];

    let ret = unsafe {
        swe_nod_aps(
            jd,
            planet,
            flags.raw(),
            method,
            xnasc.as_mut_ptr(),
            xndsc.as_mut_ptr(),
            xperi.as_mut_ptr(),
            xaphe.as_mut_ptr(),
            serr.as_mut_ptr(),
        )
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok(NodeApsides {
        ascending: xnasc[0],
        descending: xndsc[0],
        perihelion: xperi[0],
        aphelion: xaphe[0],
    })
}

/// Calculate planetary phenomena
pub fn phenomena(jd: f64, planet: i32, flags: CalcFlags) -> Result<Phenomenon> {
    let mut attr = [0.0; 20];
    let mut serr = [0i8; 256];

    let ret = unsafe {
        swe_pheno(jd, planet, flags.raw(), attr.as_mut_ptr(), serr.as_mut_ptr())
    };

    if ret < 0 {
       let msg = unsafe { CStr::from_ptr(serr.as_ptr()) }
            .to_string_lossy()
            .into_owned();
        return Err(SwissEphError { message: msg, code: ret });
    }

    Ok(Phenomenon {
        phase_angle: attr[0],
        phase: attr[1],
        elongation: attr[2],
        diameter_apparent: attr[3],
        magnitude: attr[4],
    })
}

/// Calculate house cusps
/// 
/// # Arguments
/// * `jd_ut` - Julian Day in UT
/// * `latitude` - Geographic latitude
/// * `longitude` - Geographic longitude  
/// * `system` - House system to use
pub fn houses(jd_ut: f64, latitude: f64, longitude: f64, system: HouseSystem) -> Result<HouseCusps> {
    let mut cusps = [0.0f64; 13];
    let mut ascmc = [0.0f64; 10];
    
    let ret = unsafe {
        swe_houses(
            jd_ut,
            latitude,
            longitude,
            system.as_char(),
            cusps.as_mut_ptr(),
            ascmc.as_mut_ptr(),
        )
    };
    
    if ret < 0 {
        return Err(SwissEphError {
            message: "House calculation failed".to_string(),
            code: ret,
        });
    }
    
    // cusps[0] is unused, cusps[1-12] are the house cusps
    let mut result_cusps = [0.0f64; 12];
    for i in 0..12 {
        result_cusps[i] = cusps[i + 1];
    }
    
    Ok(HouseCusps {
        cusps: result_cusps,
        ascendant: ascmc[0],
        mc: ascmc[1],
        armc: ascmc[2],
        vertex: ascmc[3],
        equatorial_ascendant: ascmc[4],
        co_ascendant_koch: ascmc[5],
        co_ascendant_munkasey: ascmc[6],
        polar_ascendant: ascmc[7],
    })
}

/// Get planet name
pub fn get_planet_name(planet: i32) -> String {
    let mut buf = [0i8; 256];
    unsafe {
        swe_get_planet_name(planet, buf.as_mut_ptr());
        CStr::from_ptr(buf.as_ptr()).to_string_lossy().into_owned()
    }
}

/// Normalize degrees to 0-360 range
pub fn normalize_degrees(deg: f64) -> f64 {
    unsafe { swe_degnorm(deg) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_julday() {
        let jd = julday(2000, 1, 1, 12.0);
        assert!((jd - 2451545.0).abs() < 0.0001);
    }

    #[test]
    fn test_safe_revjul() {
        let (year, month, day, hour) = revjul(2451545.0);
        assert_eq!(year, 2000);
        assert_eq!(month, 1);
        assert_eq!(day, 1);
        assert!((hour - 12.0).abs() < 0.0001);
    }

    #[test]
    fn test_safe_calc() {
        let jd = 2451545.0; // J2000.0
        let flags = CalcFlags::new().with_speed();
        let pos = calc(jd, SE_SUN, flags).unwrap();
        
        // Sun should be around 280° longitude at J2000.0
        assert!(pos.longitude > 270.0 && pos.longitude < 290.0);
        assert!(pos.latitude.abs() < 1.0);
    }

    #[test]
    fn test_safe_houses() {
        let jd_ut = 2451545.0;
        let cusps = houses(jd_ut, 47.3769, 8.5417, HouseSystem::Placidus).unwrap();
        
        // Ascendant should be a valid degree
        assert!(cusps.ascendant >= 0.0 && cusps.ascendant < 360.0);
        assert!(cusps.mc >= 0.0 && cusps.mc < 360.0);
    }

    #[test]
    fn test_version() {
        let v = version();
        assert!(!v.is_empty());
        // Version should start with a digit
        assert!(v.chars().next().unwrap().is_ascii_digit());
    }
}
