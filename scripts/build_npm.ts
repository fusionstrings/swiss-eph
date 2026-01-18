import { build, emptyDir } from "@deno/dnt";
import denoJson from "../deno.json" with { type: "json" };

await emptyDir("./npm");

await build({
  entryPoints: [
    { name: ".", path: "./src/main.ts" },
    { name: "./browser", path: "./lib/wasm-sdk-inline/swiss_eph.js" },
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
      Deno.copyFileSync("lib/swiss_eph.wasm", "npm/wasm/swiss_eph.wasm");
      Deno.copyFileSync(
        "lib/swiss-eph-wasi.wasm",
        "npm/wasm/swiss-eph-wasi.wasm",
      );
      // Ensure internal JS is available for the browser entry point
      try {
        Deno.mkdirSync("npm/esm/lib", { recursive: true });
        Deno.copyFileSync(
          "lib/swiss_eph.internal.js",
          "npm/esm/lib/swiss_eph.internal.js",
        );
      } catch (_e) {
        // Might already exist if dnt followed imports
        console.log("Note: Internal JS copy skipped or handled by dnt");
      }

      Deno.copyFileSync("README.md", "npm/README.md");
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
      console.log("WASM file and documentation copied successfully.");
    } catch (e) {
      console.error("Failed to copy files:", e);
    }
  },
});
