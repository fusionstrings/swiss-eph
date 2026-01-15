---
description: Automate the generation of TypeScript bindings for Swiss Ephemeris
---

# GenerateBindings Skill

## Goal

Achieve 0% API gap by automating the extraction of function signatures from
`swephexp.h` and generating accurate TypeScript bindings.

## Process

### 1. Analysis

- **Source**: `src/swisseph/swephexp.h`
- **Target**: `src/swisseph_api.generated.ts`
- **Pattern**: Extract all functions defined via `ext_def(...)`.
- **Gap Analysis**: Compare `swe_*` functions in `swephexp.h` vs `mod.ts`.

### 2. Codegen Update (`scripts/codegen.ts`)

1. **Parsing**: Ensure regex captures _all_ `ext_def` macros.
2. **Type Mapping**:
   - `double` -> `number`
   - `int32` -> `number`
   - `char*` -> `number` (pointer)
   - `double*` -> `number` (pointer)
   - `void` -> `void`
3. **Output**: Generate `SwissEphExports` interface matching WASM memory layout.

### 3. Implementation Pattern (`mod.ts`)

For each missing function:

1. **Allocate Memory**: Use `this.heap.alloc()` for output pointers
   (arrays/strings).
2. **Call Export**: Call `this.exports.swe_func(...)`.
3. **Read Result**: Use `this.heap.getF64()` or `this.heap.getString()`.
4. **Free Memory**: Always `this.heap.free()` allocated pointers.
5. **Return**: Return structured object or primitive.

#### Example Template

```typescript
/**
 * swe_example: Example wrapper
 */
swe_example(input: number): { result: number; output: Float64Array } {
  // 1. Allocate
  const out_ptr = this.heap.alloc(8 * 6); // 6 doubles

  // 2. Call
  const ret = this.exports.swe_example(input, out_ptr);

  // 3. Read
  const output = this.heap.getF64(out_ptr, 6).slice();

  // 4. Free
  this.heap.free(out_ptr);

  // 5. Return
  return { result: ret, output };
}
```

## Checklist

- [ ] Scripts extract 107+ functions.
- [ ] Generated interface compiles.
- [ ] All pointers are freed.
