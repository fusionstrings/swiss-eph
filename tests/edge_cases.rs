//! Edge case and comprehensive tests
//!
//! Tests covering edge cases, all house systems, and all sidereal modes.

use swiss_eph::*;
use swiss_eph::safe::*;

const TOLERANCE: f64 = 1e-8;

/// Ancient date test (1 AD)
#[test]
fn test_ancient_date() {
    let jd = julday(1, 1, 1, 12.0);
    let flags = CalcFlags::new().with_speed();
    
    // Should calculate Sun position for 1 AD
    let pos = calc(jd, SE_SUN, flags);
    assert!(pos.is_ok(), "Should calculate ancient date");
    
    let pos = pos.unwrap();
    assert!(pos.longitude >= 0.0 && pos.longitude < 360.0);
}

/// Far future test (3000 AD)
#[test]
fn test_far_future() {
    let jd = julday(3000, 1, 1, 12.0);
    let flags = CalcFlags::new().with_speed();
    
    let pos = calc(jd, SE_SUN, flags);
    assert!(pos.is_ok(), "Should calculate far future date");
}

/// Julian/Gregorian boundary
#[test]
fn test_gregorian_boundary() {
    // October 15, 1582 - first day of Gregorian calendar
    let jd = julday(1582, 10, 15, 12.0);
    let flags = CalcFlags::new();
    
    let pos = calc(jd, SE_SUN, flags);
    assert!(pos.is_ok());
}

/// Test all major planets
#[test]
fn test_all_planets() {
    let jd = julday(2000, 1, 1, 12.0);
    let flags = CalcFlags::new().with_speed();
    
    let planets = [
        (SE_SUN, "Sun"),
        (SE_MOON, "Moon"),
        (SE_MERCURY, "Mercury"),
        (SE_VENUS, "Venus"),
        (SE_MARS, "Mars"),
        (SE_JUPITER, "Jupiter"),
        (SE_SATURN, "Saturn"),
        (SE_URANUS, "Uranus"),
        (SE_NEPTUNE, "Neptune"),
        (SE_PLUTO, "Pluto"),
    ];
    
    for (planet, name) in planets {
        let pos = calc(jd, planet, flags);
        assert!(pos.is_ok(), "Failed to calculate {}", name);
        
        let pos = pos.unwrap();
        assert!(pos.longitude >= 0.0 && pos.longitude < 360.0, 
                "{} longitude out of range", name);
    }
}

/// Test all house systems
#[test]
fn test_all_house_systems() {
    let jd_ut = julday(2000, 1, 1, 12.0);
    let lat = 47.3769; // Zurich
    let lon = 8.5417;
    
    let systems = [
        (HouseSystem::Placidus, "Placidus"),
        (HouseSystem::Koch, "Koch"),
        (HouseSystem::Porphyrius, "Porphyrius"),
        (HouseSystem::Regiomontanus, "Regiomontanus"),
        (HouseSystem::Campanus, "Campanus"),
        (HouseSystem::Equal, "Equal"),
        (HouseSystem::WholeSign, "WholeSign"),
        (HouseSystem::Alcabitus, "Alcabitus"),
        (HouseSystem::Morinus, "Morinus"),
        (HouseSystem::Topocentric, "Topocentric"),
    ];
    
    for (system, name) in systems {
        let result = houses(jd_ut, lat, lon, system);
        assert!(result.is_ok(), "Failed to calculate {} houses", name);
        
        let cusps = result.unwrap();
        
        // Verify ascendant is valid
        assert!(cusps.ascendant >= 0.0 && cusps.ascendant < 360.0,
                "{} ASC out of range", name);
        
        // Verify MC is valid
        assert!(cusps.mc >= 0.0 && cusps.mc < 360.0,
                "{} MC out of range", name);
        
        // Verify all 12 cusps are valid
        for (i, cusp) in cusps.cusps.iter().enumerate() {
            assert!(*cusp >= 0.0 && *cusp < 360.0,
                    "{} cusp {} out of range", name, i + 1);
        }
    }
}

