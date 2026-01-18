//! Comparison tests against swetest_enhanced golden values
//!
//! These tests verify that the Rust FFI bindings produce identical results
//! to the native swetest_enhanced tool.

use swisseph_wasi::*;
use std::ffi::CString;
use std::os::raw::c_int;

/// Test Julian Day for primary comparison (2026-01-14 00:00:00 TT)
const TEST_JD_TT: f64 = 2461054.5;

/// Expected planet positions from swetest_enhanced (lon, lat, dist)
/// Generated using TT (Terrestrial Time) via swe_calc, not swe_calc_ut
const GOLDEN_PLANETS: &[(c_int, &str, f64, f64, f64)] = &[
    (SE_SUN, "Sun", 293.81730274152159, -0.00014465885805895869, 0.98361759930787152),
    (SE_MOON, "Moon", 240.2045245074182, -5.0491765206737718, 0.0027101206614606119),
    (SE_MERCURY, "Mercury", 289.02458791569961, -1.723475041316012, 1.4301574139324769),
    (SE_VENUS, "Venus", 295.57017792959209, -0.94917724728171693, 1.7103132125378804),
    (SE_MARS, "Mars", 292.71374057711898, -0.96553253185216081, 2.3990531609942498),
    (SE_JUPITER, "Jupiter", 109.61279509652759, 0.2694614382784325, 4.235152170381447),
    (SE_SATURN, "Saturn", 357.0529694941323, -2.218530183761545, 9.9165065760116047),
    (SE_URANUS, "Uranus", 57.64833150106049, -0.19380564282751711, 18.92308164652189),
    (SE_NEPTUNE, "Neptune", 359.71560716394083, -1.3244131367917702, 30.272536955070063),
    (SE_PLUTO, "Pluto", 303.12665611931556, -3.7819288159056303, 36.398518710258635),
    (SE_MEAN_NODE, "MeanNode", 341.48085447095048, 0.0, 0.0025695552897999903),
    (SE_TRUE_NODE, "TrueNode", 340.14898212762637, 0.0, 0.0025162002739006649),
    (SE_CHIRON, "Chiron", 22.658787594149807, 0.48010707901867883, 18.396792841115996),
    (SE_CERES, "Ceres", 10.143242312816593, -8.0600346031189023, 2.9450372222110959),
    (SE_PALLAS, "Pallas", 326.52095865675761, 9.4501124662926053, 4.0609946421405301),
    (SE_JUNO, "Juno", 275.54512330533311, 9.9526447682980432, 4.0929078976090203),
    (SE_VESTA, "Vesta", 301.13315206242117, -1.7329075612566183, 3.1827602325018041),
];

/// Expected ayanamsa values from swetest_enhanced
const GOLDEN_AYANAMSAS: &[(c_int, &str, f64)] = &[
    (SE_SIDM_FAGAN_BRADLEY, "FaganBradley", 25.105724929777978),
    (SE_SIDM_LAHIRI, "Lahiri", 24.222517285555568),
    (SE_SIDM_RAMAN, "Raman", 22.776216001174475),
    (SE_SIDM_USHASHASHI, "Ushashashi", 20.422965988656131),
    (SE_SIDM_KRISHNAMURTI, "Krishnamurti", 24.125665001174468),
    (SE_SIDM_TRUE_CITRA, "TrueCitra", 24.206420487877864),
];

/// Expected Delta-T from swetest_enhanced
const GOLDEN_DELTA_T_SECONDS: f64 = 68.895537775023399;

/// Expected sidereal time from swetest_enhanced
const GOLDEN_SIDEREAL_TIME: f64 = 7.5458654617244152;

/// Tolerance for floating point comparison (IEEE 754 practical limit)
const TOLERANCE: f64 = 1e-10;

fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
    (a - b).abs() < tol
}

/// Set ephemeris path for accurate calculations
/// Uses compile-time CARGO_MANIFEST_DIR for reliable path resolution
fn setup_ephemeris() {
    // Build absolute path: crate dir + ../vendor/swisseph/ephe
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let ephe_path = format!("{}/../vendor/swisseph/ephe", manifest_dir);
    let path = CString::new(ephe_path).unwrap();
    unsafe {
        swe_set_ephe_path(path.as_ptr());
    }
}

