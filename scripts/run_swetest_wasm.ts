import { WASI } from "../src/wasi.ts";
import { basename, join, relative } from "@std/path";
import { walk } from "@std/fs";

async function run() {
  const wasmPath = join(Deno.cwd(), "swetest_enhanced.wasm");
  const epheDir = join(Deno.cwd(), "vendor/swisseph/ephe");

  const wasi = new WASI();

  // Mount ephemeris files
  console.error("Loading ephemeris files...");
  for await (const entry of walk(epheDir, { includeDirs: false })) {
    const relPath = relative(Deno.cwd(), entry.path);
    const content = await Deno.readFile(entry.path);
    wasi.mount(relPath, content);
    // Also mount with short path if needed by the library
    wasi.mount(basename(relPath), content);
  }

  const wasm = await Deno.readFile(wasmPath);
  const module = await WebAssembly.compile(wasm);
  const instance = await WebAssembly.instantiate(module, wasi.imports);

  wasi.setMemory(instance.exports.memory as WebAssembly.Memory);

  // Run main
  const main = instance.exports._start as CallableFunction;
  if (main) {
    main();
  } else {
    // If compiled as reactor
    const _initialize = instance.exports._initialize as CallableFunction;
    if (_initialize) _initialize();

    const mainFunc = instance.exports.main as CallableFunction;
    if (mainFunc) mainFunc(0, 0);
  }
}

if (import.meta.main) {
  await run();
}
