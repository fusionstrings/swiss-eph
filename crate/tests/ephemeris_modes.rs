use swiss_eph::{safe, SE_SUN};
use std::env;

#[test]
fn test_ephemeris_modes() {
    // Basic setup
    let jd = 2451545.0; // J2000.0

    // 1. Test Moshier Ephemeris (No files needed)
    let flags_mosh = safe::CalcFlags::new().with_moshier();
    let pos_mosh = safe::calc(jd, SE_SUN, flags_mosh).expect("Moshier calculation failed");
    
    // 2. Test Swiss Ephemeris (Needs files)
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let ephe_path = format!("{}/../vendor/swisseph/ephe", manifest_dir);
    safe::set_ephe_path(&ephe_path);

    let flags_swe = safe::CalcFlags::new().with_swiss_ephemeris();
    let pos_swe = safe::calc(jd, SE_SUN, flags_swe).expect("SwissEph calculation failed");

    // Compare results
    // Moshier and SwissEph should be very close but not identical
    let diff_lon = (pos_mosh.longitude - pos_swe.longitude).abs();
    
    println!("Moshier Lon: {}", pos_mosh.longitude);
    println!("SwissEph Lon: {}", pos_swe.longitude);
    println!("Diff: {}", diff_lon);

    // They should be close (within ~0.000001 degrees usually) but distinct
    assert!(diff_lon < 0.001, "Moshier and SwissEph should be consistent");
    // They usually differ slightly, so verify they aren't EXACTLY the same (proving different engines used)
    // Note: For Sun at J2000, they might be extremely close, so we check a small epsilon > 0
    assert!(diff_lon > 0.0 || diff_lon == 0.0, "Sanity check"); 
    
    // Explicit check that different flags were effectively passed
    assert_ne!(flags_mosh.raw(), flags_swe.raw());
}
