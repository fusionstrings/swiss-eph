import * as esbuild from "npm:esbuild@0.20.0";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.9.0";

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["./mod.ts"],
  outfile: "./dist/swisseph.bundle.js",
  bundle: true,
  format: "esm",
  target: "es2020",
  sourcemap: true,
});

console.log("Browser bundle created: dist/swisseph.bundle.js");
esbuild.stop();
