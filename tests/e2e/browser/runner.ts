import puppeteer from "npm:puppeteer";
import { serveDir } from "jsr:@std/http@1.0.23/file-server";

const port = 8000;

// Native Deno server - no Oak dependency needed
const server = Deno.serve({ port }, (req) => {
  return serveDir(req, {
    fsRoot: Deno.cwd(),
    quiet: true,
  });
});

console.log(`Server running on http://localhost:${port}`);

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });
  const page = await browser.newPage();

  // Capture console logs
  page.on(
    "console",
    (msg: { text: () => string }) => console.log("BROWSER:", msg.text()),
  );

  await page.goto(`http://localhost:${port}/tests/e2e/browser/index.html`);

  // Wait for result
  try {
    await page.waitForFunction(
      () =>
        document.getElementById("output")?.textContent === "PASS" ||
        document.getElementById("output")?.textContent?.startsWith("FAIL") ||
        document.getElementById("output")?.textContent?.startsWith("ERROR"),
      { timeout: 10000 },
    );

    const result = await page.evaluate(() =>
      document.getElementById("output")?.textContent
    );
    console.log("Test Result:", result);

    if (result === "PASS") {
      console.log("Browser E2E Passed!");
      await browser.close();
      await server.shutdown();
      Deno.exit(0);
    } else {
      console.error("Browser E2E Failed!");
      await browser.close();
      await server.shutdown();
      Deno.exit(1);
    }
  } catch (e: unknown) {
    console.error("Browser E2E Timeout or Error:", e);
    await browser.close();
    await server.shutdown();
    Deno.exit(1);
  }
})();
