import { exists } from "@std/fs";
import { join } from "@std/path";

export interface SweFunctionArg {
  type: string;
  name: string;
}

export interface SweFunction {
  returnType: string;
  name: string;
  args: SweFunctionArg[];
}

export interface SweConstants {
  [key: string]: string;
}

export interface SweMetadata {
  constants: SweConstants;
  functions: SweFunction[];
}

export async function parseMetadata(
  headerPath: string,
  defPath: string,
): Promise<SweMetadata> {
  const tryPaths = async (p: string) => {
    if (await exists(p)) return p;
    const alt = join("crates/swiss-eph", p);
    if (await exists(alt)) return alt;
    throw new Error(`Path not found: ${p} (also tried ${alt})`);
  };

  const actualHeaderPath = await tryPaths(headerPath);
  const actualDefPath = await tryPaths(defPath);

  const content = await Deno.readTextFile(actualHeaderPath);
  const defContent = await Deno.readTextFile(actualDefPath);
  const fullContent = content + "\n" + defContent;

  const defineRegex = /#\s*define\s+(\w+)\s+(.+)/g;
  const extDefRegex = /ext_def\s*\(\s*([^)]+)\s*\)\s*(\w+)\s*\(([^;]+)\)\s*;/g;

  const constants: SweConstants = {};
  const functions: SweFunction[] = [];

  // Parse Constants
  let match;
  while ((match = defineRegex.exec(fullContent)) !== null) {
    const key = match[1];
    let value = match[2].trim();

    const commentStart = value.indexOf("/*");
    if (commentStart !== -1) {
      const quoteCount =
        (value.substring(0, commentStart).match(/"/g) || []).length;
      if (quoteCount % 2 === 0) {
        value = value.substring(0, commentStart).trim();
      }
    }
    const lineComment = value.indexOf("//");
    if (lineComment !== -1) {
      const quoteCount =
        (value.substring(0, lineComment).match(/"/g) || []).length;
      if (quoteCount % 2 === 0) {
        value = value.substring(0, lineComment).trim();
      }
    }

    // Remove wrapping parentheses if present, e.g. (-1) or (0)
    if (value.startsWith("(") && value.endsWith(")")) {
      value = value.substring(1, value.length - 1).trim();
    }

    constants[key] = value;
  }

  // Parse Functions
  while ((match = extDefRegex.exec(content)) !== null) {
    const returnType = match[1].trim();
    const name = match[2].trim();
    const argsRaw = match[3].trim();

    const args = argsRaw.split(",").map((arg) => {
      arg = arg.trim();
      const lastSpace = arg.lastIndexOf(" ");
      if (lastSpace === -1) return { type: arg, name: "" };
      let type = arg.substring(0, lastSpace).replace(/\*/g, "").trim();
      if (arg.includes("*")) type += "*";

      let paramName = arg.substring(lastSpace + 1).replace(/\*/g, "").trim();

      if (paramName.includes("[")) {
        paramName = paramName.split("[")[0];
        type += "[]";
      }
      return { type, name: paramName };
    });

    functions.push({ returnType, name, args });
  }

  return { constants, functions };
}
