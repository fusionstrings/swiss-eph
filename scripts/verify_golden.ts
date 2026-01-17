// verify_golden.ts

async function verify() {
  const goldenPath = "tests/fixtures/golden_values.ts";
  const tempPath = "tests/fixtures/golden_values.tmp.ts";

  // 1. Build swetest_enhanced.wasm
  console.log("Building swetest_enhanced.wasm...");
  const buildCmd = new Deno.Command("make", {
    args: ["swetest_enhanced.wasm"],
  });
  const buildStatus = await buildCmd.output();
  if (!buildStatus.success) {
    console.error("Failed to build swetest_enhanced.wasm");
    Deno.exit(1);
  }

  // 2. Generate new values using WASM (for cross-platform stability)
  console.log("Generating current values via WASM...");
  const genCmd = new Deno.Command("deno", {
    args: ["run", "-A", "scripts/run_swetest_wasm.ts"],
  });
  const genOutput = await genCmd.output();
  if (!genOutput.success) {
    console.error("Failed to run swetest_enhanced.wasm");
    console.error(new TextDecoder().decode(genOutput.stderr));
    Deno.exit(1);
  }
  await Deno.writeFile(tempPath, genOutput.stdout);

  // 3. Format temp file to match project style
  console.log("Formatting temp file...");
  const fmtCmd = new Deno.Command("deno", { args: ["fmt", tempPath] });
  await fmtCmd.output();

  // 4. Compare ignoring "Generated:" line
  const goldenText = await Deno.readTextFile(goldenPath);
  const tempText = await Deno.readTextFile(tempPath);

  const normalize = (text: string) =>
    text.split("\n")
      .filter((line) => !line.includes("* Generated:"))
      .join("\n")
      .trim();

  if (normalize(goldenText) !== normalize(tempText)) {
    console.error("❌ Golden values have drifted!");

    // Show a small diff if possible
    const diffCmd = new Deno.Command("diff", {
      args: ["-u", goldenPath, tempPath],
      stdout: "inherit",
    });
    await diffCmd.output();

    console.log("\nTo update golden values, run: deno task gen:golden");
    Deno.exit(1);
  }

  console.log("✅ Golden values are consistent.");
  await Deno.remove(tempPath);
  await Deno.remove("./swetest_enhanced.wasm");
}

if (import.meta.main) {
  verify();
}
