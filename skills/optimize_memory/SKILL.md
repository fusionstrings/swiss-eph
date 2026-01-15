---
description: Patterns for high-performance zero-copy memory access with WASM
---

# OptimizeMemory Skill

## Goal

Minimize overhead by allowing direct access to WASM memory views (zero-copy)
instead of always copying data to new TypedArrays.

## Strategy

### 1. The `view` vs `copy` Pattern

Default behavior should remain safe (copy), but performance-critical paths
should opt-in to views.

#### Implementation

```typescript
/**
 * method_name: Wrapper with optional zero-copy
 * @param copy - If true (default), returns a copy. If false, returns a view into WASM memory.
 *               WARNING: Views are invalidated if WASM memory grows!
 */
method_name(..., copy: boolean = true): Float64Array {
  // ... call wasm ...
  
  const view = this.heap.getF64(ptr, length);
  
  if (copy) {
    const result = view.slice();
    this.heap.free(ptr); // Safe to free immediately if we copied
    return result;
  } else {
    // For views, the caller is responsible for the data
    // BUT since we malloc'd 'ptr', we MUST free it or leak.
    // ISSUE: If we free(ptr), the view becomes invalid? 
    // NO: WasmHeap.free() just tells the allocator the block is available.
    // The memory bytes don't disappear, but they might be overwritten by next alloc.
    
    // SOLUTION: We cannot easily return a view to a malloc'd temporary buffer 
    // because we need to free it. 
    
    // ALTERNATIVE: Caller provides buffer?
  }
}
```

### 2. Refined Strategy: Caller-Owned Buffers

For true zero-copy in a library context without leaks:

1. **Caller Allocates**: The TS side allocates a buffer (in WASM memory or reuse
   existing).
2. **Pass Pointer**: Pass the pointer to the function.
3. **No Copy**: The function fills it.

**Revised Wrapper Pattern:**

```typescript
/**
 * Efficient pattern: Caller handles memory lifecycle if desired
 */
swe_calc_fast(tjd: number, ipl: number, iflag: number, outBufferPtr?: number): Float64Array {
  let ptr = outBufferPtr;
  let ownMemory = false;
  
  if (!ptr) {
    ptr = this.heap.alloc(6 * 8);
    ownMemory = true;
  }

  this.exports.swe_calc(tjd, ipl, iflag, ptr, serr);

  // If we own the memory, we must copy and free to be safe defaults
  if (ownMemory) {
    const res = this.heap.getF64(ptr, 6).slice();
    this.heap.free(ptr);
    return res;
  }
  
  // If caller provided ptr, they get a view (or they already have one)
  return this.heap.getF64(ptr, 6);
}
```

## Checklist

- [ ] Add `alloc`/`free` helpers to public API so users can manage buffers.
- [ ] Update IO-heavy functions (`swe_calc`, `swe_get_orbital_elements`) to
      accept optional output pointers.
