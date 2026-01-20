---
description: Example files demonstrating all platform/mode combinations
---

# Examples

## Purpose

Maintain working examples for **every combination** of platform, build mode, and
ephemeris mode to ensure comprehensive compatibility.

## Example Matrix (72 total)

```
                    ┌─────────────────────────────────────────┐
                    │           LOADING METHOD                │
                    ├─────────────┬─────────────┬─────────────┤
                    │ direct_wasm │   inline    │   js_api    │
┌───────┬───────────┼─────────────┼─────────────┼─────────────┤
│       │  moshier  │     ✓       │      ✓      │      ✓      │
│ wasi  │  swiss    │     ✓       │      ✓      │      ✓      │
│       │  jpl      │     ✓       │      ✓      │      ✓      │
├───────┼───────────┼─────────────┼─────────────┼─────────────┤
│       │  moshier  │     ✓       │      ✓      │      ✓      │
│wasm-  │  swiss    │     ✓       │      ✓      │      ✓      │
│build  │  jpl      │     ✓       │      ✓      │      ✓      │
└───────┴───────────┴─────────────┴─────────────┴─────────────┘
           × 4 platforms (deno, node, browser, worker) = 72 examples
```

## File Naming Convention

`{build}_{loading}_{ephemeris}.{ext}`

- **build**: `wasi_` or `wasmbuild_`
- **loading**: `direct_wasm_`, `inline_`, `js_api_`
- **ephemeris**: `moshier`, `swiss`, `jpl`
- **ext**: `.ts` (Deno/Node), `.html` (Browser), `.ts` (Worker)

## Loading Methods

### 1. Direct WASM (`direct_wasm_`)

Load raw WASM, manually manage exports:

```typescript
const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));
const instance = await WebAssembly.instantiate(wasmModule, imports);
const exports = instance.exports as WasmExports;
```

**Use case**: Maximum control, custom WASI implementation

### 2. Inline (`inline_`)

WASM embedded as base64 in JS:

```typescript
import { instantiate } from "../../lib/wasm-inline/swiss_eph.js";
const eph = await instantiate();
```

**Use case**: Single-file deployment, no fetch needed

### 3. JS API (`js_api_`)

Use high-level wrapper API:

```typescript
import { load } from "../../src/main.ts";
const eph = await load({ ephePath: EPHE_PATH });
```

**Use case**: Default recommended approach

## Ephemeris Modes

### MOSHIER (flag: 4)

```typescript
const CALC_FLAG = 4;  // No data files needed
eph.swe_calc_ut(jd, SE_SUN, CALC_FLAG, ...);
```

### SWISS (flag: 2)

```typescript
const CALC_FLAG = 2;
eph.set_ephe_path("./vendor/swisseph/ephe");  // Requires .se1 files
eph.swe_calc_ut(jd, SE_SUN, CALC_FLAG, ...);
```

### JPL (flag: 1)

```typescript
const CALC_FLAG = 1; // Requires JPL ephemeris files
```

## Generating Examples

Examples are generated programmatically:

```bash
deno run -A scripts/generate_examples.ts
```

This creates all 72 examples from templates.

## Verifying Examples

```bash
# Run example parity tests
deno test tests/examples_parity.test.ts
```

## Shared Logic

Common calculation logic is in:

```
examples/shared/logic.ts
```

Examples import this to ensure consistent calculations across platforms.

## Adding a New Platform

1. Create directory: `examples/{platform}/`
2. Add 18 example files (all combinations)
3. Or run: `deno run -A scripts/generate_examples.ts`
4. Add E2E test in `tests/e2e/{platform}/`
