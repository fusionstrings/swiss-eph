//! Safe, idiomatic Rust wrapper for Swiss Ephemeris
//!
//! This module provides a high-level, safe API on top of the raw FFI bindings.

use crate::*;
use std::ffi::{CStr, CString};
use std::os::raw::c_int;

/// Error returned by Swiss Ephemeris calculations
#[derive(Debug, Clone)]
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
pub fn calc_ut(jd_ut: f64, planet: i32, flags: CalcFlags) -> Result<Position> {
    let mut xx = [0.0f64; 6];
    let mut serr = [0i8; 256];
    
    let ret = unsafe {
        swe_calc_ut(jd_ut, planet, flags.raw(), xx.as_mut_ptr(), serr.as_mut_ptr())
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

/// Get the ayanamsa (sidereal offset)
pub fn get_ayanamsa(jd: f64) -> f64 {
    unsafe { swe_get_ayanamsa(jd) }
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
