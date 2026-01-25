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
      code += `// Warmup\n`;
      code += `for(let i=0; i<100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);\n`;
      code += `const start = performance.now();\n`;
      code += `const iter = 10000;\n`;
      code += `for(let i=0; i<iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);\n`;
      code += `const end = performance.now();\n`;
      // Avoid division by zero
      code += `const duration = Math.max(end - start, 0.001);\n`;
      code += `const ops = Math.floor(iter / (duration / 1000));\n`;
      code += `const result = eph.swe_calc_ut(jd, 0, CALC_FLAG); // SE_SUN\n`;
      code +=
        `console.log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${result.xx[0].toFixed(6)}°\`);\n`;
      code += `console.log(\`Perf: \${ops.toLocaleString()} ops/sec\`);\n`;
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
      code +=
        `const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);\n`;
      code += `const xxPtr = exports.malloc(6 * 8);\n`;
      code += `const errPtr = exports.malloc(256);\n`;

      code +=
        `const calcFn = exports.swe_calc_ut || exports.wasm_swe_calc_ut;\n`;
      code += `// Warmup\n`;
      code +=
        `for(let i=0; i<100; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      code += `const start = performance.now();\n`;
      code += `const iter = 10000;\n`;
      code +=
        `for(let i=0; i<iter; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      code += `const end = performance.now();\n`;
      code += `const duration = Math.max(end - start, 0.001);\n`;
      code += `const ops = Math.floor(iter / (duration / 1000));\n`;

      code +=
        `(exports.swe_calc_ut || exports.wasm_swe_calc_ut)(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      code += `const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);\n`;
      code +=
        `console.log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${xx[0].toFixed(6)}°\`);\n`;
      code += `console.log(\`Perf: \${ops.toLocaleString()} ops/sec\`);\n`;
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
  
  const log = (msg) => {
    console.log(msg); // For Puppeteer
    document.getElementById('log').textContent += msg + '\\n';
  };
  log("Browser | ${b} | ${s} | ${m}: Loading WASM...");
  
  try {
    const wasmModule = await WebAssembly.compileStreaming(fetch(wasmPath));
    log("WASM loaded. Mode flag: " + CALC_FLAG);
    
    // Instantiate based on style
    let eph, calcFn, xxPtr, errPtr, exports;
    
    ${
      s === "js_api" || s === "inline"
        ? `
      // Mock imports for JS Class if needed (though we load raw wasm here for simplicity in this bench runner, 
      // ideally we'd import the class but that requires module resolution. 
      // Use bundled JS for browser tests
      const { SwissEph } = await import("../../tests/e2e/browser/dist/main.js");
      eph = new SwissEph(wasmModule);
      
      const jd = eph.swe_julday(2024, 6, 15, 12, 1);
      // Warmup
      for(let i=0; i<100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
      const start = performance.now();
      const iter = 10000;
      for(let i=0; i<iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);
      const end = performance.now();
      const duration = Math.max(end - start, 0.001);
      const ops = Math.floor(iter / (duration / 1000));
      const result = eph.swe_calc_ut(jd, 0, CALC_FLAG);
      log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${result.xx[0].toFixed(6)}°\`);
      log(\`Perf: \${ops.toLocaleString()} ops/sec\`);
    `
        : `
      // Direct WASM
      const dummyFn = () => 0;
      const mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });
      const instance = await WebAssembly.instantiate(wasmModule, {
        wasi_snapshot_preview1: mock,
        env: mock,
        wbg: mock,
        "./swiss_eph.internal.js": mock
      });
      exports = instance.exports;
      
      const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);
      xxPtr = exports.malloc(6 * 8);
      errPtr = exports.malloc(256);
      calcFn = exports.swe_calc_ut || exports.wasm_swe_calc_ut;
      
      // Warmup
      for(let i=0; i<100; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
      const start = performance.now();
      const iter = 10000;
      for(let i=0; i<iter; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
      const end = performance.now();
      const duration = Math.max(end - start, 0.001);
      const ops = Math.floor(iter / (duration / 1000));
      
      calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);
      const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);
      
      log(\`${p} | ${b} | ${s} | ${m}: Sun longitude = \${xx[0].toFixed(6)}°\`);
      log(\`Perf: \${ops.toLocaleString()} ops/sec\`);
      exports.free(xxPtr); exports.free(errPtr);
    `
    }
    
  } catch (e) {
    log("Error: " + e.message);
    console.error(e);
  }
