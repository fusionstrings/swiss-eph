const wasm = await Deno.readFile("libswephe.wasm");
const module = new WebAssembly.Module(wasm);
console.info("Exports Length:", WebAssembly.Module.exports(module).length);
console.log(
  "Exports:",
  WebAssembly.Module.exports(module).map((e) => e.name).filter((n) =>
    n.includes("swe") || n === "malloc"
  ),
);
console.log("Imports:", WebAssembly.Module.imports(module));
