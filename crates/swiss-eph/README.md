# swiss-eph (Rust Crate)

> **Idiomatic Rust bindings for the Swiss Ephemeris.**

[![Crates.io](https://img.shields.io/crates/v/swiss-eph.svg)](https://crates.io/crates/swiss-eph)
[![Documentation](https://docs.rs/swiss-eph/badge.svg)](https://docs.rs/swiss-eph)

A high-performance, type-safe wrapper around the legendary
[Swiss Ephemeris](https://www.astro.com/swisseph/) C library. Designed for
precision astronomy and astrology applications.

## Features

- 🛡️ **Safe Rust**: High-level, idiomatic wrapper (`swisseph::safe`) around
  unsafe FFI.
- 🚀 **Zero Cost**: Most abstractions compile away to direct C calls.
- 🧪 **Verified**: Tested against the official C test suite for bit-perfect
  accuracy.
- 📦 **Self-Contained**: The C library is bundled and compiled statically. No
  external libs required.

## Installation

```toml
[dependencies]
swiss-eph = "0.1"
```

## Quick Start

### Basic Calculation (Moshier Mode)

The Moshier mode is built-in and requires no external data files. Perfect for
simple calculations.

```rust
use swisseph::safe::{self, CalcFlags, Planet};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Convert Date to Julian Day (UT)
    let year = 2024;
    let month = 1; 
    let day = 1;
    let hour = 12.0;
    
    let jd = safe::julday(year, month, day, hour);
    
    // 2. Calculate Sun Position
    // .with_moshier(): Use built-in Moshier ephemeris (default fallback)
    let flags = CalcFlags::new().with_speed().with_moshier();
    
    let sun = safe::calc(jd, Planet::Sun, flags)?;
    
    println!("Sun Longitude: {:.6}°", sun.longitude);
    println!("Sun Speed:     {:.6}°/day", sun.longitude_speed);
    
    Ok(())
}
```

### High Precision (Swiss Ephemeris Mode)

For maximum precision, you can use the embedded data crate or point to local
files.

**Option A: Embedded Data (Easiest)**

```toml
[dependencies]
swiss-eph = { version = "0.1", features = ["embedded-ephe"] }
```

```rust
use swiss_eph::safe;
use swisseph::data; // Exported via feature = "embedded-ephe"

// Register embedded files
safe::set_ephe_path_generated(data::FILES);
```

**Option B: External Files (Most Flexible)**

Download files from [astro.com](https://www.astro.com/ftp/swisseph/ephe/) and
set the path:

```rust
safe::set_ephe_path("/path/to/ephe/files");
```

## Safety

This crate contains two modules:

- `swisseph::sys`: Direct FFI bindings (unsafe). Use only if you know what you
  are doing.
- `swisseph::safe`: High-level safe wrappers (Recommended). Handles memory,
  errors, and type conversions for you.

## License

AGPL-3.0
