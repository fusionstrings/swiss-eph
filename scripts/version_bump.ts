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

async function bumpCargo(version: string) {
  const path = join(CWD, "crate/Cargo.toml");
  let content = await Deno.readTextFile(path);
  // Match `version = "x.y.z"`
  // Use regex that catches the first version = "..."
  content = content.replace(/version = ".*?"/, `version = "${version}"`);
  await Deno.writeTextFile(path, content);
  console.log(`Updated crate/Cargo.toml to ${version}`);
}

async function updateChangelog(version: string) {
  const path = join(CWD, "CHANGELOG.md");
  let content = await Deno.readTextFile(path);
  const date = new Date().toISOString().split("T")[0];

  if (!content.includes(`## [${version}]`)) {
    const newEntry =
      `## [${version}] - ${date}\n\n### Changed\n- Version bump.\n\n`;
    content = content.replace(
      "## [Unreleased]",
      `## [Unreleased]\n\n${newEntry}`,
    );
    // If no Unreleased section, add after header
    if (!content.includes("## [Unreleased]")) {
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
    await bumpCargo(newVersion);
    await updateChangelog(newVersion);
    console.log("\n✅ Version bump complete.");
    console.log("Run 'deno task build:npm' to verify new metadata.");
  } catch (error) {
    console.error("\n❌ Error bumping version:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
