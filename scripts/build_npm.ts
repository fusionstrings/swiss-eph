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
    description: "Swiss Ephemeris WASM port for Node.js and Browser",
    license: "AGPL-3.0",
    repository: {
      type: "git",
      url: "git+https://github.com/fusionstrings/swisseph-wasi.git",
    },
    keywords: [
      "astrology",
      "astronomy",
      "ephemeris",
      "swisseph",
      "wasm",
      "planets",
      "houses",
    ],
    homepage: "https://github.com/fusionstrings/swisseph-wasi#readme",
    bugs: {
      url: "https://github.com/fusionstrings/swisseph-wasi/issues",
    },
  },
  compilerOptions: {
    lib: ["ES2021", "DOM"],
  },
  postBuild() {
    try {
      Deno.copyFileSync("libswephe.wasm", "npm/esm/libswephe.wasm");
      Deno.copyFileSync("libswephe.wasm", "npm/script/libswephe.wasm");
      Deno.copyFileSync("README.md", "npm/README.md");
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
      console.log("WASM file and documentation copied successfully.");
    } catch (e) {
      console.error("Failed to copy files:", e);
    }
  },
});
