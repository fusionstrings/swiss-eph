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
  const isTS = p === "deno" || p === "worker";

  let code = "";
  if (p === "deno" || p === "node") {
    if (s === "js_api" || s === "inline") {
      if (p === "deno") {
        code += `import type { SwissEph } from "../../src/main.ts";\n`;
        code +=
          `import { SwissEph as SwissEphClass } from "../../src/main.ts";\n`;
      } else {
        code +=
          `import { SwissEph as SwissEphClass } from "../../src/main.ts";\n`;
        code += `import { readFile } from "node:fs/promises";\n`;
      }
    } else {
      if (p === "node") {
        code += `import { readFile } from "node:fs/promises";\n`;
      }
    }
    code +=
      `import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";\n`;
    code += `\n`;

    const wasmPath = isWasi
      ? "../../lib/wasi/swiss_eph.wasm"
      : "../../lib/wasm/swiss_eph.wasm";

    if (s === "js_api" || s === "inline") {
      if (p === "deno") {
        code += `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
        code +=
          `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
        code += `const eph: SwissEph = new SwissEphClass(wasmModule);\n`;
      } else {
        code +=
          `const wasmBuffer = await readFile(new URL("${wasmPath}", import.meta.url));\n`;
        code += `const wasmModule = await WebAssembly.compile(wasmBuffer);\n`;
        code += `const eph = new SwissEphClass(wasmModule);\n`;
      }
      code += `const results = runVerification(eph, {});\n`;
      code += `const ops = runBenchmark(eph, {});\n`;
      code += `printResults("${p}", "${b}", "${s}", results, ops);\n`;
    } else if (s === "direct_wasm") {
      if (p === "deno") {
        code += `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
        code +=
          `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
      } else {
        code +=
          `const wasmBuffer = await readFile(new URL("${wasmPath}", import.meta.url));\n`;
        code += `const wasmModule = await WebAssembly.compile(wasmBuffer);\n`;
      }
      if (isTS) {
        code += `interface WasmExports extends WebAssembly.Exports {\n`;
        code += `  memory: WebAssembly.Memory;\n`;
        code += `  malloc: (size: number) => number;\n`;
        code += `  free: (ptr: number) => void;\n`;
        code +=
          `  swe_julday: (y: number, m: number, d: number, h: number, c: number) => number;\n`;
        code +=
          `  swe_calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;\n`;
        code +=
          `  wasm_swe_calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;\n`;
        code +=
          `  calc_ut: (jd: number, body: number, flag: number, xx: number, err: number) => number;\n`;
        code +=
          `  swe_houses: (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;\n`;
        code +=
          `  wasm_swe_houses: (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;\n`;
        code += `}\n\n`;
      }
      code +=
        `const dummyFn = () => 0;\nconst mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });\n`;
      code += `const instance = await WebAssembly.instantiate(wasmModule, {\n`;
      code += `  wasi_snapshot_preview1: mock,\n`;
      code += `  env: mock,\n`;
      code += `  wbg: mock,\n`;
      code += `  "./swiss_eph.internal.js": mock\n`;
      code += `});\n`;
      if (isTS) {
        code +=
          `const exports = (instance.instance || instance).exports as WasmExports;\n`;
      } else {
        code += `const exports = (instance.instance || instance).exports;\n`;
      }
      code += `\n// Minimal wrapper for direct WASM to handle memory\n`;
      code += `const memory = exports.memory;\n`;
      code += `const ephWrapper = {\n`;
      if (isTS) {
        code +=
          `  swe_julday: (exports.swe_julday || (exports as unknown as Record<string, (a: unknown) => unknown>).wasm_swe_julday).bind(exports) as (y: number, m: number, d: number, h: number, c: number) => number,\n`;
        code +=
          `  swe_calc_ut: (jd: number, body: number, flag: number) => {\n`;
        code +=
          `    const fn = (exports.swe_calc_ut || exports.wasm_swe_calc_ut || exports.calc_ut) as (jd: number, body: number, flag: number, xx: number, err: number) => number;\n`;
      } else {
        code +=
          `  swe_julday: (exports.swe_julday || exports.wasm_swe_julday).bind(exports),\n`;
        code += `  swe_calc_ut: (jd, body, flag) => {\n`;
        code +=
          `    const fn = (exports.swe_calc_ut || exports.wasm_swe_calc_ut || exports.calc_ut);\n`;
      }
      code += `    const xxPtr = exports.malloc(6 * 8);\n`;
      code += `    const errPtr = exports.malloc(256);\n`;
      code += `    fn(jd, body, flag, xxPtr, errPtr);\n`;
      code +=
        `    const xx = new Float64Array(memory.buffer, xxPtr, 6).slice();\n`;
      code += `    exports.free(xxPtr); exports.free(errPtr);\n`;
      code += `    return { xx, error: "" };\n`;
      code += `  },\n`;
      if (isTS) {
        code +=
          `  swe_houses: (jd: number, lat: number, lon: number, hsys: number) => {\n`;
        code +=
          `    const fn = (exports.swe_houses || exports.wasm_swe_houses) as (jd: number, lat: number, lon: number, h: number, c: number, a: number) => void;\n`;
      } else {
        code += `  swe_houses: (jd, lat, lon, hsys) => {\n`;
        code +=
          `    const fn = (exports.swe_houses || exports.wasm_swe_houses);\n`;
      }
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
      if (isTS) {
        code +=
          `const results = runVerification(ephWrapper as unknown as SwissEphClass, {});\n`;
        code +=
          `const ops = runBenchmark(ephWrapper as unknown as SwissEphClass, {});\n`;
      } else {
        code += `const results = runVerification(ephWrapper, {});\n`;
        code += `const ops = runBenchmark(ephWrapper, {});\n`;
      }
      code += `printResults("${p}", "${b}", "${s}", results, ops);\n`;
    }
    return code;
  }

  if (p === "browser") {
    return `<!DOCTYPE html>\n<html>\n<body>\n<pre id="log"></pre>\n<script type="module">\n  import { runVerification, printResults, runBenchmark } from "../shared/logic.ts";\n  const log = (msg) => document.getElementById('log').textContent += msg + '\\n';\n  console.log = log;\n  log("Browser benchmark for ${b} | ${s}");\n</script>\n</body>\n</html>`;
  }

  return `// Example for ${p} | ${b} | ${s}\n`;
};

async function generate() {
  for (const p of platforms) {
    for (const b of builds) {
      for (const s of styles) {
        const dir = join("examples", p);
        await Deno.mkdir(dir, { recursive: true });
        const ext = p === "node" ? "mjs" : (p === "browser" ? "html" : "ts");
        const filename = join(dir, b + "_" + s + "." + ext);
        const content = FULL_GEN({ platform: p, build: b, style: s });
        await Deno.writeTextFile(filename, content);
      }
    }
  }
}

generate();
