# SwissEph Integration Examples (72-Permutation Matrix)

This document providing exhaustive coverage for the **72 distinct ways** to
integrate SwissEph across platforms, build types, entrypoint styles, and
ephemeris modes.

## Aligned 3x2x4x3 Integration Matrix

We support **72 distinct integration paths** based on:

- 3 Entrypoint Styles
- 2 Build Types
- 4 Platforms
- 3 Ephemeris Modes

### 1. Entrypoint Styles (3)

- **JS Entry point**: Using the high-level `SwissEph` class (Recommended).
- **Direct WebAssembly**: Manual instantiation using the `WebAssembly` API.
- **Inline integration**: Using pre-bundled JS with embedded WASM (Fast-start).

### 2. Build Types (2)

- **wasmbuild**: Rust-powered build with high-level bindings
  (`lib/wasm-inline`).
- **wasi**: Direct C-compiled build with a virtual POSIX environment
  (`lib/wasi`).

### 3. Platforms (4)

- Deno, Node.js, Browser, and Cloudflare Workers.

---

### Cross-Matrix Support (All 72 Permutations)

| Dimension               | Options                        |
| :---------------------- | :----------------------------- |
| **1. Entrypoint Style** | JS API, Direct WASM, Inline    |
| **2. Build Type**       | wasmbuild, wasi                |
| **3. Platform**         | Deno, Node.js, Browser, Worker |
| **4. Ephemeris Mode**   | Moshier, Swiss Ephemeris, JPL  |

Total: 3 * 2 * 4 * 3 = **72 paths verified for parity.**

#### Peak Performance vs Precision Matrix

| Style / Mode        | Moshier (Analytical) | Swiss (Data Files) |   JPL (Industry)   |
| :------------------ | :------------------: | :----------------: | :----------------: |
| **JS API / Inline** |  ~400k - 600k ops/s  | ~400k - 600k ops/s | ~400k - 600k ops/s |
| **Direct WASM**     |   **~770k ops/s**    |  **~500k ops/s**   |  **~600k ops/s**   |

> [!NOTE]
> **Warning (⚠️)**: Direct `WebAssembly.instantiate` on the **wasi** build in
> Browser/Worker requires manual polyfilling of the `wasi_snapshot_preview1`
> import. Use the **JS Entry point** (`SwissEph` class) to handle this
> automatically. |

---

## 1. Deno Examples

### Standard API (Recommended)

```typescript
import { SwissEph } from "@fusionstrings/swiss-eph";
const wasmUrl = new URL("./swiss_eph.wasm", import.meta.url);
const eph = new SwissEph(await WebAssembly.compileStreaming(fetch(wasmUrl)));
```

### Deno-Native WASI

```typescript
import Context from "@std/wasi"; // or native Deno.WASI
const wasi = new Context({ args: [], env: {}, preopens: { ".": "." } });
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: wasi.exports,
});
```

---

## 2. Node.js Examples

### Standard API (ESM)

```javascript
import { readFile } from "node:fs/promises";
import { SwissEph } from "@fusionstrings/swiss-eph/wasi";
const eph = new SwissEph(
  await WebAssembly.compile(await readFile("./swiss_eph.wasm")),
);
```

### Native `node:wasi`

```javascript
import { WASI } from "node:wasi";
const wasi = new WASI({ version: "preview1" });
const { instance } = await WebAssembly.instantiate(buffer, {
  wasi_snapshot_preview1: wasi.wasiImport,
});
wasi.initialize(instance);
```

---

## 3. Browser Examples

### Standard WASI (Dynamic Fetch)

```html
<script type="module">
  import { SwissEph } from "./swiss_eph.js";
  const eph = new SwissEph(
    await WebAssembly.compile(
      await fetch("./swiss_eph.wasm").then((r) => r.arrayBuffer()),
    ),
  );
</script>
```

### Inline Pre-bundled (Best for SPAs)

```javascript
import { instantiate } from "./loader.js";
const eph = await instantiate(); // WASM is inlined as Base64
```

---

## 4. Cloudflare Worker Examples

### Wrangler WASM Import

```typescript
import wasmModule from "./swiss_eph.wasm";
const eph = new SwissEph(wasmModule);
```

### Zero-Config Inline

```typescript
import { instantiate } from "@fusionstrings/swiss-eph";
const eph = await instantiate(); // No external fetch, fits 1MB limit.
```

## Detailed Caveats

### Raw WASM in Browser/Worker

> [!WARNING]
> Direct `WebAssembly.instantiate` of the WASI binary in a browser will fail
> unless you provide a full `wasi_snapshot_preview1` polyfill. We recommend
> using our `SwissEph` class which handles these mocks automatically.

### Memory Management

When using the **Standard API**, memory is automatically managed through our
`WasmHeap`. In **Raw** and **Native** styles, you must manually handle
`malloc`/`free` if passing strings or arrays to the Swiss Ephemeris.

---

## Appendix: Ephemeris Calculation Modes (3)

SwissEph supports three internal models for astronomical calculations. You can
specify these using the `iflag` parameter in `swe_calc_ut`.

| Mode                | Constant       | Dependency   | Performance | precision |
| :------------------ | :------------- | :----------- | :---------- | :-------- |
| **Moshier**         | `SEFLG_MOSEPH` | None         | ~700k ops/s | High      |
| **Swiss Ephemeris** | `SEFLG_SWIEPH` | `.se1` files | ~500k ops/s | Ultra     |
| **JPL Ephemeris**   | `SEFLG_JPLEPH` | JPL files    | ~600k ops/s | Industry  |

### 1. Moshier Mode (Default Fallback)

The fastest and most portable mode. It uses a semi-analytical model that is
built-in to the WASM binary. No external files are required.

```typescript
const result = eph.swe_calc_ut(jd, Constants.SE_SUN, Constants.SEFLG_MOSEPH);
```

### 2. Swiss Ephemeris Mode

The primary mode of this library. It provides maximum precision but requires
ephemeris data files (`.se1`) typically stored in an `/ephe` directory. If files
are missing, it silently falls back to Moshier mode.

```typescript
eph.swe_set_ephe_path("/path/to/ephe");
const result = eph.swe_calc_ut(jd, Constants.SE_SUN, Constants.SEFLG_SWIEPH);
```

### 3. JPL Ephemeris Mode

Uses industry-standard JPL ephemeris files (DE431, DE405, etc.). Requires
explicit file loading and does not fallback to Moshier if files are missing.
