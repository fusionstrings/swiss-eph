# SwissEph Integration Examples (3x2x4 Matrix)

This document providing exhaustive coverage for the 24 distinct ways to
integrate SwissEph across platforms, build types, and entrypoint styles.

## Aligned 3x2x4 Integration Matrix

We support **24 distinct integration paths** based on 3 entrypoint styles, 2
build types, and 4 platforms.

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

## Technical Support Matrix

| Style                  | Build         | Deno | Node.js | Browser | Worker |
| :--------------------- | :------------ | :--: | :-----: | :-----: | :----: |
| **JS Entry point**     | **wasmbuild** |  ✅  |   ✅    |   ✅    |   ✅   |
| **JS Entry point**     | **wasi**      |  ✅  |   ✅    |   ✅    |   ✅   |
| **Direct WASM**        | **wasmbuild** |  ✅  |   ✅    |   ✅    |   ✅   |
| **Direct WASM**        | **wasi**      |  ✅  |   ✅    |   ⚠️    |   ⚠️   |
| **Inline integration** | **wasmbuild** |  ✅  |   ✅    |   ✅    |   ✅   |
| **Inline integration** | **wasi**      |  ✅  |   ✅    |   ✅    |   ✅   |

> [!NOTE]
> **Warning (⚠️)**: Direct `WebAssembly.instantiate` on the **wasi** build in
> Browser/Worker requires manual polyfilling of the `wasi_snapshot_preview1`
> import. Use the **JS Entry point** (`SwissEph` class) to handle this
> automatically. |

---

## 1. Deno Examples

### Standard API (Recommended)

```typescript
import { Constants, SwissEph } from "jsr:@fusionstrings/swiss-eph/wasi";
const wasmUrl = new URL("./swiss_eph.wasm", import.meta.url);
const eph = new SwissEph(await WebAssembly.compileStreaming(fetch(wasmUrl)));
```

### Deno-Native WASI

```typescript
import Context from "https://deno.land/std/wasi/snapshot_preview1.ts";
const wasi = new Context({ args: [], env: {}, preopens: { ".": "." } });
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: wasi.exports,
});
wasi.initialize(instance);
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
