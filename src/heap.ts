import type { SwissEphExports } from "./swisseph_api.generated.ts";

export interface WasmExports extends SwissEphExports {
  malloc(size: number): number;
  free(ptr: number): void;
}

export class WasmHeap {
  constructor(
    private memory: WebAssembly.Memory,
    private exports: WasmExports,
  ) {}

  alloc(size: number): number {
    return this.exports.malloc(size);
  }

  free(ptr: number) {
    this.exports.free(ptr);
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
