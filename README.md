# @fusionstrings/swiss-eph

Swiss Ephemeris astronomical calculation library compiled to WebAssembly for
cross-platform JavaScript/TypeScript usage, with idiomatic Rust bindings.

[![crates.io](https://img.shields.io/crates/v/swiss-eph.svg)](https://crates.io/crates/swiss-eph)
[![docs.rs](https://docs.rs/swiss-eph/badge.svg)](https://docs.rs/swiss-eph)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

## Features

- **Cross-platform**: Works in Deno, Node.js, browsers, and edge runtimes
  (Cloudflare Workers)
- **Rust Bindings**: Complete FFI and safe Rust API for native performance
- **High precision**: Bit-level accuracy matching native Swiss Ephemeris
  calculations
- **Complete API**: 95+ functions for planetary positions, houses, eclipses, and
  more
- **Zero dependencies**: Self-contained WASM module with built-in Moshier
  ephemeris
- **TypeScript**: Full type definitions with TSDoc documentation

## Installation (JS/TS)

### Deno / JSR

```typescript
import { load } from "jsr:@fusionstrings/swiss-eph";
```

### Node.js / npm

```bash
npm install @fusionstrings/swiss-eph
```

```typescript
import { load } from "@fusionstrings/swiss-eph";
```

## Quick Start (JS/TS)

```typescript
import { Constants, load } from "@fusionstrings/swiss-eph";

// Initialize the Swiss Ephemeris
const eph = await load();

// Calculate Julian Day for a date
const jd = eph.swe_julday(2024, 6, 15, 12.0, Constants.SE_GREG_CAL);

// Get Sun's position
const { xx, error } = eph.swe_calc_ut(
  jd,
  Constants.SE_SUN,
  Constants.SEFLG_SPEED,
);
console.log(`Sun longitude: ${xx[0]}°`);
```

## Rust Usage

Add this to your `Cargo.toml`:

```toml
[dependencies]
swiss-eph = "0.1.0"
```

### Quick Start (Rust)

```rust
use swisseph_x::safe::*;
use swisseph_x::*;

fn main() {
    let jd = julday(2024, 1, 1, 12.0);
    let flags = CalcFlags::new().with_speed();
    let sun = calc(jd, SE_SUN, flags).unwrap();
    println!("Sun longitude: {:.6}°", sun.longitude);
}
```

## API Overview (JS/TS)

| Function                       | Description                 |
| ------------------------------ | --------------------------- |
| `swe_calc` / `swe_calc_ut`     | Planetary positions (TT/UT) |
| `swe_houses` / `swe_houses_ex` | House cusps and angles      |
| `swe_julday` / `swe_revjul`    | Julian Day conversions      |
| `swe_sidtime`                  | Sidereal time               |
| `swe_deltat`                   | Delta T (TT - UT)           |

## License

**AGPL-3.0** - Same license as the Swiss Ephemeris library.

This software is based on the Swiss Ephemeris by Astrodienst AG. See
https://www.astro.com/swisseph/ for more information.

## Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG
- WASM compilation using WASI SDK and wasmbuild
