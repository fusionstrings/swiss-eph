# swisseph-wasi

Complete FFI bindings to the [Swiss Ephemeris](https://www.astro.com/swisseph/)
astronomical calculation library.

## Features

- **Complete API coverage**: All 100+ functions from the Swiss Ephemeris C
  library
- **All constants**: Planets, flags, ayanamsas, house systems, eclipse types,
  etc.
- **Native performance**: Direct C bindings, no runtime overhead

## Usage

```rust
use swisseph_wasi::*;

fn main() {
    unsafe {
        // Calculate Julian Day for J2000.0
        let jd = swe_julday(2000, 1, 1, 12.0, SE_GREG_CAL);
        println!("J2000.0 = {}", jd);  // 2451545.0

        // Calculate Sun position
        let mut xx = [0.0f64; 6];
        let mut serr = [0i8; 256];
        let iflag = SEFLG_SPEED;
        
        swe_calc_ut(jd, SE_SUN, iflag, xx.as_mut_ptr(), serr.as_mut_ptr());
        println!("Sun longitude: {}°", xx[0]);
        
        // Clean up
        swe_close();
    }
}
```

## Ephemeris Files

For high-precision calculations, download ephemeris files from
[astro.com](https://www.astro.com/ftp/swisseph/ephe/) and set the path:

```rust
use std::ffi::CString;

unsafe {
    let path = CString::new("/path/to/ephe").unwrap();
    swe_set_ephe_path(path.as_ptr());
}
```

## License

AGPL-3.0 (inherited from Swiss Ephemeris)

The Swiss Ephemeris is dual-licensed. See
[astro.com/swisseph](https://www.astro.com/swisseph/) for commercial licensing
options.
