import * as esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
const outDir = join(__dirname, "dist");

await Deno.mkdir(outDir, { recursive: true });

console.log("Bundling NPM browser artifact for testing...");

try {
  await esbuild.build({
    entryPoints: [
      join(__dirname, "../../../src/loader.ts"),
      join(__dirname, "../../../src/main.ts"),
      join(__dirname, "../../fixtures/e2e_suite.ts"),
      join(__dirname, "../../../src/generated/api.ts"), // For Constants
    ],
    bundle: true,
    outdir: outDir,
    format: "esm",
    platform: "browser",
    splitting: true,
    entryNames: "[name]",
    define: { "global": "window" },
  });
  console.log("✓ Bundle created at tests/e2e/browser/dist/");

  // Copy WASM module files to dist
  const inlineSrc = join(__dirname, "../../../lib/wasm-inline");
  for (const entry of Deno.readDirSync(inlineSrc)) {
    if (entry.isFile) {
      await Deno.copyFile(
        join(inlineSrc, entry.name),
        join(outDir, entry.name),
      );
    }
  }
  console.log("✓ Copied WASM inline files to dist");

  // Copy ephemeris files to dist/ephe
  const epheSrc = join(__dirname, "../../../vendor/swisseph/ephe");
  const epheDest = join(outDir, "ephe");
  await Deno.mkdir(epheDest, { recursive: true });
  for (const file of ["sepl_18.se1", "semo_18.se1", "seas_18.se1"]) {
    await Deno.copyFile(join(epheSrc, file), join(epheDest, file));
  }
  console.log("✓ Copied ephemeris files to dist/ephe");
} catch (e) {
  console.error("✗ Bundling failed:", e);
  Deno.exit(1);
} finally {
  esbuild.stop();
}
