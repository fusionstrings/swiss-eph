import { join } from "@std/path";

const platforms = ["deno", "node", "browser", "worker"] as const;
const styles = ["js_api", "direct_wasm", "inline"] as const;
const builds = ["wasmbuild", "wasi"] as const;

interface Context {
  platform: string;
  style: string;
  build: string;
}

const FULL_GEN = (ctx: Context) => {
  const isWasi = ctx.build === "wasi";
  const p = ctx.platform;
  const s = ctx.style;
  const b = ctx.build;

  let code = "";
  if (p === "deno" || p === "node") {
    code += `import { SwissEph } from "../../src/main.ts";\n`;
    code +=
      `import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";\n`;
    if (p === "node") code += `import fs from "fs/promises";\n`;
    code += `\n`;

    const wasmPath = isWasi
      ? "../../lib/wasi/swiss_eph.wasm"
      : "../../lib/wasm/swiss_eph.wasm";

    if (s === "js_api" || s === "inline") {
      if (p === "deno") {
        code += `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
        code +=
          `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
      } else {
        code +=
          `const wasmBuffer = await fs.readFile(new URL("${wasmPath}", import.meta.url));\n`;
        code += `const wasmModule = await WebAssembly.compile(wasmBuffer);\n`;
      }
      code += `const eph = new SwissEph(wasmModule);\n`;
      code += `const results = runVerification(eph, {});\n`;
      code += `const ops = runBenchmark(eph, {});\n`;
      code += `printResults("${p}", "${b}", "${s}", results, ops);`;
    } else if (s === "direct_wasm") {
      if (p === "deno") {
        code += `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
        code +=
          `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
      } else {
        code +=
          `const wasmBuffer = await fs.readFile(new URL("${wasmPath}", import.meta.url));\n`;
        code += `const wasmModule = await WebAssembly.compile(wasmBuffer);\n`;
      }
      code +=
        `const dummyFn = () => 0;\nconst mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (c) => {} : dummyFn });\n`;
      code += `const instance = await WebAssembly.instantiate(wasmModule, {\n`;
      code += `  wasi_snapshot_preview1: mock,\n`;
      code += `  env: mock,\n`;
      code += `  wbg: mock,\n`;
      code += `  "./swiss_eph.internal.js": mock\n`;
      code += `});\n`;
      code +=
        `const exports = (instance.instance || instance).exports as any;\n`;
      code += `\n// Minimal wrapper for direct WASM to handle memory\n`;
      code += `const memory = exports.memory as WebAssembly.Memory;\n`;
      code += `const ephWrapper: any = {\n`;
      code +=
        `  swe_julday: (exports.swe_julday || exports.wasm_swe_julday).bind(exports),\n`;
      code += `  swe_calc_ut: (jd: number, body: number, flag: number) => {\n`;
      code +=
        `    const fn = (exports.swe_calc_ut || exports.wasm_swe_calc_ut || exports.calc_ut);\n`;
      code += `    const xxPtr = exports.malloc(6 * 8);\n`;
      code += `    const errPtr = exports.malloc(256);\n`;
      code += `    fn(jd, body, flag, xxPtr, errPtr);\n`;
      code +=
        `    const xx = new Float64Array(memory.buffer, xxPtr, 6).slice();\n`;
      code += `    exports.free(xxPtr); exports.free(errPtr);\n`;
      code += `    return { xx, error: "" };\n`;
      code += `  },\n`;
      code +=
        `  swe_houses: (jd: number, lat: number, lon: number, hsys: number) => {\n`;
      code +=
        `    const fn = (exports.swe_houses || exports.wasm_swe_houses);\n`;
      code += `    const cuspsPtr = exports.malloc(13 * 8);\n`;
      code += `    const ascmcPtr = exports.malloc(10 * 8);\n`;
      code += `    fn(jd, lat, lon, hsys, cuspsPtr, ascmcPtr);\n`;
      code +=
        `    const cusps = new Float64Array(memory.buffer, cuspsPtr, 13).slice();\n`;
      code +=
        `    const ascmc = new Float64Array(memory.buffer, ascmcPtr, 10).slice();\n`;
      code += `    exports.free(cuspsPtr); exports.free(ascmcPtr);\n`;
      code += `    return { cusps, ascmc };\n`;
      code += `  }\n`;
      code += `};\n`;
      code += `const results = runVerification(ephWrapper, {});\n`;
      code += `const ops = runBenchmark(ephWrapper, {});\n`;
      code += `printResults("${p}", "${b}", "${s}", results, ops);`;
    }
    return code;
  }

  if (p === "browser") {
    return `<!DOCTYPE html>\n<html>\n<body>\n<pre id="log"></pre>\n<script type="module">\n  import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";\n  const log = (msg) => document.getElementById('log').textContent += msg + '\\n';\n  console.log = log;\n  log("Browser benchmark for ${b} | ${s}");\n</script>\n</body>\n</html>`;
  }

  return `// Example for ${p} | ${b} | ${s}`;
};

async function generate() {
  for (const p of platforms) {
    for (const b of builds) {
      for (const s of styles) {
        const dir = join("examples", p);
        await Deno.mkdir(dir, { recursive: true });
        const ext = p === "node" ? "mjs" : (p === "browser" ? "html" : "ts");
        const filename = join(dir, b + "_" + s + "." + ext);
        await Deno.writeTextFile(
          filename,
          FULL_GEN({ platform: p, build: b, style: s }),
        );
      }
    }
  }
}

generate();
