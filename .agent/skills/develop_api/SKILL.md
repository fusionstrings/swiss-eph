---
description: Correct pattern for adding new API wrappers with memory safety
---

# Develop API

## Purpose

Document the **correct** pattern for wrapping Swiss Ephemeris C functions in
TypeScript with proper memory management.

## The Alloc-Call-Read-Free Pattern

Every WASM function wrapper **MUST** follow this pattern:

```typescript
/**
 * swe_example: Brief description
 * @param input - Description of input
 * @returns Object with results
 */
swe_example(input: number): { result: number; output: Float64Array } {
  // 1. ALLOCATE - Reserve WASM memory for output
  const out_ptr = this.heap.alloc(8 * 6);  // 6 doubles × 8 bytes
  const serr_ptr = this.heap.alloc(256);   // Error string buffer

  // 2. CALL - Invoke the WASM export
  const ret = this.exports.swe_example(input, out_ptr, serr_ptr);

  // 3. READ - Extract data from WASM memory
  const output = this.heap.getF64(out_ptr, 6).slice();  // .slice() = COPY
  const error = this.heap.getString(serr_ptr);

  // 4. FREE - Release WASM memory (ALWAYS, even on error)
  this.heap.free(out_ptr);
  this.heap.free(serr_ptr);

  // 5. RETURN - Structured result
  return { result: ret, output, error };
}
```

## Critical Rules

### Always Copy with `.slice()`

```typescript
// ✅ CORRECT - Creates independent copy
const output = this.heap.getF64(ptr, 6).slice();

// ❌ WRONG - Returns view that becomes invalid after free()
const output = this.heap.getF64(ptr, 6);
```

### Always Free Memory

```typescript
// ✅ CORRECT - Free after reading
const data = this.heap.getF64(ptr, 6).slice();
this.heap.free(ptr);
return data;

// ❌ WRONG - Memory leak
const data = this.heap.getF64(ptr, 6).slice();
return data; // ptr never freed!
```

### Handle Errors Before Freeing

```typescript
const ret = this.exports.swe_calc(...);
const xx = this.heap.getF64(xx_ptr, 6).slice();
const error = this.heap.getString(serr_ptr);

// Free AFTER reading all data
this.heap.free(xx_ptr);
this.heap.free(serr_ptr);

// Error check AFTER freeing
return { returnCode: ret, xx, error };
```

## Type Mapping (C → TypeScript)

| C Type    | WASM        | TypeScript | Heap Method   |
| --------- | ----------- | ---------- | ------------- |
| `double`  | `f64`       | `number`   | direct        |
| `int32`   | `i32`       | `number`   | direct        |
| `double*` | `i32` (ptr) | `number`   | `getF64()`    |
| `int32*`  | `i32` (ptr) | `number`   | `getI32()`    |
| `char*`   | `i32` (ptr) | `number`   | `getString()` |

## Buffer Sizes

| C Declaration      | Alloc Size     | Notes                 |
| ------------------ | -------------- | --------------------- |
| `double xx[6]`     | `6 * 8 = 48`   | Planet positions      |
| `double cusps[13]` | `13 * 8 = 104` | House cusps           |
| `double ascmc[10]` | `10 * 8 = 80`  | Asc/MC/etc            |
| `char serr[256]`   | `256`          | Standard error buffer |

## Adding a New Function

### Checklist

- [ ] Follow alloc-call-read-free pattern exactly
- [ ] Use `.slice()` for all array returns
- [ ] Free ALL allocated pointers
- [ ] Add TSDoc with parameter descriptions
- [ ] Add test comparing with native `swetest`
- [ ] Verify tolerance ≤ 1e-11 degrees

### Test Template

```typescript
Deno.test("swe_newfunction vs native", async () => {
  const eph = await load({ ephePath: EPHE_PATH });
  
  // Get native result
  const nativeOut = await runNativeSwetest([...args]);
  const nativeValue = parseSwetestOutput(nativeOut);
  
  // Get WASM result  
  const wasmResult = eph.swe_newfunction(...);
  
  // Compare with tolerance
  assertAlmostEquals(wasmResult.value, nativeValue, 1e-11);
});
```
