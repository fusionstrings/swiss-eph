import { join } from "@std/path";

const platforms = ["deno", "node", "browser", "worker"] as const;
const styles = ["js_api", "direct_wasm", "inline"] as const;
const builds = ["wasmbuild", "wasi"] as const;
const modes = ["moshier", "swiss", "jpl"] as const;

interface Context {
  platform: string;
  style: string;
  build: string;
  mode: string;
}

const MODE_FLAGS: Record<string, string> = {
  moshier: "4", // SEFLG_MOSEPH
  swiss: "2", // SEFLG_SWIEPH
  jpl: "1", // SEFLG_JPLEPH
};

const FULL_GEN = (ctx: Context) => {
  const isWasi = ctx.build === "wasi";
  const p = ctx.platform;
  const s = ctx.style;
  const b = ctx.build;
  const m = ctx.mode;
  const modeFlag = MODE_FLAGS[m];
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
    code += `\n`;
    code += `// Ephemeris Mode: ${m.toUpperCase()} (flag: ${modeFlag})\n`;
    code += `const CALC_FLAG = ${modeFlag};\n\n`;

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
      code += `\n// Verification with ${m.toUpperCase()} mode\n`;
      code += `const jd = eph.swe_julday(2024, 6, 15, 12, 1);\n`;
      code += `const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN\n`;
      code +=
        `console.log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${result.xx[0].toFixed(6)}°\`);\n`;
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
      code += `\n// Direct WASM call with ${m.toUpperCase()} mode\n`;
      code += `const jd = exports.swe_julday(2024, 6, 15, 12, 1);\n`;
      code += `const xxPtr = exports.malloc(6 * 8);\n`;
      code += `const errPtr = exports.malloc(256);\n`;
      code += `exports.swe_calc_ut(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      code += `const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);\n`;
      code +=
        `console.log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${xx[0].toFixed(6)}°\`);\n`;
      code += `exports.free(xxPtr); exports.free(errPtr);\n`;
    }
    return code;
  }

  if (p === "browser") {
    return `<!DOCTYPE html>
<html>
<head><title>${b} | ${s} | ${m}</title></head>
<body>
<pre id="log"></pre>
<script type="module">
  // Ephemeris Mode: ${m.toUpperCase()} (flag: ${modeFlag})
  const CALC_FLAG = ${modeFlag};
  const wasmPath = "${
      isWasi ? "../../lib/wasi/swiss_eph.wasm" : "../../lib/wasm/swiss_eph.wasm"
    }";
  
  const log = (msg) => document.getElementById('log').textContent += msg + '\\n';
  log("Browser | ${b} | ${s} | ${m}: Loading WASM...");
  
  try {
    const wasmModule = await WebAssembly.compileStreaming(fetch(wasmPath));
    log("WASM loaded. Mode flag: " + CALC_FLAG);
  } catch (e) {
    log("Error: " + e.message);
  }
</script>
</body>
</html>`;
  }

  if (p === "worker") {
    return `// Worker example for ${b} | ${s} | ${m}
// Ephemeris Mode: ${m.toUpperCase()} (flag: ${modeFlag})
const CALC_FLAG = ${modeFlag};

export default {
  fetch(_request: Request) {
    return new Response("Worker ${b} | ${s} | ${m} - flag: " + CALC_FLAG);
  }
};
`;
  }

  return `// Example for ${p} | ${b} | ${s} | ${m}\n`;
};

async function generate() {
  let count = 0;
  for (const p of platforms) {
    for (const b of builds) {
      for (const s of styles) {
        for (const m of modes) {
          const dir = join("examples", p);
          await Deno.mkdir(dir, { recursive: true });
          const ext = p === "node" ? "mjs" : (p === "browser" ? "html" : "ts");
          const filename = join(dir, `${b}_${s}_${m}.${ext}`);
          const content = FULL_GEN({
            platform: p,
            build: b,
            style: s,
            mode: m,
          });
          await Deno.writeTextFile(filename, content);
          count++;
        }
      }
    }
  }
  console.log(
    `Generated ${count} example files (4 platforms × 2 builds × 3 styles × 3 modes = 72)`,
  );
}

generate();
