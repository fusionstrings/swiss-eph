import * as esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "jsr:@std/path";

const __dirname = dirname(fromFileUrl(import.meta.url));
// const npmDir = join(__dirname, "../../../npm");
const outDir = join(__dirname, "dist");

await Deno.mkdir(outDir, { recursive: true });

console.log("Bundling NPM browser artifact for testing...");

try {
  await esbuild.build({
    entryPoints: [join(__dirname, "../../../browser/wrapper.ts")],
    bundle: true,
    outfile: join(outDir, "test_bundle.js"),
    format: "esm",
    platform: "browser",
    define: { "global": "window" },
  });
  console.log("✓ Bundle created at tests/e2e/browser/dist/test_bundle.js");
} catch (e) {
  console.error("✗ Bundling failed:", e);
  Deno.exit(1);
} finally {
  esbuild.stop();
}
