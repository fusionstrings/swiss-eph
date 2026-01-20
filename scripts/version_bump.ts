import { join } from "@std/path";

const CWD = Deno.cwd();

async function bumpDeno(version: string) {
  const path = join(CWD, "deno.json");
  const content = await Deno.readTextFile(path);
  const json = JSON.parse(content);
  json.version = version;
  await Deno.writeTextFile(path, JSON.stringify(json, null, 2) + "\n");
  console.log(`Updated deno.json to ${version}`);
}

async function bumpCargoFile(path: string, version: string) {
  let content = await Deno.readTextFile(path);
  // Match `version = "x.y.z"` in the [package] section
  const packageMatch = content.match(/\[package\]([\s\S]*?)^version = ".*?"/m);
  if (packageMatch) {
    content = content.replace(/^version = ".*?"/m, `version = "${version}"`);
  } else {
    content = content.replace(/^version = ".*?"/m, `version = "${version}"`);
  }

  // Update swiss-eph-data dependency to use current version AND include path for workspace
  // This ensures cargo can find it even if not published to crates.io yet
  const shortVersion = version.split(".").slice(0, 2).join(".");
  if (content.includes("swiss-eph-data = {")) {
    content = content.replace(
      /swiss-eph-data = \{([\s\S]*?)\}/g,
      (_match, inner) => {
        // Preserve optional = true if it exists
        const isOptional = inner.includes("optional = true");
        return `swiss-eph-data = { version = "${shortVersion}", path = "../swiss-eph-data"${
          isOptional ? ", optional = true" : ""
        } }`;
      },
    );
  }

  await Deno.writeTextFile(path, content);
  console.log(`Updated ${path} to ${version}`);
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

async function updateChangelog(version: string) {
  const path = join(CWD, "CHANGELOG.md");
  let content = "";
  try {
    content = await Deno.readTextFile(path);
  } catch {
    console.log("No CHANGELOG.md found, skipping.");
    return;
  }

  const date = new Date().toISOString().split("T")[0];

  if (!content.includes(`## [${version}]`)) {
    const newEntry =
      `## [${version}] - ${date}\n\n### Changed\n- Version bump to ${version}.\n\n`;

    if (content.includes("## [Unreleased]")) {
      content = content.replace(
        "## [Unreleased]",
        `## [Unreleased]\n\n${newEntry}`,
      );
    } else {
      // Look for the first release header or append after main header
      const match = content.match(/^## \[.*?\]/m);
      if (match) {
        content = content.replace(match[0], `${newEntry}${match[0]}`);
      } else {
        // Append to end if empty-ish
        content += `\n${newEntry}`;
      }
    }
    await Deno.writeTextFile(path, content);
    console.log(`Updated CHANGELOG.md with entry for ${version}`);
  }
}

async function main() {
  const newVersion = Deno.args[0];
  if (!newVersion) {
    console.error("Usage: deno run -A scripts/version_bump.ts <new_version>");
    Deno.exit(1);
  }

  // Basic semver validation (loose)
  if (!/^\d+\.\d+\.\d+/.test(newVersion)) {
    console.error("Error: Version must be in format x.y.z");
    Deno.exit(1);
  }

  console.log(`Bumping version to: ${newVersion}`);

  try {
    await bumpDeno(newVersion);

    // Root Cargo.toml
    const rootCargo = join(CWD, "Cargo.toml");
    const rootContent = await Deno.readTextFile(rootCargo);
    if (rootContent.includes("[package]")) {
      await bumpCargoFile(rootCargo, newVersion);
    }

    // Workspace members
    // We explicitly exclude swiss-eph-data from automatic bumping
    // because it only needs to update when the ephemeris data changes.
    const members = (await getWorkspaceMembers()).filter((m) =>
      !m.includes("swiss-eph-data")
    );

    for (const member of members) {
      const memberCargo = join(CWD, member, "Cargo.toml");
      await bumpCargoFile(memberCargo, newVersion);
    }

    await updateChangelog(newVersion);

    console.log("Running cargo check to update Cargo.lock...");
    const cargoStatus = await new Deno.Command("cargo", { args: ["check"] })
      .spawn()
      .status;
    if (!cargoStatus.success) {
      console.warn(
        "Warning: 'cargo check' failed. You may need to run it manually.",
      );
    }

    console.log("Updating deno.lock...");
    const denoStatus = await new Deno.Command("deno", {
      args: ["install", "--lockfile-only"],
    }).spawn()
      .status;
    if (!denoStatus.success) {
      console.warn(
        "Warning: updating 'deno.lock' failed.",
      );
    }

    console.log("\n✅ Version bump complete.");
  } catch (error) {
    console.error("\n❌ Error bumping version:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
