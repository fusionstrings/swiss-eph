import { build, emptyDir } from "@deno/dnt";
import denoJson from "../deno.json" with { type: "json" };

await emptyDir("./npm");
await emptyDir("./npm_scratch");

// 1. Copy src files to npm_scratch root
const copySrc = new Deno.Command("sh", {
  args: ["-c", "cp -R src/* npm_scratch/"],
});
await copySrc.output();

// 2. Prepare lib folder in scratch
await Deno.mkdir("./npm_scratch/lib", { recursive: true });

// 3. Copy wasm-sdk-inline files to npm_scratch/lib/
const copyLibContent = new Deno.Command("sh", {
  args: ["-c", "cp lib/wasm-sdk-inline/* npm_scratch/lib/"],
});
await copyLibContent.output();

await build({
  entryPoints: [
    { name: ".", path: "./npm_scratch/main.ts" },
    { name: "./browser", path: "./npm_scratch/lib/swiss_eph.js" },
  ],
  outDir: "./npm",
  typeCheck: false,
  test: false,
  shims: {
    deno: true,
    undici: true,
  },
  package: {
    name: denoJson.name,
    version: denoJson.version,
    description: denoJson.description,
    license: denoJson.license,
    repository: {
      type: "git",
      url: "git+https://github.com/fusionstrings/swiss-eph.git",
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
    homepage: "https://github.com/fusionstrings/swiss-eph#readme",
    bugs: {
      url: "https://github.com/fusionstrings/swiss-eph/issues",
    },
    exports: {
      "./wasm": "./wasm/swiss_eph.wasm",
      "./wasm-wasi": "./wasm/swiss-eph-wasi.wasm",
      "./browser": "./esm/lib/swiss_eph.js",
    },
  },
  compilerOptions: {
    lib: ["ES2021", "DOM"],
  },
  postBuild() {
    try {
      // WASM
      Deno.mkdirSync("npm/wasm", { recursive: true });
      Deno.copyFileSync(
        "lib/wasi/swiss_eph.wasm",
        "npm/wasm/swiss_eph.wasm",
      );
      Deno.copyFileSync(
        "lib/wasi/swiss_eph.wasm",
        "npm/wasm/swiss-eph-wasi.wasm",
      );

      Deno.copyFileSync("README.md", "npm/README.md");
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
      console.log("WASM file and documentation copied successfully.");

      // Cleanup
      Deno.removeSync("./npm_scratch", { recursive: true });
    } catch (e) {
      console.error("Failed to copy files:", e);
    }
  },
});