/// Test all sidereal modes
#[test]
fn test_all_sidereal_modes() {
    let jd = julday(2000, 1, 1, 12.0);
    
    let modes = [
        (SE_SIDM_FAGAN_BRADLEY, "Fagan-Bradley"),
        (SE_SIDM_LAHIRI, "Lahiri"),
        (SE_SIDM_DELUCE, "DeLuce"),
        (SE_SIDM_RAMAN, "Raman"),
        (SE_SIDM_USHASHASHI, "Ushashashi"),
        (SE_SIDM_KRISHNAMURTI, "Krishnamurti"),
        (SE_SIDM_DJWHAL_KHUL, "Djwhal Khul"),
        (SE_SIDM_YUKTESHWAR, "Yukteshwar"),
        (SE_SIDM_JN_BHASIN, "JN Bhasin"),
        (SE_SIDM_TRUE_CITRA, "True Citra"),
        (SE_SIDM_TRUE_REVATI, "True Revati"),
        (SE_SIDM_TRUE_PUSHYA, "True Pushya"),
    ];
    
    for (mode, name) in modes {
        set_sidereal_mode(mode);
        let aya = get_ayanamsa(jd);
        
        // Ayanamsa should be roughly 23-25 degrees for J2000
        assert!(aya >= 15.0 && aya <= 35.0,
                "{} ayanamsa {} out of expected range", name, aya);
    }
    
    // Reset to tropical
    set_sidereal_mode(0);
}

/// Test equatorial coordinates
#[test]
fn test_equatorial_coordinates() {
    let jd = julday(2000, 1, 1, 12.0);
    let flags = CalcFlags::new().with_equatorial().with_speed();
    
    let pos = calc(jd, SE_SUN, flags).unwrap();
    
    // For equatorial, xx[0] is RA (0-360), xx[1] is declination (-90 to +90)
    assert!(pos.longitude >= 0.0 && pos.longitude < 360.0, "RA out of range");
    assert!(pos.latitude >= -90.0 && pos.latitude <= 90.0, "Dec out of range");
}

/// Test heliocentric positions
#[test]
fn test_heliocentric() {
    let jd = julday(2000, 1, 1, 12.0);
    let flags = CalcFlags::new().with_heliocentric().with_speed();
    
    // Earth position from heliocentric view
    let pos = calc(jd, SE_EARTH, flags).unwrap();
    
    assert!(pos.longitude >= 0.0 && pos.longitude < 360.0);
}

/// Test delta-T across epochs
#[test]
fn test_delta_t_epochs() {
    let epochs = [
        (1900, "1900"),
        (1950, "1950"),
        (2000, "2000"),
        (2020, "2020"),
        (2050, "2050"),
    ];
    
    for (year, name) in epochs {
        let jd = julday(year, 1, 1, 12.0);
        let dt = deltat(jd);
        let dt_seconds = dt * 86400.0;
        
        // Delta-T should be reasonable (within -10 to +200 seconds for these dates)
        assert!(dt_seconds > -100.0 && dt_seconds < 500.0,
                "Delta-T for {} = {} seconds seems unreasonable", name, dt_seconds);
    }
}

/// Test sidereal time
#[test]
fn test_sidereal_time() {
    let jd = julday(2000, 1, 1, 12.0);
    let st = sidereal_time(jd);
    
    // Sidereal time should be 0-24 hours
    assert!(st >= 0.0 && st < 24.0, "Sidereal time {} out of range", st);
}

/// Test degree normalization
#[test]
fn test_normalize() {
    assert!((normalize_degrees(0.0) - 0.0).abs() < TOLERANCE);
    assert!((normalize_degrees(360.0) - 0.0).abs() < TOLERANCE);
    assert!((normalize_degrees(720.0) - 0.0).abs() < TOLERANCE);
    assert!((normalize_degrees(-90.0) - 270.0).abs() < TOLERANCE);
    assert!((normalize_degrees(-360.0) - 0.0).abs() < TOLERANCE);
}

/// Test planet names
#[test]
fn test_planet_names() {
    let planets = [
        (SE_SUN, "Sun"),
        (SE_MOON, "Moon"),
        (SE_MERCURY, "Mercury"),
        (SE_VENUS, "Venus"),
        (SE_MARS, "Mars"),
    ];
    
    for (planet, expected) in planets {
        let name = get_planet_name(planet);
        assert_eq!(name, expected);
    }
}

/// Test calendar conversions round-trip
#[test]
fn test_calendar_roundtrip() {
    let dates = [
        (2000, 1, 1, 12.0),
        (1900, 6, 15, 6.5),
        (2100, 12, 31, 23.99),
    ];
    
    for (year, month, day, hour) in dates {
        let jd = julday(year, month, day, hour);
        let (y, m, d, h) = revjul(jd);
        
        assert_eq!(y, year, "Year mismatch");
        assert_eq!(m, month, "Month mismatch");
        assert_eq!(d, day, "Day mismatch");
        assert!((h - hour).abs() < 0.001, "Hour mismatch");
    }
}
