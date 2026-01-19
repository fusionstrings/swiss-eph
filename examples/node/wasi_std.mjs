/**
 * Node.js Example: Standard API | WASI Build
 * 
 * Demonstrates using SwissEph in Node.js (ESM) without any build tools.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Note: In a real project, you'd import from '@fusionstrings/swiss-eph'
import { SwissEph } from '../../src/main.ts';
import { Constants } from '../../src/generated/api.ts';
import { runVerification, printResults } from '../shared/logic.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  // 1. Load WASM binary
  const wasmPath = join(__dirname, '../../lib/wasi/swiss_eph.wasm');
  const wasmBuffer = await readFile(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);

  // 2. Instantiate using SwissEph (Handles Node:WASI internally)
  const eph = new SwissEph(wasmModule);

  // 3. Run and Print
  const results = runVerification(eph, Constants);
  printResults("Node.js", "WASI", "Standard", results);
}

run().catch(console.error);
