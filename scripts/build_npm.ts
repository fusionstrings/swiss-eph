import { build, emptyDir } from "@deno/dnt";
import denoJson from "../deno.json" with { type: "json" };

await emptyDir("./npm");

// Ensure browser wrapper exists before building
try {
  await Deno.stat("./browser/wrapper.ts");
} catch {
  console.log("Browser wrapper not found. Running build:browser...");
  const cmd = new Deno.Command("deno", {
    args: ["task", "build:browser"],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success } = await cmd.output();
  if (!success) {
    console.error("Failed to build browser artifact.");
    Deno.exit(1);
  }
}

await build({
  entryPoints: [
    { name: ".", path: "./mod.ts" },
    { name: "./browser", path: "./browser/wrapper.ts" },
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
      "./wasm": "./wasm/libswephe.wasm",
    },
  },
  compilerOptions: {
    lib: ["ES2021", "DOM"],
  },
  postBuild() {
    try {
      // WASM
      Deno.mkdirSync("npm/wasm", { recursive: true });
      Deno.copyFileSync("generated/libswephe.wasm", "npm/wasm/libswephe.wasm");

      Deno.copyFileSync("README.md", "npm/README.md");
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
      console.log("WASM file and documentation copied successfully.");
    } catch (e) {
      console.error("Failed to copy files:", e);
    }
  },
});
