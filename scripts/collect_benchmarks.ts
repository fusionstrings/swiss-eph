import { join } from "@std/path";

const platforms = ["deno", "node"] as const;
const styles = ["js_api", "direct_wasm", "inline"] as const;
const builds = ["wasmbuild", "wasi"] as const;

async function runBenchmark(cmd: string[]) {
  const [exe, ...args] = cmd;
  const command = new Deno.Command(exe, {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  const match = output.match(/Perf:\s+([\d,]+)\s+ops\/sec/);
  return match ? match[1] : "N/A";
}

async function collect() {
  console.log("| Platform | Build | Style | Benchmark (ops/sec) |");
  console.log("| :--- | :--- | :--- | :--- |");

  for (const p of platforms) {
    for (const b of builds) {
      for (const s of styles) {
        const ext = p === "node" ? "mjs" : "ts";
        const file = join("examples", p, `${b}_${s}.${ext}`);

        const cmdParams = p === "deno"
          ? ["deno", "run", "-A", file]
          : ["node", "--no-warnings", file];
        const result = await runBenchmark(cmdParams);
        console.log(`| ${p} | ${b} | ${s} | ${result} |`);
      }
    }
  }
}

collect();
