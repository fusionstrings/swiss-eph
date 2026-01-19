import puppeteer from "puppeteer";
import { serveDir } from "@std/http/file-server";

const port = 8000;

// Native Deno server - no Oak dependency needed
const server = Deno.serve({ port }, (req) => {
  return serveDir(req, {
    fsRoot: Deno.cwd(),
    quiet: true,
  });
});

console.log(`Server root: ${Deno.cwd()}`);
try {
  const checkPath = "tests/e2e/browser/dist/swiss_eph.js";
  const stat = await Deno.stat(checkPath);
  console.log(`Verified ${checkPath}: exists (${stat.size} bytes)`);
} catch (e) {
  console.error(
    `ERROR: Could not find tests/e2e/browser/dist/swiss_eph.js:`,
    e,
  );
}

console.log(`Server running on http://localhost:${port}`);

// Verify server accessibility
try {
  const verifyUrl =
    `http://localhost:${port}/tests/e2e/browser/dist/swiss_eph.js`;
  console.log(`Verifying URL from Deno: ${verifyUrl}`);
  const resp = await fetch(verifyUrl);
  console.log(`Verification fetch status: ${resp.status} ${resp.statusText}`);
  if (!resp.ok) {
    console.log("Verification text:", await resp.text());
  }
} catch (e) {
  console.error("Verification fetch failed:", e);
}

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

  await page.goto(
    `http://localhost:${port}/tests/e2e/browser/index_artifact.html`,
  );

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
