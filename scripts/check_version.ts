import { join } from "@std/path";

const CWD = Deno.cwd();

async function getDenoVersion(): Promise<string> {
  const content = await Deno.readTextFile(join(CWD, "deno.json"));
  const json = JSON.parse(content);
  return json.version;
}

async function getCargoVersion(): Promise<string> {
  const content = await Deno.readTextFile(join(CWD, "Cargo.toml"));
  const match = content.match(/^version\s*=\s*"(.*?)"/m);
  if (!match) throw new Error("Could not find version in Cargo.toml");
  return match[1];
}

function getReleaseTag(): string | null {
  // GITHUB_REF_NAME is set during release events (e.g., "v0.1.0")
  const refName = Deno.env.get("GITHUB_REF_NAME");
  if (refName && refName.startsWith("v")) {
    return refName.slice(1); // Remove 'v' prefix
  }
  return null;
}

async function main() {
  console.log("Checking version consistency...\n");

  try {
    const denoVer = await getDenoVersion();
    const cargoVer = await getCargoVersion();
    const releaseTag = getReleaseTag();

    console.log(`deno.json (JSR/NPM):   ${denoVer}`);
    console.log(`Cargo.toml:            ${cargoVer}`);
    if (releaseTag) {
      console.log(`Release tag:           ${releaseTag}`);
    }

    const versions = [denoVer, cargoVer];
    if (releaseTag) {
      versions.push(releaseTag);
    }

    const allMatch = versions.every((v) => v === denoVer);

    if (!allMatch) {
      console.error("\n❌ Error: Versions do not match!");
      console.error("All versions must be identical for release.");
      console.error("\nTo fix, ensure:");
      console.error("  - deno.json 'version' field");
      console.error("  - Cargo.toml 'version' field");
      console.error("  - Release tag (vX.Y.Z format)");
      console.error("all have the same version number.");
      Deno.exit(1);
    }

    console.log("\n✅ All versions match.");
  } catch (error) {
    console.error("\n❌ Error checking versions:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
