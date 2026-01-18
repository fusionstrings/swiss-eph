//! Build script for swiss-eph
//!
//! Compiles the Swiss Ephemeris C library from the vendored sources.

use std::path::PathBuf;

fn main() {
    let vendor_dir = PathBuf::from("vendor/swisseph");

    let mut build = cc::Build::new();
    build
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
        .warnings(false);

    // If targeting WASM, we need the WASI sysroot for standard C headers
    let target = std::env::var("TARGET").unwrap_or_default();
    if target.contains("wasm32") {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let sysroot = format!("{}/toolchain/wasi-sdk-24.0/share/wasi-sysroot", manifest_dir);
        
        build.target("wasm32-wasi");
        build.flag(&format!("--sysroot={}", sysroot));
    }

    build.compile("swisseph");

    // Tell cargo to invalidate the built crate whenever the C sources change
    println!("cargo:rerun-if-changed=vendor/swisseph");
}