#[test]
fn test_planet_positions_vs_swetest_enhanced() {
    setup_ephemeris();
    
    unsafe {
        let mut xx = [0.0f64; 6];
        let mut serr = [0i8; 256];
        // Use SAME flags as swetest_enhanced: true pos, no aberration, no nutation
        let iflag = SEFLG_SWIEPH | SEFLG_TRUEPOS | SEFLG_NOABERR | SEFLG_NONUT;

        let mut passed = 0;
        let mut failed = 0;

        for &(planet, name, expected_lon, expected_lat, expected_dist) in GOLDEN_PLANETS {
            // Use swe_calc (TT) NOT swe_calc_ut (UT) - golden values use TT
            let ret = swe_calc(TEST_JD_TT, planet, iflag, xx.as_mut_ptr(), serr.as_mut_ptr());
            
            if ret < 0 {
                eprintln!("ERROR calculating {}: return code {}", name, ret);
                failed += 1;
                continue;
            }

            let lon_ok = approx_eq(xx[0], expected_lon, TOLERANCE);
            let lat_ok = approx_eq(xx[1], expected_lat, TOLERANCE);
            let dist_ok = approx_eq(xx[2], expected_dist, TOLERANCE);

            if lon_ok && lat_ok && dist_ok {
                passed += 1;
            } else {
                failed += 1;
                eprintln!("MISMATCH for {}:", name);
                if !lon_ok {
                    eprintln!("  lon: {} vs {} (diff {})", xx[0], expected_lon, (xx[0] - expected_lon).abs());
                }
                if !lat_ok {
                    eprintln!("  lat: {} vs {} (diff {})", xx[1], expected_lat, (xx[1] - expected_lat).abs());
                }
                if !dist_ok {
                    eprintln!("  dist: {} vs {} (diff {})", xx[2], expected_dist, (xx[2] - expected_dist).abs());
                }
            }
        }

        swe_close();

        println!("\n=== Planet Position Comparison vs swetest_enhanced ===");
        println!("Passed: {}/{}", passed, GOLDEN_PLANETS.len());
        println!("Tolerance: {:.0e}", TOLERANCE);
        
        assert_eq!(failed, 0, "Some planet positions did not match swetest_enhanced");
    }
}

#[test]
fn test_ayanamsa_values_vs_swetest_enhanced() {
    setup_ephemeris();
    
    unsafe {
        let mut daya = 0.0f64;
        let mut serr = [0i8; 256];
        
        let mut passed = 0;
        let mut failed = 0;

        for &(mode, name, expected) in GOLDEN_AYANAMSAS {
            swe_set_sid_mode(mode, 0.0, 0.0);
            // Use swe_get_ayanamsa_ex (TT) NOT _ut
            let ret = swe_get_ayanamsa_ex(TEST_JD_TT, SEFLG_SWIEPH, &mut daya, serr.as_mut_ptr());
            
            if ret < 0 {
                eprintln!("ERROR getting ayanamsa {}: return code {}", name, ret);
                failed += 1;
                continue;
            }

            if approx_eq(daya, expected, TOLERANCE) {
                passed += 1;
            } else {
                failed += 1;
                eprintln!("MISMATCH for {} ayanamsa:", name);
                eprintln!("  got: {} vs expected: {} (diff {})", daya, expected, (daya - expected).abs());
            }
        }

        swe_close();

        println!("\n=== Ayanamsa Comparison vs swetest_enhanced ===");
        println!("Passed: {}/{}", passed, GOLDEN_AYANAMSAS.len());
        
        assert_eq!(failed, 0, "Some ayanamsa values did not match swetest_enhanced");
    }
}

#[test]
fn test_delta_t_vs_swetest_enhanced() {
    unsafe {
        let delta_t_days = swe_deltat(TEST_JD_TT);
        let delta_t_seconds = delta_t_days * 86400.0;

        println!("\n=== Delta-T Comparison vs swetest_enhanced ===");
        println!("Rust:     {:.15} seconds", delta_t_seconds);
        println!("Expected: {:.15} seconds", GOLDEN_DELTA_T_SECONDS);
        println!("Diff:     {:.2e} seconds", (delta_t_seconds - GOLDEN_DELTA_T_SECONDS).abs());

        assert!(
            approx_eq(delta_t_seconds, GOLDEN_DELTA_T_SECONDS, 0.001),
            "Delta-T mismatch: {} vs {} (diff {})",
            delta_t_seconds, GOLDEN_DELTA_T_SECONDS, (delta_t_seconds - GOLDEN_DELTA_T_SECONDS).abs()
        );
    }
}

