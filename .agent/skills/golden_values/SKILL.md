---
description: Cross-platform reproducibility via WASM-generated reference values
---

# Golden Values

## Purpose

Ensure **cross-platform reproducibility** by generating reference values using
WASM (which produces bit-identical results on all platforms) rather than
platform-specific native binaries.

## Why WASM for Golden Values?

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   macOS     │     │   Linux     │     │  Windows    │
│   native    │  ≠  │   native    │  ≠  │   native    │
└─────────────┘     └─────────────┘     └─────────────┘
     Different floating-point behavior across platforms

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WASM on    │     │  WASM on    │     │  WASM on    │
│   macOS     │  =  │   Linux     │  =  │  Windows    │
└─────────────┘     └─────────────┘     └─────────────┘
     Bit-identical results everywhere
```

Native C compilation can produce slightly different floating-point results due
to compiler optimizations and FPU differences. WASM guarantees deterministic
execution across all platforms.

## Key Files

- **Golden Values**: `tests/fixtures/golden_values.ts`
- **Verification Script**: `scripts/verify_golden.ts`
- **Generator Script**: `scripts/run_swetest_wasm.ts`
- **WASM Generator Source**: `scripts/swetest_enhanced.c`

## Commands

```bash
# Verify golden values haven't drifted
deno task verify:golden

# Regenerate golden values (if intentional change)
deno task gen:golden
```

## Workflow

### CI Verification

Every CI run executes `verify:golden` to ensure:

1. Build `swetest_enhanced.wasm` from C source
2. Run WASM generator to produce current values
3. Compare against committed `golden_values.ts`
4. Fail if any drift detected

### Updating Golden Values

Only regenerate if you've made **intentional changes** to calculations:

```bash
deno task gen:golden
git diff tests/fixtures/golden_values.ts
# Review changes carefully before committing
```

## Interpreting Failures

```
❌ Golden values have drifted!
```

This means the WASM output differs from committed values. Causes:

1. **Unintentional**: Bug introduced in calculation code
2. **Intentional**: Upgraded Swiss Ephemeris version or fixed a bug

Investigate the diff before regenerating.
