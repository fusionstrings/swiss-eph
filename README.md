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
import { Constants, SwissEph } from "jsr:@fusionstrings/swiss-eph/wasi";
```

### Node.js (via JSR)

```bash
npx jsr add @fusionstrings/swiss-eph
```

```typescript
import { Constants, SwissEph } from "@fusionstrings/swiss-eph/wasi";
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

## Ephemeris Data

Swiss Ephemeris supports three modes of operation:

### 1. Moshier Mode (Default, No Files Needed)

Works out of the box with ~1 arcsecond precision:

```rust
// Just use the library - falls back to Moshier automatically
let sun = safe::calc_ut(jd, SE_SUN, flags)?;
```

### 2. Embedded Data (Optional Feature)

Add ~1.7 MB of embedded ephemeris for higher precision (1800-2400 CE):

```toml
[dependencies]
swiss-eph = { version = "0.1", features = ["embedded-ephe"] }
```

### 3. Manual Download (Full Control)

Download ephemeris files from
[astro.com](https://www.astro.com/ftp/swisseph/ephe/):

```bash
curl -O https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1
curl -O https://www.astro.com/ftp/swisseph/ephe/semo_18.se1
```

Then configure:

```rust
safe::set_ephe_path("/path/to/ephe/files");
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
