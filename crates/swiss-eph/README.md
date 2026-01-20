# swiss-eph

Complete FFI bindings to the [Swiss Ephemeris](https://www.astro.com/swisseph/)
astronomical calculation library.

## Features

- **High Precision**: Native C performance via direct FFI.
- **WASM Support**: Compiles to WebAssembly for use in Deno, Node.js, and
  browsers.
- **Optional Data**: Optional embedding of ephemeris files via the
  `embedded-ephe` feature.

## Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
swiss-eph = "0.1"
```

## License

AGPL-3.0 (same as Swiss Ephemeris)
