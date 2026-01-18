import { promises as fs } from "node:fs";

const wasmPath = "lib/wasi/swiss_eph.wasm";

async function run() {
  console.log(`Inspecting ${wasmPath}...`);
  const buffer = await fs.readFile(wasmPath);
  const module = await WebAssembly.compile(buffer);
  const imports = WebAssembly.Module.imports(module);

  console.log("Imports found:", imports.length);
  const importMap = new Map<string, string[]>();

  imports.forEach((imp) => {
    if (!importMap.has(imp.module)) {
      importMap.set(imp.module, []);
    }
    importMap.get(imp.module)!.push(imp.name);
  });

  for (const [mod, names] of importMap.entries()) {
    console.log(`\nModule: ${mod}`);
    console.log(names.sort().join("\n"));
  }
}

run();
