---
description: Strategy for verifying bit-level parity with native Swiss Ephemeris
---

# VerifyPrecision Skill

## Goal

Prove identical results between WASM and Native C source to `1e-14` or better
(bit-level).

## The Challenge

`swetest` output is formatted text (e.g., `printf` with precision), which
introduces rounding errors vs the raw `double` returned by WASM.

## Strategy

### 1. Bit-Level Output via `swetest`?

Check if `swetest` supports binary output or hex-float output.

- **Action**: Check `runNativeSwetest` flags.
- **Backup**: If not, accept that `1e-14` is the "I/O Noise Floor".

### 2. Verification Levels

#### Level 1: Standard High Precision

- Tolerance: `1e-11` to `1e-12`
- Method: `swetest -fPl... -n1`
- Status: **Achieved**

#### Level 2: Bit-Perfect Parity

- Method:
  1. WASM computes value `V_wasm`.
  2. We format `V_wasm` exactly like `swetest` does (e.g., `sprintf("%.15f")`).
  3. Compare strictly string-to-string.
- **Why**: This proves the underlying double generates the _exact same string
  output_, removing the float-parsing noise.

### 3. Expanded Test Coverage

Need ground truth for:

- **Eclipses**: `swe_sol_eclipse_when_glob`, `swe_lun_eclipse_when`
- **Occultations**: `swe_lun_occult_when_glob`
- **Crossings**: `swe_solcross`, `swe_mooncross`
- **Heliacal**: `swe_heliacal_ut`

## Checklist

- [ ] Implement string-matching verification helper.
- [ ] Add test cases for all missing categories above.
- [ ] Validate 1e-11 limit or string-match identity.
