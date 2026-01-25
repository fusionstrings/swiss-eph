# Examples

This directory contains verified, executable examples for every supported
platform and configuration.

> [!IMPORTANT]
> These examples assume you have the `@fusionstrings/swiss-eph` package
> installed. If running locally from the repository, ensure you have built the
> project: `deno task build`.

## 📂 Directory Structure

- **[deno/](./deno/)**: Deno examples (TypeScript)
- **[node/](./node/)**: Node.js examples (ESM)
- **[browser/](./browser/)**: Browser examples (HTML/ESM)
- **[worker/](./worker/)**: Cloudflare Worker examples (TypeScript)

## 🚀 Running the Examples

### Deno

Run any Deno example directly from the root:

```bash
deno run -A examples/deno/wasmbuild_js_api_moshier.ts
```

### Node.js

Run any Node example (ensure `node_modules` are installed):

```bash
node examples/node/wasmbuild_js_api_moshier.mjs
```

### Browser

To test browser examples, start a local development server and navigate to the
`.html` file:

```bash
npx serve examples/browser/
```

### Cloudflare Workers

For worker examples, we recommend using `wrangler`:

```bash
npx wrangler dev examples/worker/wasmbuild_inline_moshier.ts
```

---

👉 **For a full integration matrix and choosing the right build for your
project, see [EXAMPLES.md](../EXAMPLES.md).**