</script>
</body>
</html>`;
  }

  if (p === "worker") {
    let workerCode = `// Worker example for ${b} | ${s} | ${m}\n`;
    workerCode += `// Ephemeris Mode: ${m.toUpperCase()} (flag: ${modeFlag})\n`;
    workerCode += `const CALC_FLAG = ${modeFlag};\n`;

    const wasmPath = isWasi
      ? "../../lib/wasi/swiss_eph.wasm"
      : "../../lib/wasm/swiss_eph.wasm";

    if (s === "js_api" || s === "inline") {
      workerCode += `import { SwissEph } from "../../src/main.ts";\n`;
      workerCode +=
        `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
      workerCode +=
        `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
      workerCode += `const eph = new SwissEph(wasmModule);\n`;

      workerCode += `export default {\n`;
      workerCode += `  fetch(_request: Request) {\n`;
      workerCode += `    const jd = eph.swe_julday(2024, 6, 15, 12, 1);\n`;
      workerCode += `    // Warmup\n`;
      workerCode +=
        `    for(let i=0; i<100; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);\n`;
      workerCode += `    const start = performance.now();\n`;
      workerCode += `    const iter = 10000;\n`;
      workerCode +=
        `    for(let i=0; i<iter; i++) eph.swe_calc_ut(jd, 0, CALC_FLAG);\n`;
      workerCode += `    const end = performance.now();\n`;
      workerCode += `    const duration = Math.max(end - start, 0.001);\n`;
      workerCode += `    const ops = Math.floor(iter / (duration / 1000));\n`;
      workerCode += `    const result = eph.swe_calc_ut(jd, 0, CALC_FLAG);\n`;
      workerCode +=
        `    const msg = \`${p} | ${b} | ${s} | ${m}: Sun longitude = \${result.xx[0].toFixed(6)}°\\nPerf: \${ops.toLocaleString()} ops/sec\`;\n`;
      workerCode += `    console.log(msg);\n`;
      workerCode += `    return new Response(msg);\n`;
      workerCode += `  }\n`;
      workerCode += `};\n`;
    } else {
      // Direct WASM
      workerCode +=
        `const wasmUrl = new URL("${wasmPath}", import.meta.url);\n`;
      workerCode +=
        `const wasmModule = await WebAssembly.compileStreaming(fetch(wasmUrl));\n`;
      workerCode += `const dummyFn = () => 0;\n`;
      workerCode +=
        `const mock = new Proxy({}, { get: (_, prop) => prop === "proc_exit" ? (_c) => {} : dummyFn });\n`;
      workerCode +=
        `const instance = await WebAssembly.instantiate(wasmModule, {\n`;
      workerCode += `  wasi_snapshot_preview1: mock,\n`;
      workerCode += `  env: mock,\n`;
      workerCode += `  wbg: mock,\n`;
      workerCode += `  "./swiss_eph.internal.js": mock\n`;
      workerCode += `});\n`;
      workerCode += `const exports = instance.exports;\n`;

      workerCode += `export default {\n`;
      workerCode += `  fetch(_request: Request) {\n`;
      workerCode +=
        `    const jd = (exports.swe_julday || exports.wasm_swe_julday)(2024, 6, 15, 12, 1);\n`;
      workerCode += `    const xxPtr = exports.malloc(6 * 8);\n`;
      workerCode += `    const errPtr = exports.malloc(256);\n`;
      workerCode +=
        `    const calcFn = exports.swe_calc_ut || exports.wasm_swe_calc_ut;\n`;
      workerCode += `    // Warmup\n`;
      workerCode +=
        `    for(let i=0; i<100; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      workerCode += `    const start = performance.now();\n`;
      workerCode += `    const iter = 10000;\n`;
      workerCode +=
        `    for(let i=0; i<iter; i++) calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      workerCode += `    const end = performance.now();\n`;
      workerCode += `    const duration = Math.max(end - start, 0.001);\n`;
      workerCode += `    const ops = Math.floor(iter / (duration / 1000));\n`;
      workerCode += `    calcFn(jd, 0, CALC_FLAG, xxPtr, errPtr);\n`;
      workerCode +=
        `    const xx = new Float64Array(exports.memory.buffer, xxPtr, 6);\n`;
      workerCode +=
        `    const msg = \`${p} | ${b} | ${s} | ${m}: Sun longitude = \${xx[0].toFixed(6)}°\\nPerf: \${ops.toLocaleString()} ops/sec\`;\n`;
      workerCode += `    console.log(msg);\n`;
      workerCode += `    exports.free(xxPtr); exports.free(errPtr);\n`;
      workerCode += `    return new Response(msg);\n`;
      workerCode += `  }\n`;
      workerCode += `};\n`;
    }
    return workerCode;
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
