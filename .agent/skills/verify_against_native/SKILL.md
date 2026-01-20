---
description: Verify WASM output matches native swetest binary at bit-level precision
---

# Verify Against Native

## Purpose

Ensure WASM calculations are **bit-level identical** to the native Swiss
Ephemeris C library by comparing output against the compiled `swetest` binary.

## Trust Model

```
┌────────────────────┐     ┌────────────────────┐
│  Native swetest    │ ═══ │   WASM SwissEph    │
│  (C binary)        │     │   (WebAssembly)    │
└────────────────────┘     └────────────────────┘
         │                           │
         └──── Must Match ───────────┘
              (1e-11 degrees)
```

## Tolerance Levels

| Calculation Type     | Tolerance     | Notes                 |
| -------------------- | ------------- | --------------------- |
| Planet positions     | 1e-11 degrees | ~0.04 milliarcseconds |
| House cusps          | 1e-11 degrees | Bit-level precision   |
| Delta-T              | 1e-6 seconds  | 1 microsecond         |
| Julian Day roundtrip | 1e-8 hours    | ~0.36 milliseconds    |
| Ayanamsa             | 1e-8 degrees  | ~0.036 arcseconds     |

## Key Files

- **Test Suite**: `tests/test_suite.ts`
- **Native swetest**: `vendor/swisseph/swetest`
- **Ephemeris Data**: `vendor/swisseph/ephe/`

## Commands

```bash
# Run full native comparison tests
deno task test

# Run swetest comparison only
deno task test:swetest
```

## Test Coverage (Current)

| Category    | Functions                                | Status      |
| ----------- | ---------------------------------------- | ----------- |
| Planets     | `swe_calc`, `swe_calc_ut`                | ✅ Verified |
| Houses      | `swe_houses`, `swe_houses_ex`            | ✅ Verified |
| Time        | `swe_julday`, `swe_revjul`, `swe_deltat` | ✅ Verified |
| Sidereal    | `swe_get_ayanamsa`, `swe_set_sid_mode`   | ✅ Verified |
| Coordinates | `swe_cotrans`, `swe_degnorm`             | ✅ Verified |
| Fixed Stars | `swe_fixstar_ut`, `swe_fixstar_mag`      | ⚠️ Partial  |

## Verification Roadmap (Needs Coverage)

| Category           | Functions                                                                      | Priority |
| ------------------ | ------------------------------------------------------------------------------ | -------- |
| **Eclipses**       | `swe_sol_eclipse_when_glob`, `swe_sol_eclipse_when_loc`, `swe_sol_eclipse_how` | High     |
| **Lunar Eclipses** | `swe_lun_eclipse_when`, `swe_lun_eclipse_how`                                  | High     |
| **Occultations**   | `swe_lun_occult_when_glob`, `swe_lun_occult_when_loc`                          | Medium   |
| **Crossings**      | `swe_solcross`, `swe_solcross_ut`, `swe_mooncross`, `swe_mooncross_ut`         | Medium   |
| **Heliacal**       | `swe_heliacal_ut`, `swe_heliacal_pheno_ut`                                     | Low      |
| **Rise/Set**       | `swe_rise_trans`, `swe_rise_trans_true_hor`                                    | Medium   |
| **Orbital**        | `swe_get_orbital_elements`, `swe_orbit_max_min_true_distance`                  | Low      |

## Verification Strategy

### For New Functions

1. **Find swetest flag**: Check `swetest --help` for command to produce output
2. **Parse output**: Create parser for swetest text format
3. **Compare at tolerance**: Use 1e-11 for positions, 1e-6 for times
4. **Add to test suite**: Include in `tests/test_suite.ts`

### String-Match Verification (Bit-Perfect)

For maximum precision, format WASM output identically to swetest:

```typescript
// If swetest outputs "293.817302741521614"
const wasmFormatted = wasmValue.toFixed(15);
assertEquals(wasmFormatted, nativeValue); // Exact string match
```

## Interpreting Results

```
Sun      | Native: 293.817... | WASM: 293.817... | Diff: 1.23e-14
```

- **Diff < 1e-11**: ✅ Bit-level parity achieved
- **Diff 1e-11 to 1e-8**: ⚠️ Investigate, may be floating-point noise
- **Diff > 1e-8**: ❌ Calculation mismatch, investigate immediately