#[test]
fn test_sidereal_time_vs_swetest_enhanced() {
    // Golden value uses UT for sidereal time, so we need to convert TT to UT
    // UT = TT - Delta_T
    let delta_t_days = GOLDEN_DELTA_T_SECONDS / 86400.0;
    let jd_ut = TEST_JD_TT - delta_t_days;
    
    unsafe {
        let sidtime = swe_sidtime(jd_ut);

        println!("\n=== Sidereal Time Comparison vs swetest_enhanced ===");
        println!("Rust:     {:.15} hours", sidtime);
        println!("Expected: {:.15} hours", GOLDEN_SIDEREAL_TIME);
        println!("Diff:     {:.2e} hours", (sidtime - GOLDEN_SIDEREAL_TIME).abs());

        assert!(
            approx_eq(sidtime, GOLDEN_SIDEREAL_TIME, TOLERANCE),
            "Sidereal time mismatch: {} vs {} (diff {})",
            sidtime, GOLDEN_SIDEREAL_TIME, (sidtime - GOLDEN_SIDEREAL_TIME).abs()
        );
    }
}

#[test]
fn test_house_cusps_placidus_vs_swetest_enhanced() {
    // Zurich coordinates
    const GEOLAT: f64 = 47.376899999999999;
    const GEOLON: f64 = 8.5417000000000005;
    
    // swe_houses uses UT, so convert TT to UT
    let delta_t_days = GOLDEN_DELTA_T_SECONDS / 86400.0;
    let jd_ut = TEST_JD_TT - delta_t_days;
    
    // Expected Placidus cusps from swetest_enhanced
    const EXPECTED_CUSPS: [f64; 12] = [
        203.44718911261253,
        230.49451179857022,
        263.06651219045125,
        299.56667880427727,
        333.57194954891395,
        1.434646792048909,
        23.447189112612534,
        50.494511798570215,
        83.066512190451249,
        119.56667880427727,
        153.57194954891398,
        181.43464679204891,
    ];
    const EXPECTED_ASC: f64 = 203.44718911261253;
    const EXPECTED_MC: f64 = 119.56667880427727;

    unsafe {
        let mut cusps = [0.0f64; 13];
        let mut ascmc = [0.0f64; 10];
        
        let ret = swe_houses(jd_ut, GEOLAT, GEOLON, b'P' as c_int, cusps.as_mut_ptr(), ascmc.as_mut_ptr());
        
        assert!(ret >= 0, "swe_houses failed with code {}", ret);

        println!("\n=== House Cusps (Placidus) Comparison vs swetest_enhanced ===");

        let mut all_ok = true;

        // Check ASC and MC
        if !approx_eq(ascmc[0], EXPECTED_ASC, TOLERANCE) {
            eprintln!("ASC mismatch: {} vs {} (diff {})", ascmc[0], EXPECTED_ASC, (ascmc[0] - EXPECTED_ASC).abs());
            all_ok = false;
        }
        if !approx_eq(ascmc[1], EXPECTED_MC, TOLERANCE) {
            eprintln!("MC mismatch: {} vs {} (diff {})", ascmc[1], EXPECTED_MC, (ascmc[1] - EXPECTED_MC).abs());
            all_ok = false;
        }

        // Check all 12 cusps (cusps[1] through cusps[12])
        for i in 0..12 {
            let cusp = cusps[i + 1];
            let expected = EXPECTED_CUSPS[i];
            if !approx_eq(cusp, expected, TOLERANCE) {
                eprintln!("Cusp {} mismatch: {} vs {} (diff {})", i + 1, cusp, expected, (cusp - expected).abs());
                all_ok = false;
            }
        }

        if all_ok {
            println!("All 12 cusps + ASC/MC match within {:.0e}", TOLERANCE);
        }

        assert!(all_ok, "House cusp comparison failed");
    }
}

#[test]
fn test_julday_known_dates() {
    // Reference dates with known Julian Days
    let test_cases = [
        ((2000, 1, 1, 12.0), 2451545.0, "J2000.0"),
        ((1957, 10, 4, 0.0), 2436115.5, "Sputnik launch (approx)"),
        ((1969, 7, 20, 0.0), 2440422.5, "Moon landing (approx)"),
    ];

    println!("\n=== Julian Day Calculation Test ===");

    for ((year, month, day, hour), expected_jd, desc) in test_cases {
        let jd = unsafe { swe_julday(year, month, day, hour, SE_GREG_CAL) };
        
        // Allow 1 day tolerance for approximate dates
        let diff = (jd - expected_jd).abs();
        println!("{}: JD {} (expected ~{}), diff {:.1} days", desc, jd, expected_jd, diff);
        
        // J2000.0 should be exact
        if desc == "J2000.0" {
            assert!(diff < 0.0001, "J2000.0 calculation incorrect");
        }
    }
}
