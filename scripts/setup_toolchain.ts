import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";

const WASI_SDK_VERSION = 24;
const WASI_SDK_MINOR = 0;

async function installWasiSdk() {
  const os = Deno.build.os;
  let platform = "";
  if (os === "darwin") platform = "macos";
  else if (os === "linux") platform = "linux";
  else {
    console.error(
      "Unsupported OS for auto-setup. Please install wasi-sdk manually.",
    );
    Deno.exit(1);
  }

  const command = new Deno.Command("uname", { args: ["-m"] });
  const { stdout } = await command.output();
  const arch = new TextDecoder().decode(stdout).trim();

  const sdkName =
    `wasi-sdk-${WASI_SDK_VERSION}.${WASI_SDK_MINOR}-${arch}-${platform}`;
  const tarName = `${sdkName}.tar.gz`;
  const url =
    `https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_SDK_VERSION}/${tarName}`;
  const toolchainDir = join(Deno.cwd(), "toolchain");
  const sdkPath = join(
    toolchainDir,
    `wasi-sdk-${WASI_SDK_VERSION}.${WASI_SDK_MINOR}`,
  );

  await ensureDir(toolchainDir);

  if (await exists(sdkPath)) {
    console.log(`wasi-sdk ${WASI_SDK_VERSION} already installed at ${sdkPath}`);
    return;
  }

  console.log(`Downloading ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download wasi-sdk: ${response.statusText}`);
    Deno.exit(1);
  }

  const tarPath = join(toolchainDir, tarName);
  await Deno.writeFile(tarPath, new Uint8Array(await response.arrayBuffer()));

  console.log(`Extracting ${tarName}...`);
  const p = new Deno.Command("tar", {
    args: ["xzf", tarName],
    cwd: toolchainDir,
  });
  const output = await p.output();
  if (!output.success) {
    console.error("Failed to extract wasi-sdk");
    Deno.exit(1);
  }

  // Rename extracted directory to the generic name expected by Makefile
  const extractedDir = join(toolchainDir, sdkName);
  await Deno.rename(extractedDir, sdkPath);

  await Deno.remove(tarPath);
  console.log("wasi-sdk installed successfully.");
}

async function ensureVendorSymlink() {
  const symlinkPath = join(Deno.cwd(), "vendor/swisseph");
  const targetPath = join(Deno.cwd(), "crates/swiss-eph/vendor/swisseph");

  if (!(await exists(symlinkPath))) {
    console.log(`Creating symlink: ${symlinkPath} -> ${targetPath}`);
    await ensureDir(join(Deno.cwd(), "vendor"));
    await Deno.symlink(targetPath, symlinkPath);
  } else {
    console.log(`Symlink already exists at ${symlinkPath}`);
  }
}

if (import.meta.main) {
  await installWasiSdk();
  await ensureVendorSymlink();
}
