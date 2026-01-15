import { WASI } from "./src/wasi.ts";
import type { WasmExports } from "./src/heap.ts";
import { WasmHeap } from "./src/heap.ts";
import { Constants } from "./src/swisseph_api.generated.ts";
import type { SwissEphExports } from "./src/swisseph_api.generated.ts";

export { Constants };

export class SwissEph {
  private instance: WebAssembly.Instance;
  private heap: WasmHeap;
  private exports: SwissEphExports;
  private wasi: WASI;

  constructor(module: WebAssembly.Module) {
    this.wasi = new WASI();
    const imports = { ...this.wasi.imports };
    this.instance = new WebAssembly.Instance(module, imports);
    this.wasi.setMemory(this.instance.exports.memory as WebAssembly.Memory);
    this.exports = this.instance.exports as unknown as SwissEphExports;
    this.heap = new WasmHeap(
      this.instance.exports.memory as WebAssembly.Memory,
      this.exports as unknown as WasmExports,
    );
  }

  /**
   * Mount a file into the virtual filesystem
   */
  mount(path: string, content: Uint8Array) {
    this.wasi.mount(path, content);
  }

  /**
   * Set ephemeris path inside the library
   */
  set_ephe_path(path: string) {
    const ptr = this.heap.alloc(path.length + 1);
    this.heap.setU8(ptr, new TextEncoder().encode(path + "\0"));
    this.exports.swe_set_ephe_path(ptr);
    this.heap.free(ptr);
  }

  /**
   * swe_calc: Compute planetary position for a given TT date
   */
  swe_calc(
    tjd_et: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; error: string } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_calc(tjd_et, ipl, iflag, xx_ptr, serr_ptr);

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, error };
  }

  /**
   * swe_calc_ut: Compute planetary position for a given UT date
   */
  swe_calc_ut(
    tjd_ut: number,
    ipl: number,
    iflag: number,
  ): { returnCode: number; xx: Float64Array; error: string } {
    const xx_ptr = this.heap.alloc(6 * 8);
    const serr_ptr = this.heap.alloc(256);

    const ret = this.exports.swe_calc_ut(tjd_ut, ipl, iflag, xx_ptr, serr_ptr);

    const xx = this.heap.getF64(xx_ptr, 6).slice();
    const error = this.heap.getString(serr_ptr);

    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);

    return { returnCode: ret, xx, error };
  }

  /**
   * swe_houses: Compute house cusps and ascmc values
   */
  swe_houses(
    tjd_ut: number,
    geolat: number,
    geolon: number,
    hsys: number,
  ): { cusps: Float64Array; ascmc: Float64Array; returnCode: number } {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);

    const ret = this.exports.swe_houses(
      tjd_ut,
      geolat,
      geolon,
      hsys,
      cusps_ptr,
      ascmc_ptr,
    );

    const cusps = this.heap.getF64(cusps_ptr, 13).slice();
    const ascmc = this.heap.getF64(ascmc_ptr, 10).slice();

    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);

    return { cusps, ascmc, returnCode: ret };
  }

  /**
   * swe_julday: Compute Julian Day
   */
  swe_julday(
    year: number,
    month: number,
    day: number,
    hour: number,
    gregflag: number,
  ): number {
    return this.exports.swe_julday(year, month, day, hour, gregflag);
  }

  /**
   * swe_version: Get library version
   */
  swe_version(): string {
    const ptr = this.heap.alloc(256);
    this.exports.swe_version(ptr);
    const ver = this.heap.getString(ptr);
    this.heap.free(ptr);
    return ver;
  }

  /**
   * Close the library and free resources
   */
  close() {
    this.exports.swe_close(0);
  }
}

export interface LoadOptions {
  wasmSource?: string | URL | Uint8Array;
  ephePath?: string;
}

/**
 * Load the SwissEph WASM module and optionally mount ephemeris files
 */
export async function load(
  options: string | URL | Uint8Array | LoadOptions = {},
): Promise<SwissEph> {
  let wasmSource: string | URL | Uint8Array | undefined;
  let ephePath: string | undefined;

  if (
    options instanceof Uint8Array || typeof options === "string" ||
    options instanceof URL
  ) {
    wasmSource = options;
  } else {
    wasmSource = options.wasmSource;
    ephePath = options.ephePath;
  }

  let bytes: Uint8Array;
  if (wasmSource instanceof Uint8Array) {
    bytes = wasmSource;
  } else {
    const url = wasmSource || new URL("./libswephe.wasm", import.meta.url);
    if (typeof Deno !== "undefined") {
      bytes = await Deno.readFile(
        url instanceof URL ? url : new URL(url, import.meta.url),
      );
    } else {
      const response = await fetch(url);
      bytes = new Uint8Array(await response.arrayBuffer());
    }
  }

  const module = new WebAssembly.Module(bytes as unknown as BufferSource);
  const eph = new SwissEph(module);

  if (ephePath && typeof Deno !== "undefined") {
    // Recursively load .se1 and .sweph files from the path
    for await (const entry of Deno.readDir(ephePath)) {
      if (
        entry.isFile &&
        (entry.name.endsWith(".se1") || entry.name.endsWith(".sweph"))
      ) {
        const content = await Deno.readFile(`${ephePath}/${entry.name}`);
        eph.mount(entry.name, content);
      }
    }
    // Set internal path to current dir as we mounted them at root
    eph.set_ephe_path(".");
  }

  return eph;
}
