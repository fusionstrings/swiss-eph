import { join } from "@std/path";

const CWD = Deno.cwd();

async function getDenoVersion(): Promise<string> {
  const content = await Deno.readTextFile(join(CWD, "deno.json"));
  const json = JSON.parse(content);
  return json.version;
}

async function getCargoVersion(path: string): Promise<string> {
  const content = await Deno.readTextFile(path);
  const match = content.match(/^version\s*=\s*"(.*?)"/m);
  if (!match) throw new Error(`Could not find version in ${path}`);
  return match[1];
}

async function getWorkspaceMembers(): Promise<string[]> {
  const path = join(CWD, "Cargo.toml");
  try {
    const content = await Deno.readTextFile(path);
    const match = content.match(/members\s*=\s*\[([\s\S]*?)\]/);
    if (!match) return [];
    return match[1]
      .split(",")
      .map((m) => m.trim().replace(/"/g, ""))
      .filter((m) => m.length > 0);
  } catch {
    return [];
  }
}

function getReleaseTag(): string | null {
  const refName = Deno.env.get("GITHUB_REF_NAME");
  if (refName && refName.startsWith("v")) {
    return refName.slice(1);
  }
  return null;
}

async function main() {
  console.log("Checking version consistency...\n");

  try {
    const denoVer = await getDenoVersion();
    const releaseTag = getReleaseTag();

    console.log(`deno.json (JSR):       ${denoVer}`);

    const versions: Record<string, string> = {
      "deno.json": denoVer,
    };

    if (releaseTag) {
      console.log(`Release tag:           ${releaseTag}`);
      versions["release tag"] = releaseTag;
    }

    // Root Cargo.toml (if it has a version)
    const rootCargo = join(CWD, "Cargo.toml");
    const rootContent = await Deno.readTextFile(rootCargo);
    if (rootContent.includes("[package]")) {
      const v = await getCargoVersion(rootCargo);
      console.log(`Cargo.toml (root):     ${v}`);
      versions["Cargo.toml (root)"] = v;
    }

    // Workspace members
    const members = await getWorkspaceMembers();
    for (const member of members) {
      const memberPath = join(CWD, member, "Cargo.toml");
      const v = await getCargoVersion(memberPath);
      console.log(
        `Cargo.toml (${member}): ${
          " ".repeat(Math.max(0, 10 - member.length))
        }${v}`,
      );
      versions[`Cargo.toml (${member})`] = v;
    }

    const versionValues = Object.values(versions);
    const allMatch = versionValues.every((v) => v === denoVer);

    if (!allMatch) {
      console.error("\n❌ Error: Versions do not match!");
      for (const [name, ver] of Object.entries(versions)) {
        if (ver !== denoVer) {
          console.error(`  - ${name}: ${ver} (expected ${denoVer})`);
        }
      }
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
