---
description: Complete test execution workflow across all platforms
---

# Run Tests

## Purpose

Execute the full test suite to verify correctness across Deno, Node.js, Browser,
and Rust environments.

## Quick Reference

```bash
# Run all primary tests
deno task test

# Run everything including Node.js
deno task test:all
```

## Test Commands

| Command                   | Environment | Description                          |
| ------------------------- | ----------- | ------------------------------------ |
| `deno task test`          | Deno        | Main test suite + swetest comparison |
| `deno task test:swetest`  | Deno        | Native swetest comparison only       |
| `deno task test:rust`     | Rust        | Cargo tests                          |
| `deno task test:node`     | Node.js     | E2E tests via built NPM package      |
| `deno task test:browser`  | Browser     | Puppeteer E2E tests                  |
| `deno task test:all`      | All         | Deno + Node.js combined              |
| `deno task verify:golden` | Deno        | Golden value consistency check       |

## Test Files

```
tests/
├── test_suite.ts              # Main test suite (native comparison)
├── swetest_comparison.test.ts # Direct swetest comparison
├── golden.test.ts             # Golden value verification
├── new_api.test.ts            # API surface tests
├── examples_parity.test.ts    # Example code verification
├── fixtures/
│   ├── golden_values.ts       # Reference values
│   └── e2e_suite.ts           # Shared E2E utilities
└── e2e/
    ├── deno/                  # Deno-specific E2E
    ├── node/                  # Node.js E2E
    └── browser/               # Browser E2E with Puppeteer
```

## CI Workflow

The CI pipeline runs all tests in this order:

1. Build WASM artifacts
2. `deno task verify:golden` - Golden value consistency
3. `deno lint` - Code quality
4. `deno task test` - Main test suite
5. `deno task test:node` - Node.js E2E
6. `cargo test` - Rust tests

## Interpreting Failures

### Tolerance Failures

```
AssertionError: Bit-level mismatch for Sun
  Expected: 293.817302741521614
  Actual:   293.817302741521600
```

Check if difference exceeds 1e-11. Small differences may be platform-specific.

### Golden Value Drift

```
❌ Golden values have drifted!
```

Run `deno task gen:golden` only if change is intentional.

### Native swetest Missing

```
error: No such file: vendor/swisseph/swetest
```

Build native swetest first:

```bash
cd vendor/swisseph && make swetest
```
