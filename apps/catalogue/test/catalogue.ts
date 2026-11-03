import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type BrowserContextOptions, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** The catalogue in Chromium, for what happy-dom cannot do: layout, hover and the theme's CSS. */
export interface Catalogue {
  page: Page;
  close(): Promise<void>;
}

/** Serves the catalogue from source and opens one of its pages, `#/<route>`, at 1280 by 900. */
export async function openCatalogue(route: string, options: BrowserContextOptions = {}): Promise<Catalogue> {
  // Each suite runs its own optimizer; sharing a cache lets one replace another's live dependency files.
  const cacheDir = await mkdtemp(join(tmpdir(), "siyahi-catalogue-"));
  let server: ViteDevServer | undefined;
  let browser: Browser | undefined;
  async function close(): Promise<void> {
    try {
      await browser?.close();
    } finally {
      try {
        await server?.close();
      } finally {
        await rm(cacheDir, { recursive: true, force: true });
      }
    }
  }

  try {
    server = await createServer({
      cacheDir,
      configFile: at("../vite.config.ts"),
      root: at(".."),
      logLevel: "error",
      server: { port: 0 },
      // The package from source, as the other tests use it, so no build is needed.
      resolve: {
        alias: [
          { find: /^@siyahi\/ui$/, replacement: at("../../../packages/ui/src/index.ts") },
          { find: /^@siyahi\/ui\/styles\.css$/, replacement: at("./from-source.css") },
          { find: /^@siyahi\/ui\/report\.css/, replacement: at("../../../packages/ui/report.css") },
          { find: /^@siyahi\/ui\/(.*)$/, replacement: at("../../../packages/ui/src/$1") },
        ],
      },
    });
    await server.listen();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
    await page.goto(`${server.resolvedUrls?.local[0]}#/${route}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    return { page, close };
  } catch (error) {
    await close();
    throw error;
  }
}
