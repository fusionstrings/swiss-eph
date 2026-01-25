import { join } from "@std/path";
import puppeteer, {
  type Browser,
  type ConsoleMessage,
  type Page,
} from "puppeteer";
import { serveDir } from "@std/http/file-server";

const platforms = ["deno", "node", "browser", "worker"] as const;
const styles = ["js_api", "direct_wasm", "inline"] as const;
const builds = ["wasmbuild", "wasi"] as const;
const modes = ["moshier", "swiss", "jpl"] as const;

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

async function runBrowserBenchmark(
  url: string,
  browser: Browser,
): Promise<string> {
  const page: Page = await browser.newPage();
  let ops = "N/A";

  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    const match = text.match(/Perf:\s+([\d,]+)\s+ops\/sec/);
    if (match) {
      ops = match[1];
    }
  });

  try {
    await page.goto(url);
    await page.waitForFunction(
      // @ts-ignore: DOM context
      () =>
        document.body.innerText.includes("Perf:") ||
        document.body.innerText.includes("Error:"),
      { timeout: 30000 },
    );
  } catch (e: any) {
    console.error(`Timeout/Error for ${url}: ${e.message}`);
  } finally {
    await page.close();
  }
  return ops;
}

async function collect() {
  console.log("| Platform | Build | Style | Mode | Benchmark (ops/sec) |");
  console.log("| :--- | :--- | :--- | :--- | :--- |");

  // Start server for browser tests
  const server = Deno.serve({ port: 8080 }, (req) => {
    return serveDir(req, { fsRoot: Deno.cwd(), quiet: true });
  });

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });

  try {
    for (const p of platforms) {
      for (const b of builds) {
        for (const s of styles) {
          for (const m of modes) {
            const ext = p === "node"
              ? "mjs"
              : (p === "browser" ? "html" : "ts");
            const file = join("examples", p, `${b}_${s}_${m}.${ext}`);
            let result = "N/A";

            if (p === "deno") {
              const cmdParams = ["deno", "run", "-A", file];
              result = await runBenchmark(cmdParams);
            } else if (p === "node") {
              // Skip node for now to save time, or uncomment for full run
              // const cmdParams = ["node", "--no-warnings", file];
              // result = await runBenchmark(cmdParams);
            } else if (p === "browser") {
              result = await runBrowserBenchmark(
                `http://localhost:8080/${file}`,
                browser,
              );
            } else if (p === "worker") {
              try {
                const module = await import("file://" + join(Deno.cwd(), file));
                const response = await module.default.fetch(
                  new Request("http://localhost"),
                );
                const text = await response.text();
                const match = text.match(/Perf:\s+([\d,]+)\s+ops\/sec/);
                result = match ? match[1] : "N/A";
              } catch (e: any) {
                // Ignore errors for now or log debug
                // console.error(`Worker failed ${file}:`, e.message);
              }
            }

            console.log(`| ${p} | ${b} | ${s} | ${m} | ${result} |`);
          }
        }
      }
    }
  } finally {
    await browser.close();
    await server.shutdown();
  }
}

collect();
