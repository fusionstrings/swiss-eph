---
description: Platform and mode compatibility matrix for all supported environments
---

# Platform Matrix

## Purpose

Document all supported **platforms**, **build modes**, and **ephemeris modes**
to ensure comprehensive testing and compatibility.

## Platform Support

| Platform               | Runtime                 | Status          | Test Command                |
| ---------------------- | ----------------------- | --------------- | --------------------------- |
| **Deno**               | Deno 2.x                | ✅ Primary      | `deno task test`            |
| **Node.js**            | Node 18+                | ✅ Supported    | `deno task test:node`       |
| **Browser**            | Chrome, Firefox, Safari | ✅ Supported    | `deno task test:browser`    |
| **Cloudflare Workers** | Workerd                 | ⚠️ Experimental | `deno task test:cloudflare` |

## Build Modes

| Mode                 | Output Path        | Description                | Use Case            |
| -------------------- | ------------------ | -------------------------- | ------------------- |
| **WASI (make)**      | `lib/wasi/`        | Pure C → WASM via WASI SDK | Custom WASI runtime |
| **wasmbuild**        | `lib/wasm/`        | Rust + wasm-bindgen        | Standard JS API     |
| **wasmbuild inline** | `lib/wasm-inline/` | Base64-embedded WASM       | Single-file deploy  |

## Ephemeris Modes

| Mode        | Flag | Data Required | Precision     | Use Case            |
| ----------- | ---- | ------------- | ------------- | ------------------- |
| **MOSHIER** | `4`  | None          | ~1 arcsec     | Offline/lightweight |
| **SWISS**   | `2`  | `.se1` files  | ~0.001 arcsec | Standard precision  |
| **JPL**     | `1`  | `.jpl` files  | Highest       | Research-grade      |

## Example Matrix

Examples exist for all combinations of:

- **Platform**: `deno/`, `node/`, `browser/`, `worker/`
- **Build**: `wasi_`, `wasmbuild_`
- **Loading**: `direct_wasm_`, `inline_`, `js_api_`
- **Ephemeris**: `moshier`, `swiss`, `jpl`

**Naming pattern**: `{build}_{loading}_{ephemeris}.ts`

```
examples/
├── deno/
│   ├── wasi_direct_wasm_moshier.ts
│   ├── wasi_inline_swiss.ts
│   ├── wasmbuild_js_api_jpl.ts
│   └── ... (18 total)
├── browser/
│   └── ... (18 total)
├── node/
│   └── ... (18 total)
└── worker/
    └── ... (18 total)
```

## Package Exports

From `deno.json`:

| Export          | Path                           | Description               |
| --------------- | ------------------------------ | ------------------------- |
| `.`             | `lib/wasm/swiss_eph.js`        | Default (wasmbuild)       |
| `./wasi`        | `src/main.ts`                  | WASI-based SwissEph class |
| `./wasi-loader` | `src/loader.ts`                | WASI loader utility       |
| `./wasm`        | `lib/wasm/swiss_eph.wasm`      | Raw WASM binary           |
| `./inline`      | `lib/wasm-inline/swiss_eph.js` | Inline WASM bundle        |

## Dual Publishing

| Registry      | Package                    | Command         |
| ------------- | -------------------------- | --------------- |
| **JSR**       | `@fusionstrings/swiss-eph` | `deno publish`  |
| **crates.io** | `swiss-eph`                | `cargo publish` |

## CI Matrix

The CI workflow tests:

1. Deno tests (primary)
2. Node.js E2E
3. Rust crate build
4. Golden value verification

## Adding Platform Support

When adding a new platform:

1. Create examples in `examples/{platform}/`
2. Add E2E test in `tests/e2e/{platform}/`
3. Update this matrix
4. Add CI job if needed
