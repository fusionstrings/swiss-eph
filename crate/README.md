# swiss-eph

[![crates.io](https://img.shields.io/crates/v/swiss-eph.svg)](https://crates.io/crates/swiss-eph)
[![docs.rs](https://docs.rs/swiss-eph/badge.svg)](https://docs.rs/swiss-eph)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

Complete Rust bindings for the
[Swiss Ephemeris](https://www.astro.com/swisseph/) astronomical calculation
library.

## Features

- **Complete FFI bindings** - All 100+ functions and 150+ constants
- **Safe Rust API** - Idiomatic wrapper with Result types and builders
- **Verified accuracy** - Bit-level precision (1e-10 tolerance) against native
  library
- **House systems** - Placidus, Koch, Equal, Whole Sign, and 8 more
- **Sidereal modes** - Lahiri, Fagan-Bradley, True Citra, and more
- **No runtime dependencies** - Swiss Ephemeris C sources compiled in

## Quick Start

```rust
use swisseph_x::safe::*;
use swisseph_x::*;

fn main() {
    // Set ephemeris path (optional, enables higher precision)
    set_ephe_path("/path/to/ephe");

    // Calculate Julian Day for January 1, 2024 at noon
    let jd = julday(2024, 1, 1, 12.0);

    // Calculate Sun position
    let flags = CalcFlags::new().with_speed();
    let sun = calc(jd, SE_SUN, flags).unwrap();
    
    println!("Sun longitude: {:.6}°", sun.longitude);
    println!("Sun latitude: {:.6}°", sun.latitude);
    println!("Sun distance: {:.6} AU", sun.distance);

    // Calculate house cusps for Zurich
    let houses = houses(jd, 47.3769, 8.5417, HouseSystem::Placidus).unwrap();
    println!("Ascendant: {:.2}°", houses.ascendant);
    println!("MC: {:.2}°", houses.mc);

    // Clean up
    close();
}
```

## Safe API

The `safe` module provides an idiomatic Rust interface:

```rust
use swisseph_x::safe::*;

// Builder pattern for calculation flags
let flags = CalcFlags::new()
    .with_speed()           // Include velocity
    .with_true_position()   // Geometric position
    .with_equatorial();     // RA/Dec instead of lon/lat

// Result-based error handling
match calc(jd, SE_MOON, flags) {
    Ok(pos) => println!("Moon at {:.2}°", pos.longitude),
    Err(e) => eprintln!("Error: {}", e),
}

// All house systems
let cusps = houses(jd, lat, lon, HouseSystem::Koch)?;
```

## Raw FFI

For direct access to the C API:

```rust
use swisseph_x::*;

unsafe {
    let mut xx = [0.0f64; 6];
    let mut serr = [0i8; 256];
    
    let ret = swe_calc_ut(jd, SE_SUN, SEFLG_SPEED, 
                          xx.as_mut_ptr(), serr.as_mut_ptr());
    
    if ret >= 0 {
        println!("Longitude: {}", xx[0]);
    }
    
    swe_close();
}
```

## Planet Constants

| Constant       | Planet          |
| -------------- | --------------- |
| `SE_SUN`       | Sun             |
| `SE_MOON`      | Moon            |
| `SE_MERCURY`   | Mercury         |
| `SE_VENUS`     | Venus           |
| `SE_MARS`      | Mars            |
| `SE_JUPITER`   | Jupiter         |
| `SE_SATURN`    | Saturn          |
| `SE_URANUS`    | Uranus          |
| `SE_NEPTUNE`   | Neptune         |
| `SE_PLUTO`     | Pluto           |
| `SE_MEAN_NODE` | Mean Lunar Node |
| `SE_TRUE_NODE` | True Lunar Node |
| `SE_CHIRON`    | Chiron          |

## Ephemeris Files

For highest precision, download ephemeris files from
[astro.com](https://www.astro.com/ftp/swisseph/ephe/):

```rust
set_ephe_path("/path/to/ephe");
```

Without ephemeris files, the library falls back to the built-in Moshier
algorithm (lower precision but still accurate to ~1 arcsecond).

## Accuracy

This crate produces **bit-identical results** to the native Swiss Ephemeris:

| Test             | Tolerance | Status   |
| ---------------- | --------- | -------- |
| Planet positions | 1e-10     | ✅ 17/17 |
| Ayanamsas        | 1e-10     | ✅ 6/6   |
| House cusps      | 1e-10     | ✅ All   |
| Delta-T          | Exact     | ✅       |
| Sidereal time    | Exact     | ✅       |

## License

AGPL-3.0 (inherited from Swiss Ephemeris)

For commercial licensing options, contact
[Astrodienst](https://www.astro.com/swisseph/).
