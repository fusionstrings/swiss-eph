//! Live comparison test against swetest_enhanced binary
//! 
//! This test runs the actual swetest_enhanced binary and compares
//! the output directly against Rust FFI calculations.

use swiss_eph::*;
use std::ffi::CString;
use std::os::raw::c_int;
use std::process::Command;

/// Set ephemeris path for accurate calculations
fn setup_ephemeris() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    
    // 1. Try local crate vendor path (cleaner)
    let mut ephe_path = format!("{}/vendor/swisseph/ephe", manifest_dir);
    if !std::path::Path::new(&ephe_path).exists() {
        // 2. Try repository root vendor path (compatibility)
        ephe_path = format!("{}/../../vendor/swisseph/ephe", manifest_dir);
    }
    
    let path = CString::new(ephe_path).unwrap();
    unsafe {
        swe_set_ephe_path(path.as_ptr());
    }
}

/// Parse a planet position line from swetest_enhanced output
fn parse_planet_line(line: &str) -> Option<(String, f64, f64, f64)> {
    // Format: "  SE_SUN: { lon: 293.81730274152159, lat: -0.00014465885805895869, dist: 0.98361759930787152, name: "Sun" },"
    if !line.contains("lon:") {
        return None;
    }
    
    let name = line.trim().split(':').next()?.trim().to_string();
    
    let lon_start = line.find("lon:")? + 4;
    let lon_end = line[lon_start..].find(',')? + lon_start;
    let lon: f64 = line[lon_start..lon_end].trim().parse().ok()?;
    
    let lat_start = line.find("lat:")? + 4;
    let lat_end = line[lat_start..].find(',')? + lat_start;
    let lat: f64 = line[lat_start..lat_end].trim().parse().ok()?;
    
    let dist_start = line.find("dist:")? + 5;
    let dist_end = line[dist_start..].find(',')? + dist_start;
    let dist: f64 = line[dist_start..dist_end].trim().parse().ok()?;
    
    Some((name, lon, lat, dist))
}

/// Planets to test
const TEST_PLANETS: &[(c_int, &str)] = &[
    (SE_SUN, "SE_SUN"),
    (SE_MOON, "SE_MOON"),
    (SE_MERCURY, "SE_MERCURY"),
    (SE_VENUS, "SE_VENUS"),
    (SE_MARS, "SE_MARS"),
    (SE_JUPITER, "SE_JUPITER"),
    (SE_SATURN, "SE_SATURN"),
    (SE_URANUS, "SE_URANUS"),
    (SE_NEPTUNE, "SE_NEPTUNE"),
    (SE_PLUTO, "SE_PLUTO"),
    (SE_CHIRON, "SE_CHIRON"),
    (SE_CERES, "SE_CERES"),
];

/// Test Julian Day
const TEST_JD_TT: f64 = 2461054.5;

/// Tolerance
const TOLERANCE: f64 = 1e-10;

