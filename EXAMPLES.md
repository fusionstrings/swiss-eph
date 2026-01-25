# Integration Guide

**SwissEph** is designed to fit _your_ architecture, not the other way around.
We support a wide range of integration patterns across platforms, builds, and
styles.

## 🚀 Quick Selection Guide

| If you are using...       | Recommendation             | Example                                                                                   |
| :------------------------ | :------------------------- | :---------------------------------------------------------------------------------------- |
| **Deno / Fresh**          | `wasmbuild` + Standard API | [deno/wasmbuild_js_api_moshier.ts](./examples/deno/wasmbuild_js_api_moshier.ts)           |
| **Node.js / Bun**         | `wasi` + Standard API      | [node/wasi_js_api_moshier.mjs](./examples/node/wasi_js_api_moshier.mjs)                   |
| **Frontend (React/Vite)** | `wasmbuild` + **Inline**   | [browser/wasmbuild_inline_moshier.html](./examples/browser/wasmbuild_inline_moshier.html) |
| **Edge (Cloudflare)**     | `wasmbuild` + **Inline**   | [worker/wasmbuild_inline_moshier.ts](./examples/worker/wasmbuild_inline_moshier.ts)       |
| **High Performance**      | Direct WASM / WASI         | [node/wasi_direct_moshier.mjs](./examples/node/wasi_direct_moshier.mjs)                   |

---

## 🛠️ The Three Dimensions

### 1. Platform (Where it runs)

- **Deno**: First-class support with native TS.
- **Node.js**: Full support via ESM.
- **Browser**: Works in all modern browsers (Chrome, Firefox, Safari).
- **Workers**: Optimized for Cloudflare Workers / V8 Edge runtimes.

### 2. Build Type (How it's compiled)

- **`wasmbuild` (Recommended)**: Uses a high-level Rust wrapper. Provides the
  safest, most idiomatic JavaScript API.
- **`wasi` (Direct)**: Direct binding to the C library via the WebAssembly
  System Interface. Best for maximum control and raw C-tier performance.

### 3. Style (How it's loaded)

- **Standard API**: Loads the WASM binary from an external file (default).
- **Inline (Zero-Config)**: The WASM binary is embedded in the JS source.
  **Ideal for bundlers** and environments where file requests are restricted.
- **Direct**: Manual instantiation for advanced users.

---

## 🗺️ Integration Matrix

We verify every permutation to ensure reliability. For a detailed breakdown
including all entrypoints and benchmarks, see the
**[Full Verification Matrix](./MATRIX.md)**.

| Category               |           Deno           |           Node           |           Browser           |           Worker           |
| :--------------------- | :----------------------: | :----------------------: | :-------------------------: | :------------------------: |
| **wasmbuild (JS API)** | [Link](./examples/deno/) | [Link](./examples/node/) | [Link](./examples/browser/) | [Link](./examples/worker/) |
| **wasmbuild (Inline)** | [Link](./examples/deno/) | [Link](./examples/node/) | [Link](./examples/browser/) | [Link](./examples/worker/) |
| **wasi (JS API)**      | [Link](./examples/deno/) | [Link](./examples/node/) | [Link](./examples/browser/) | [Link](./examples/worker/) |
| **wasi (Direct)**      | [Link](./examples/deno/) | [Link](./examples/node/) | [Link](./examples/browser/) | [Link](./examples/worker/) |

> [!TIP]
> **Which Ephemeris Mode should I use?**
>
> - **Moshier**: Built-in (no extra files). Accuracy ~1 arcsec. Use for general
>   purpose.
> - **Swiss**: External `.se1` files. Accuracy ~0.001 arcsec. Use for
>   professional work.
> - **JPL**: External NASA files. Highest precision.

---

## ⚡ Performance Breakdown

| Strategy         | Deno (ops/s) | Node (ops/s) | Note                    |
| :--------------- | :----------: | :----------: | :---------------------- |
| **Direct WASM**  |    ~5.8M     |  **~6.2M**   | Theoretical Maximum     |
| **Standard API** |    ~540k     |     ~1M      | Idiomatic / Recommended |
| **Inline Build** |    ~500k     |    ~950k     | Best for Bundlers       |
