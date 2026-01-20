---
description: WASI SDK toolchain setup and WASM compilation
---

# Build WASM

## Purpose

Document the trusted build chain from C source to WebAssembly, ensuring
reproducible and verifiable WASM artifacts.

## Toolchain

| Component | Version         | Purpose                       |
| --------- | --------------- | ----------------------------- |
| WASI SDK  | 24.0            | C → WASM cross-compiler       |
| Clang     | (from WASI SDK) | C compiler                    |
| wasmbuild | 0.21.0          | Rust → WASM with wasm-bindgen |

## Build Outputs

| Output           | Path                           | Description           |
| ---------------- | ------------------------------ | --------------------- |
| WASI WASM        | `lib/wasi/swiss_eph.wasm`      | Pure WASI, no JS glue |
| wasmbuild        | `lib/wasm/swiss_eph.js`        | Rust+wasm-bindgen     |
| wasmbuild inline | `lib/wasm-inline/swiss_eph.js` | Base64-embedded WASM  |

## Commands

```bash
# Setup toolchain (downloads WASI SDK)
deno task setup

# Build WASI WASM (via Makefile)
deno task build:wasm

# Build wasmbuild artifacts (Rust)
deno task build:wasmbuild
deno task build:wasmbuild:inline
```

## Source Files

```
vendor/swisseph/
├── swedate.c      # Julian Day calculations
├── swehouse.c     # House systems
├── swejpl.c       # JPL ephemeris reader
├── swemmoon.c     # Moon calculations
├── swemplan.c     # Planet calculations
├── sweph.c        # Main ephemeris engine
├── swephlib.c     # Math utilities
├── swecl.c        # Eclipse calculations
├── swehel.c       # Heliacal phenomena
└── ephe/          # Ephemeris data files
```

## Build Flags

From `Makefile`:

```makefile
CFLAGS = -O3 -flto -g0 -mexec-model=reactor -Wall -Wextra \
         --sysroot=$(SYSROOT) -DNO_SWE_GLP
LDFLAGS = -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined
```

- `-O3 -flto`: Maximum optimization with link-time optimization
- `-mexec-model=reactor`: Library mode (no main function)
- `-DNO_SWE_GLP`: Disable unused features
- `--export-all`: Export all functions for FFI

## Verifying Build

After building, verify the WASM is functional:

```bash
deno task test
```
