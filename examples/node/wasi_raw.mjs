/**
 * Node.js Example: Raw WebAssembly | WASI Build
 * 
 * Demonstrates manual instantiation using Node's native WASI module.
 */
import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { printResults } from '../shared/logic.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const wasmPath = join(__dirname, '../../lib/wasi/swiss_eph.wasm');
  const wasmBuffer = await readFile(wasmPath);
  
  // 1. Setup Node WASI
  const wasi = new WASI({
    version: 'preview1',
    args: process.argv,
    env: process.env,
    preopens: {
      '/': __dirname // Allow access to current dir for ephemeris
    }
  });

  // 2. Manual Instantiation
  const importObject = { wasi_snapshot_preview1: wasi.wasiImport };
  const { instance } = await WebAssembly.instantiate(wasmBuffer, importObject);
  
  // 3. Initialize WASI
  wasi.initialize(instance);
  
  const exports = instance.exports;
  const jd = exports.swe_julday(2024, 6, 15, 12, 1);

  console.log("Raw Node WASI instantiation successful!");
  printResults("Node.js", "WASI", "Raw", { 
    jd, 
    sun: { longitude: 0 }, 
    ascmc: [0, 0] 
  });
}

run().catch(console.error);
