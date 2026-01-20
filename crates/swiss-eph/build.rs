//! Build script for swiss-eph
//!
//! Compiles the Swiss Ephemeris C library from the vendored sources.

use std::path::PathBuf;

fn main() {
    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    
    // Check for vendor sources in crate directory first (for cargo publish),
    // then fall back to repo root (for local development)
    let vendor_dir = manifest_dir.join("vendor/swisseph");
    
    if !vendor_dir.exists() {
        panic!(
            "Swiss Ephemeris vendor sources not found at {:?}.\n\
             The submodule should be located at crates/swiss-eph/vendor/swisseph",
            vendor_dir
        );
    }
    
    println!("cargo:warning=Using vendor sources from: {:?}", vendor_dir);

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

    // If targeting WASM, we need the WASI SDK (compiler + sysroot) for C compilation
    let target = std::env::var("TARGET").unwrap_or_default();
    if target.contains("wasm32") {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        
        // Try to find WASI SDK in order of preference:
        // 1. WASI_SDK_PATH environment variable
        // 2. Common system installation paths
        // 3. Local toolchain directory
        let sdk_path = std::env::var("WASI_SDK_PATH").ok()
            .or_else(|| {
                let candidates = [
                    "/opt/wasi-sdk",
                    "/usr/local/opt/wasi-sdk",
                    "/opt/homebrew/opt/wasi-sdk",
                ];
                candidates.iter()
                    .find(|p| std::path::Path::new(*p).join("bin/clang").exists())
                    .map(|s| s.to_string())
            })
            .unwrap_or_else(|| {
                format!("{}/../../toolchain/wasi-sdk-24.0", manifest_dir)
            });
        
        let sysroot = format!("{}/share/wasi-sysroot", sdk_path);
        let clang = format!("{}/bin/clang", sdk_path);
        
        println!("cargo:warning=Using WASI SDK: {}", sdk_path);
        println!("cargo:warning=Using WASI clang: {}", clang);
        
        // Set the compiler to WASI SDK's clang
        build.compiler(&clang);
        build.target("wasm32-wasi");
        build.flag(&format!("--sysroot={}", sysroot));
    }

    // If targeting wasm32-unknown-unknown (browser/standalone), we need to stub libc symbols
    // that the C code expects but aren't provided by the browser environment.
    if target.contains("wasm32-unknown-unknown") {
         println!("cargo:warning=Targeting wasm32-unknown-unknown: Including stubs.c");
         build.file("src/stubs.c");
         // We might need to ensure -fno-builtin to avoid compiler optimizing calls to intrinsics
         build.flag("-fno-builtin"); 
    }

    build.compile("swisseph");

    // Tell cargo to invalidate the built crate whenever the C sources change
    println!("cargo:rerun-if-changed={}", vendor_dir.display());
}
