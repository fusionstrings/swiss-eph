use swiss_eph::*;
use swiss_eph::safe::{self, CalcFlags};

fn main() -> Result<(), safe::SwissEphError> {
    println!("=== Swiss Ephemeris Demo ===");
    
    // Set path
    safe::set_ephe_path("vendor/swisseph/ephe");

    let jd = 2460335.5; // 2024-01-25
    println!("JD: {}", jd);

    // Calculate Sun
    let pos = safe::calc_ut(jd, SE_SUN, CalcFlags::new().raw())?;
    println!("Sun: Lon {:.4}, Lat {:.4}", pos.longitude, pos.latitude);

    // Calculate Uranian Planet (Cupido)
    let cupido = safe::calc_ut(jd, SE_CUPIDO, CalcFlags::new().raw())?;
    println!("Cupido: Lon {:.4}", cupido.longitude);

    Ok(())
}
