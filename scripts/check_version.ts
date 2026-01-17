import { join } from "@std/path";

const CWD = Deno.cwd();

async function getDenoVersion(): Promise<string> {
  const content = await Deno.readTextFile(join(CWD, "deno.json"));
  const json = JSON.parse(content);
  return json.version;
}

async function getNpmVersion(): Promise<string> {
  const content = await Deno.readTextFile(join(CWD, "scripts/build_npm.ts"));
  const match = content.match(/version:\s*"(.*?)",/);
  if (!match) throw new Error("Could not find version in scripts/build_npm.ts");
  return match[1];
}

async function main() {
  console.log("Checking version consistency...");

  try {
    const denoVer = await getDenoVersion();
    const npmVer = await getNpmVersion();

    console.log(`deno.json:             ${denoVer}`);
    console.log(`scripts/build_npm.ts:  ${npmVer}`);

    if (denoVer !== npmVer) {
      console.error("\n❌ Error: Versions do not match!");
      Deno.exit(1);
    }

    console.log("\n✅ Versions match.");
  } catch (error) {
    console.error("\n❌ Error checking versions:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