#[test]
fn test_live_comparison_with_swetest_enhanced() {
    // Run swetest_enhanced
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let mut swetest_path = format!("{}/../../scripts/swetest_enhanced", manifest_dir);
    if !std::path::Path::new(&swetest_path).exists() {
        swetest_path = format!("{}/../../swetest_enhanced", manifest_dir);
    }
    
    let output = Command::new(&swetest_path)
        .current_dir(manifest_dir)
        .output();
    
    let output = match output {
        Ok(o) => o,
        Err(e) => {
            eprintln!("Could not run swetest_enhanced: {}", e);
            eprintln!("Path: {}", swetest_path);
            return; // Skip test if binary not available
        }
    };
    
    if !output.status.success() {
        eprintln!("swetest_enhanced failed: {}", String::from_utf8_lossy(&output.stderr));
        return;
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Parse planet positions from output
    let mut swetest_positions: std::collections::HashMap<String, (f64, f64, f64)> = 
        std::collections::HashMap::new();
    
    for line in stdout.lines() {
        if let Some((name, lon, lat, dist)) = parse_planet_line(line) {
            swetest_positions.insert(name, (lon, lat, dist));
        }
    }
    
    println!("\n=== Live Comparison: Rust vs swetest_enhanced ===\n");
    
    // Setup ephemeris and compare
    setup_ephemeris();
    
    let mut passed = 0;
    let mut failed = 0;
    
    unsafe {
        let mut xx = [0.0f64; 6];
        let mut serr = [0i8; 256];
        let iflag = SEFLG_SWIEPH | SEFLG_TRUEPOS | SEFLG_NOABERR | SEFLG_NONUT;
        
        for &(planet, name) in TEST_PLANETS {
            let ret = swe_calc(TEST_JD_TT, planet, iflag, xx.as_mut_ptr(), serr.as_mut_ptr());
            
            if ret < 0 {
                eprintln!("ERROR calculating {}", name);
                failed += 1;
                continue;
            }
            
            let rust_lon = xx[0];
            let rust_lat = xx[1];
            let rust_dist = xx[2];
            
            if let Some(&(swetest_lon, swetest_lat, swetest_dist)) = swetest_positions.get(name) {
                let lon_diff = (rust_lon - swetest_lon).abs();
                let lat_diff = (rust_lat - swetest_lat).abs();
                let dist_diff = (rust_dist - swetest_dist).abs();
                
                let all_ok = lon_diff < TOLERANCE && lat_diff < TOLERANCE && dist_diff < TOLERANCE;
                
                if all_ok {
                    println!("✓ {} - MATCH (diff: lon={:.2e}, lat={:.2e}, dist={:.2e})", 
                             name, lon_diff, lat_diff, dist_diff);
                    passed += 1;
                } else {
                    println!("✗ {} - MISMATCH", name);
                    println!("  Rust:     lon={:.15}, lat={:.15}, dist={:.15}", rust_lon, rust_lat, rust_dist);
                    println!("  swetest:  lon={:.15}, lat={:.15}, dist={:.15}", swetest_lon, swetest_lat, swetest_dist);
                    println!("  diff:     lon={:.2e}, lat={:.2e}, dist={:.2e}", lon_diff, lat_diff, dist_diff);
                    failed += 1;
                }
            } else {
                println!("? {} - NOT FOUND in swetest output", name);
            }
        }
        
        swe_close();
    }
    
    println!("\n=== Summary ===");
    println!("Passed: {}/{}", passed, TEST_PLANETS.len());
    println!("Failed: {}", failed);
    println!("Tolerance: {:.0e}", TOLERANCE);
    
    assert_eq!(failed, 0, "Some positions did not match swetest_enhanced");
}

#[test]
fn test_live_delta_t_comparison() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let mut swetest_path = format!("{}/../../scripts/swetest_enhanced", manifest_dir);
    if !std::path::Path::new(&swetest_path).exists() {
        swetest_path = format!("{}/../../swetest_enhanced", manifest_dir);
    }
    
    let output = Command::new(&swetest_path)
        .current_dir(manifest_dir)
        .output();
    
    let output = match output {
        Ok(o) => o,
        Err(_) => return, // Skip if not available
    };
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Find Delta-T line for PRIMARY date
    // Format: "  PRIMARY: { days: 0.00079740205758128935, seconds: 68.895537775023399 },"
    let mut swetest_delta_t_sec = None;
    for line in stdout.lines() {
        if line.contains("PRIMARY:") && line.contains("seconds:") {
            if let Some(sec_start) = line.find("seconds:") {
                let sec_start = sec_start + 8;
                if let Some(sec_end_offset) = line[sec_start..].find('}') {
                    let sec_end = sec_start + sec_end_offset;
                    if let Ok(sec) = line[sec_start..sec_end].trim().parse::<f64>() {
                        swetest_delta_t_sec = Some(sec);
                        break;
                    }
                }
            }
        }
    }
    
    let swetest_sec = match swetest_delta_t_sec {
        Some(s) => s,
        None => {
            eprintln!("Could not parse Delta-T from swetest output");
            return;
        }
    };
    
    // Calculate with Rust
    let rust_delta_t_days = unsafe { swe_deltat(TEST_JD_TT) };
    let rust_delta_t_sec = rust_delta_t_days * 86400.0;
    
    println!("\n=== Delta-T Live Comparison ===");
    println!("Rust:     {:.15} seconds", rust_delta_t_sec);
    println!("swetest:  {:.15} seconds", swetest_sec);
    println!("Diff:     {:.2e} seconds", (rust_delta_t_sec - swetest_sec).abs());
    
    assert!((rust_delta_t_sec - swetest_sec).abs() < 1e-10, 
            "Delta-T mismatch");
}
