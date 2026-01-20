---
description: Performance benchmarking for WASM vs native comparison
---

# Benchmarks

## Purpose

Verify that WASM performance is acceptable and track performance across builds
to catch regressions.

## Benchmark Commands

```bash
# Run Deno benchmarks
deno task bench

# Compare WASM vs Native C
deno task bench:compare
```

## Key Benchmarks

### WASM vs Native

The primary benchmark compares:

- **WASM execution** in Deno
- **Native C** compiled with same flags

```bash
deno task bench:compare
```

Expected output:

```
WASM:   1000 iterations in 45ms (22,222 ops/sec)
Native: 1000 iterations in 12ms (83,333 ops/sec)
Ratio:  WASM is ~3.7x slower than native
```

### Acceptable Performance

| Metric             | Threshold   | Notes                    |
| ------------------ | ----------- | ------------------------ |
| WASM overhead      | <10x native | Acceptable for most uses |
| `swe_calc` latency | <1ms        | Single calculation       |
| Startup time       | <100ms      | Module instantiation     |

## Benchmark Files

```
scripts/
├── benchmark_compare.ts    # WASM vs Native comparison
├── benchmark_modes.ts      # Compare ephemeris modes
├── bench_native.c          # Native C benchmark binary
└── collect_benchmarks.ts   # Aggregate results
```

## Native Benchmark Binary

To build the native benchmark:

```bash
make bench_native
./bench_native
```

## Ephemeris Mode Benchmarks

Compare Moshier vs Swiss Ephemeris performance:

```bash
deno run -A scripts/benchmark_modes.ts
```

Expected:

- **Moshier**: Faster (no file I/O)
- **Swiss**: Slightly slower, higher precision

## Performance Regression Detection

**Red flag** if:

- WASM becomes >50% slower between versions
- Startup time exceeds 500ms
- Single calculation exceeds 10ms

## Profiling

For detailed profiling:

```bash
# Chrome DevTools profiling
deno run --inspect-brk -A scripts/benchmark_compare.ts
```

## Performance vs Precision Trade-off

> [!IMPORTANT]
> **Never sacrifice precision for performance.**
>
> If a performance optimization would reduce accuracy below 1e-11, the
> optimization is forbidden per project_principles.
