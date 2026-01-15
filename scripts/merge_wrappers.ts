import { join } from "@std/path";

const MOD_PATH = "mod.ts";
const WRAPPERS_PATH = "bindings/generated_wrappers.ts";

async function merge() {
  const modContent = await Deno.readTextFile(MOD_PATH);
  const wrapperContent = await Deno.readTextFile(WRAPPERS_PATH);

  // Extract existing function names from mod.ts
  const existingFuncs = new Set<string>();
  const modLines = modContent.split("\n");
  for (const line of modLines) {
    const match = line.match(/^\s*public\s+([a-zA-Z0-9_]+)\(/) ||
      line.match(/^\s*([a-zA-Z0-9_]+)\(/);
    if (match) {
      existingFuncs.add(match[1]);
    }
  }

  // Parse wrappers
  const newMethods: string[] = [];
  const wrapperLines = wrapperContent.split("\n");
  let currentMethod: string[] = [];
  let currentMethodName = "";
  let capturing = false;

  for (let i = 0; i < wrapperLines.length; i++) {
    const line = wrapperLines[i];

    // Start of a method (heuristic: starts with "  swe_")
    const match = line.match(/^\s+(swe_[a-zA-Z0-9_]+)\(/);

    // Also catch the JSDoc comment preceding it
    if (line.trim().startsWith("/**")) {
      // Look ahead for name
      let j = i + 1;
      let nameFound = "";
      while (j < wrapperLines.length && j < i + 5) {
        const m = wrapperLines[j].match(/^\s+(swe_[a-zA-Z0-9_]+)\(/);
        if (m) {
          nameFound = m[1];
          break;
        }
        j++;
      }

      if (nameFound && !existingFuncs.has(nameFound)) {
        capturing = true;
        currentMethodName = nameFound;
        currentMethod = [];
        currentMethod.push(line);
        continue;
      } else {
        capturing = false;
      }
    }

    if (capturing) {
      currentMethod.push(line);
      if (line.trim() === "}") {
        // End of method
        newMethods.push(currentMethod.join("\n"));
        capturing = false;
        console.log(`Adding ${currentMethodName}`);
      }
    }
  }

  if (newMethods.length === 0) {
    console.log("No new methods to add.");
    return;
  }

  // Insert AFTER the close() method implementation
  // Find "close() {" and the closing brace after it
  // We look for the exact string pattern of the close method
  const closeMethodStart = modContent.indexOf("  close() {");
  if (closeMethodStart === -1) {
    console.error("Could not find close() method in mod.ts");
    return;
  }

  const closeMethodEnd = modContent.indexOf("  }", closeMethodStart);
  if (closeMethodEnd === -1) {
    console.error("Could not find end of close() method in mod.ts");
    return;
  }

  // Insert after the closing brace of close() (length of "  }" is 3)
  const splitIndex = closeMethodEnd + 3;

  const newContent = modContent.substring(0, splitIndex) +
    "\n\n  // --- Auto-generated Properties (Missing in Audit) ---\n" +
    newMethods.join("\n\n") +
    modContent.substring(splitIndex);

  await Deno.writeTextFile(MOD_PATH, newContent);
  console.log(`Added ${newMethods.length} methods to ${MOD_PATH}`);
}

if (import.meta.main) {
  await merge();
}
