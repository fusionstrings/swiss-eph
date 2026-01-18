// This file exists to satisfy JSR static analysis for WASM imports (env).
// It mocks standard C library functions that the WASM module might import.
// These are NOT used at runtime by the WASM module when loaded via modules (wasm-bindgen supply them or they are linked).
// But standard "env" imports triggers JSR checks.

export const memory = new WebAssembly.Memory({ initial: 0 });

// Memory
export function malloc(_size: number): number {
  return 0;
}
export function free(_ptr: number): void {}
export function calloc(_nmemb: number, _size: number): number {
  return 0;
}
export function realloc(_ptr: number, _size: number): number {
  return 0;
}
export function memcpy(_dest: number, _src: number, _n: number): number {
  return 0;
}
export function memmove(_dest: number, _src: number, _n: number): number {
  return 0;
}
export function memset(_s: number, _c: number, _n: number): number {
  return 0;
}
export function memcmp(_s1: number, _s2: number, _n: number): number {
  return 0;
}
export function memchr(_s: number, _c: number, _n: number): number {
  return 0;
}
export function strlen(_s: number): number {
  return 0;
}
export function strdup(_s: number): number {
  return 0;
}
export function strcpy(_dest: number, _src: number): number {
  return 0;
}
export function strncpy(_dest: number, _src: number, _n: number): number {
  return 0;
}
export function strcat(_dest: number, _src: number): number {
  return 0;
}
export function strcmp(_s1: number, _s2: number): number {
  return 0;
}
export function strncmp(_s1: number, _s2: number, _n: number): number {
  return 0;
}
export function strchr(_s: number, _c: number): number {
  return 0;
}
export function strrchr(_s: number, _c: number): number {
  return 0;
}
export function strstr(_haystack: number, _needle: number): number {
  return 0;
}
export function strpbrk(_s: number, _accept: number): number {
  return 0;
}

// I/O
export function fopen(_filename: number, _mode: number): number {
  return 0;
}
export function fclose(_stream: number): number {
  return 0;
}
export function fread(
  _ptr: number,
  _size: number,
  _nmemb: number,
  _stream: number,
): number {
  return 0;
}
export function fwrite(
  _ptr: number,
  _size: number,
  _nmemb: number,
  _stream: number,
): number {
  return 0;
}
export function fseek(
  _stream: number,
  _offset: number,
  _whence: number,
): number {
  return 0;
}
export function fseeko(
  _stream: number,
  _offset: number,
  _whence: number,
): number {
  return 0;
}
export function ftell(_stream: number): number {
  return 0;
}
export function ftello(_stream: number): number {
  return 0;
}
export function rewind(_stream: number): void {}
export function fflush(_stream: number): number {
  return 0;
}
export function fputc(_c: number, _stream: number): number {
  return 0;
}
export function fputs(_s: number, _stream: number): number {
  return 0;
}
export function fgets(_s: number, _size: number, _stream: number): number {
  return 0;
}
export function puts(_s: number): number {
  return 0;
}
export function printf(_format: number, ..._args: number[]): number {
  return 0;
}
export function fprintf(
  _stream: number,
  _format: number,
  ..._args: number[]
): number {
  return 0;
}
export function sprintf(
  _str: number,
  _format: number,
  ..._args: number[]
): number {
  return 0;
}
export function snprintf(
  _str: number,
  _size: number,
  _format: number,
  ..._args: number[]
): number {
  return 0;
}

// Conversion
export function atoi(_nptr: number): number {
  return 0;
}
export function atol(_nptr: number): number {
  return 0;
}
export function atof(_nptr: number): number {
  return 0;
}
export function tolower(_c: number): number {
  return 0;
}

// System
export function abort(): void {}
export function exit(_status: number): void {}
export function getenv(_name: number): number {
  return 0;
}
export function system(_command: number): number {
  return 0;
}

// Math
export function pow(_x: number, _y: number): number {
  return 0;
}
export function sqrt(_x: number): number {
  return 0;
}
export function fmod(_x: number, _y: number): number {
  return 0;
}
