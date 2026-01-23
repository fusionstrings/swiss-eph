# Examples

This directory contains executable examples for every supported configuration.

👉 **Please see [EXAMPLES.md](../EXAMPLES.md) in the root directory for the full
integration matrix and guide.**

## Directory Structure

- **[deno/](./deno/)**: Deno examples (TS)
- **[node/](./node/)**: Node.js examples (ESM)
- **[browser/](./browser/)**: Browser examples (HTML/ESM)
- **[worker/](./worker/)**: Cloudflare Worker examples (TS)

## Running the Examples

### Deno

```bash
deno run -A deno/wasmbuild_js_api_moshier.ts
```

### Node

```bash
node node/wasmbuild_js_api_moshier.mjs
```

### Browser

Open any `.html` file in your browser (may require a local server for Wasm
fetch).

```bash
npx serve browser/
```
