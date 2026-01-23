# Integration Guide

**SwissEph** is designed to fit _your_ architecture, not the other way around.
We support **24 distinct integration patterns** across platforms, builds, and
styles.

## The Matrix: Choose Your Path

All examples are runnable and located in the [examples/](./examples/) directory.

### 1. Select Your Platform

| Platform    | Best For                        | Recommended Example                     |
| :---------- | :------------------------------ | :-------------------------------------- |
| **Deno**    | Modern Server-side, Scripting   | `deno/wasmbuild_js_api_moshier.ts`      |
| **Node.js** | Traditional Server-side, Lambda | `node/wasmbuild_js_api_moshier.mjs`     |
| **Browser** | Client-side Apps (React/Vue)    | `browser/wasmbuild_inline_moshier.html` |
| **Workers** | Edge Computing (Cloudflare)     | `worker/wasmbuild_inline_moshier.ts`    |

### 2. Select Your Build Type

- **`wasmbuild` (Recommended)**: Uses our high-level Rust wrapper. Safer,
  idiomatic JS API, better error handling.
- **`wasi` (Advanced)**: Direct binding to the C library via WASI. Lower level,
  requires WASI polyfill in browsers.

### 3. Select Your Style

- **JS API (Standard)**: `new SwissEph(...)`. The standard way. Use this 99% of
  the time.
- **Inline (Zero-Config)**: The WASM binary is embedded as a Base64 string in
  the JS file. perfect for bundlers (Vite/Webpack) or single-file scripts. No
  `fetch` required.
- **Direct WASM**: For those who want full control over the
  `WebAssembly.instantiate` process.

---

## Full 72-Path Verified Matrix

We test every combination to ensure bulletproof reliability.

| #         | Platform    | Build  | Style | Mode  | File Ref                                     |
| --------- | ----------- | ------ | ----- | ----- | -------------------------------------------- |
| **1-18**  | **Deno**    | _Both_ | _All_ | _All_ | [View Deno Examples](./examples/deno/)       |
| **19-36** | **Node**    | _Both_ | _All_ | _All_ | [View Node Examples](./examples/node/)       |
| **37-54** | **Browser** | _Both_ | _All_ | _All_ | [View Browser Examples](./examples/browser/) |
| **55-72** | **Worker**  | _Both_ | _All_ | _All_ | [View Worker Examples](./examples/worker/)   |

> **Note**: "Mode" refers to the ephemeris data source:
>
> 1. **Moshier**: Built-in semi-analytic model. Fast, no external files. (~
>    arcsec accuracy)
> 2. **Swiss**: Uses `.se1` files. The gold standard. (~ milli-arcsec accuracy)
> 3. **JPL**: Uses DE431 etc. NASA standard.

## Performance & Benchmarks

| Build Strategy      | Deno (ops/s) | Node (ops/s) |
| :------------------ | :----------: | :----------: |
| **WASM (Direct)**   |  5,822,979   |  6,268,448   |
| **WASM (Standard)** |   542,055    |   997,788    |
| **WASI (Standard)** |   573,797    |  1,244,097   |

> _Tip: For raw speed, use Node.js with Direct WASM instantiation. For developer
> experience, use Deno with the Standard API._
