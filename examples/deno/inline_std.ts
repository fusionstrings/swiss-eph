/**
 * Deno Example: Standard API | Inline Build
 *
 * Demonstrates using the bundled JS artifact with embedded WASM.
 */
import { SwissEph } from "../../lib/wasm-inline/swiss_eph.js";
import { Constants } from "../../src/generated/api.ts";
import { printResults, runVerification } from "../shared/logic.ts";

/**
 * Note: The inline build (swiss_eph.js) exported from wasm-inline
 * is a self-contained module. It handles its own instantiation.
 * However, the version in this repo might need to be imported via
 * the loader if it hasn't been bundled into a single class yet.
 *
 * For this example, we'll assume the standard SwissEph class usage.
 */

// 1. The inline JS already includes the WASM bytes.
// Depending on how it was built, it might export SwissEph directly
// or require an instantiate call.
import { instantiate } from "../../src/loader.ts";

// 2. Instantiate (Loader will prefer WASI if available, but here we show inline usage)
const eph = await instantiate();

// 3. Run and Print
const results = runVerification(eph, Constants);
printResults("Deno", "Inline", "Standard", results);
