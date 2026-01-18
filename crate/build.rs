//! Build script for swisseph-wasi
//!
//! Compiles the Swiss Ephemeris C library from the vendored sources.

use std::path::PathBuf;

fn main() {
    let vendor_dir = PathBuf::from("../vendor/swisseph");

    // Compile all Swiss Ephemeris C source files
    cc::Build::new()
        .file(vendor_dir.join("swedate.c"))
        .file(vendor_dir.join("swehouse.c"))
        .file(vendor_dir.join("swejpl.c"))
        .file(vendor_dir.join("swemmoon.c"))
        .file(vendor_dir.join("swemplan.c"))
        .file(vendor_dir.join("sweph.c"))
        .file(vendor_dir.join("swephlib.c"))
        .file(vendor_dir.join("swecl.c"))
        .file(vendor_dir.join("swehel.c"))
        .include(&vendor_dir)
        .define("NO_SWE_GLP", None)
        .opt_level(3)
        .warnings(false)
        .compile("swisseph");

    // Tell cargo to invalidate the built crate whenever the C sources change
    println!("cargo:rerun-if-changed=../vendor/swisseph");
}
