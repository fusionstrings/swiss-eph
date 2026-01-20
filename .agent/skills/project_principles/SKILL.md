---
description: Unbreakable principles for trust, accuracy, and precision
---

# Project Principles

## Mission

This library provides **astronomical calculations for professional use**.
Astrologers, astronomers, and researchers depend on these calculations being
**correct**.

> [!CAUTION]
> A calculation error could lead to incorrect charts, research conclusions, or
> professional advice. **Accuracy is non-negotiable.**

## Core Principles

### 1. Native Parity First

Every WASM calculation **MUST** match the native Swiss Ephemeris to **1e-11
degrees** or better. No exceptions.

```
WASM result == Native swetest result
```

**Never** ship code that reduces precision or introduces calculation
differences.

### 2. Test Before Ship

**No code changes without verification:**

- Run `deno task test` before every commit
- Run `deno task verify:golden` to catch cross-platform drift
- CI must pass before merge

### 3. Preserve Existing Tests

**Never delete or weaken tests** to make code pass. If a test fails:

1. Investigate the root cause
2. Fix the code, not the test
3. Only update test expectations if the _calculation_ was wrong before

### 4. Golden Values Are Sacred

`tests/fixtures/golden_values.ts` represents **verified correct output**. Only
regenerate with `deno task gen:golden` if:

- Swiss Ephemeris upstream changed
- A calculation bug was fixed (and verified)

**Never** regenerate just to silence failures.

### 5. Document Precision

When adding new API wrappers, document:

- Expected precision tolerance
- Test coverage added
- Comparison with native swetest

## Red Lines (Never Cross)

| Action                                         | Status       |
| ---------------------------------------------- | ------------ |
| Reduce test tolerance (e.g., 1e-11 → 1e-6)     | ❌ FORBIDDEN |
| Delete failing tests                           | ❌ FORBIDDEN |
| Commit without running tests                   | ❌ FORBIDDEN |
| Regenerate golden values without investigation | ❌ FORBIDDEN |
| Skip CI verification                           | ❌ FORBIDDEN |
| Auto-commit or Push without permission         | ❌ FORBIDDEN |

## Quality Gates

Before any release:

```bash
# All must pass
deno task verify:golden    # Cross-platform stability
deno task test             # Native parity
deno task test:node        # Node.js compatibility
deno lint                  # Code quality
```

## When in Doubt

1. **Ask** rather than assume
2. **Test more** rather than less
3. **Preserve precision** over convenience
4. **Document** any tolerance or limitation
