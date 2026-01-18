# swiss-eph-data

Embedded ephemeris data files for
[swiss-eph](https://crates.io/crates/swiss-eph).

## Included Files

| File          | Description         | Coverage     |
| ------------- | ------------------- | ------------ |
| `sepl_18.se1` | Planetary positions | 1800-2400 CE |
| `semo_18.se1` | Lunar positions     | 1800-2400 CE |

## Usage

Add as a dependency to your `Cargo.toml`:

```toml
[dependencies]
swiss-eph = "0.1"
swiss-eph-data = "0.1"
```

Then in your code:

```rust
use swiss_eph_data;

fn main() {
    // Get the embedded ephemeris data
    let planet_data = swiss_eph_data::SEPL_18;
    let moon_data = swiss_eph_data::SEMO_18;
    
    // Use with swiss-eph's virtual filesystem or write to disk
}
```

## Size

This crate adds approximately **1.7 MB** to your binary.

## License

AGPL-3.0 (same as Swiss Ephemeris)
