# swiss-eph-data

> **Embedded High-Precision Ephemeris Data.**

This crate provides the core Swiss Ephemeris data files (`sepl_18.se1` and
`semo_18.se1`) embedded directly into your Rust binary.

## Why use this?

- **Zero Configuration**: No need to manage external files or paths.
- **Portability**: Your binary works anywhere, even in environments without a
  filesystem (like WASM or simple scratch containers).
- **Precision**: Enables the full precision of the Swiss Ephemeris (vs. the
  Moshier fallback).

## Trade-off

⚠️ **Binary Size**: This crate adds approximately **1.7 MB** to your compiled
binary.

## Content

| File          | Type                | Range             |
| ------------- | ------------------- | ----------------- |
| `sepl_18.se1` | Planetary Positions | 1800 CE - 2399 CE |
| `semo_18.se1` | Moon Positions      | 1800 CE - 2399 CE |

## Usage

The recommended way to use this data is via the `embedded-ephe` feature of the
main crate:

```toml
[dependencies]
swiss-eph = { version = "0.1", features = ["embedded-ephe"] }
```

Then in your code:

```rust
use swisseph::safe;
use swiss_eph::data::{SEPL_18, SEMO_18};

fn main() {
    // Load the embedded data into the Swiss Ephemeris context
    safe::set_ephe_path_generated(&[SEPL_18, SEMO_18]);
}
```

## License

AGPL-3.0 (Data courtesy of Astrodienst AG)
