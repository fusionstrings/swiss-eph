import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  shims: {
    deno: true,
    undici: true,
  },
  package: {
    name: "@fusionstrings/swisseph-wasi",
    version: "0.1.0",
    description: "Swiss Ephemeris WASM port",
    license: "AGPL-3.0",
    repository: {
      type: "git",
      url: "git+https://github.com/fusionstrings/swisseph-wasi.git",
    },
  },
  compilerOptions: {
    lib: ["ES2021", "DOM"],
  },
  postBuild() {
    try {
      Deno.copyFileSync("libswephe.wasm", "npm/esm/libswephe.wasm");
      Deno.copyFileSync("libswephe.wasm", "npm/script/libswephe.wasm");
      console.log("WASM file copied successfully.");
    } catch (e) {
      console.error("Failed to copy WASM file:", e);
    }
  },
});
