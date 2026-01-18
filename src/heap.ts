/**
 * Interface for WASM memory allocation exports.
 * Supports both standard C malloc/free and wasm-bindgen variants.
 */
export interface WasmExports {
  memory: WebAssembly.Memory;
  malloc?(size: number): number;
  free?(ptr: number): void;
  __wbindgen_malloc?(size: number): number;
  __wbindgen_free?(ptr: number, size: number, align: number): void;
  [key: string]: unknown;
}

/**
 * WebAssembly Memory Heap Manager.
 *
 * Provides typed access to the WASM linear memory, handling
 * allocation, deallocation, and data marshaling between JavaScript
 * and WebAssembly.
 */
export class WasmHeap {
  private allocated = new Map<number, number>();

  constructor(
    private memory: WebAssembly.Memory,
    private exports: WasmExports,
  ) {}

  alloc(size: number): number {
    let ptr: number;
    if (this.exports.malloc) {
      ptr = this.exports.malloc(size);
    } else if (this.exports.__wbindgen_malloc) {
      ptr = this.exports.__wbindgen_malloc(size);
    } else {
      throw new Error(
        `No malloc found in WASM exports. Available: ${
          Object.keys(this.exports).join(", ")
        }`,
      );
    }
    this.allocated.set(ptr, size);
    return ptr;
  }

  free(ptr: number) {
    if (this.exports.free) {
      this.exports.free(ptr);
    } else if (this.exports.__wbindgen_free) {
      const size = this.allocated.get(ptr) || 0;
      this.exports.__wbindgen_free(ptr, size, 8);
    }
    this.allocated.delete(ptr);
  }

  getU8(ptr: number, length: number): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, length);
  }

  setU8(ptr: number, data: Uint8Array) {
    new Uint8Array(this.memory.buffer, ptr, data.length).set(data);
  }

  getF64(ptr: number, length: number): Float64Array {
    return new Float64Array(this.memory.buffer, ptr, length);
  }

  getString(ptr: number): string {
    const buffer = new Uint8Array(this.memory.buffer);
    let end = ptr;
    while (buffer[end] !== 0) end++;
    return new TextDecoder().decode(buffer.subarray(ptr, end));
  }

  getI32(ptr: number): number {
    return new DataView(this.memory.buffer).getInt32(ptr, true);
  }

  putString(str: string): number {
    const bytes = new TextEncoder().encode(str + "\0");
    const ptr = this.alloc(bytes.length);
    this.setU8(ptr, bytes);
    return ptr;
  }
}
