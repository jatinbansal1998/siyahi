import { chromium, type Browser, type BrowserContextOptions, type Locator, type Page } from "playwright";

/** The catalogue in Chromium, for what happy-dom cannot do: layout, hover and the theme's CSS. */
export interface Catalogue {
  page: Page;
  /** Closes the browser, then fails if the page threw or logged a console error while it was open. */
  close(): Promise<void>;
}

/** Opens one of the catalogue's pages, `#/<route>`, at 1280 by 900, from the server serve-catalogue.ts started. */
export async function openCatalogue(route: string, options: BrowserContextOptions = {}): Promise<Catalogue> {
  const url = process.env.SIYAHI_CATALOGUE_URL;
  if (!url) throw new Error("no catalogue server: the run's globalSetup (serve-catalogue.ts) did not start");
  const browser: Browser = await chromium.launch();
  const errors: string[] = [];
  const close = async () => {
    await browser.close();
    if (errors.length) throw new Error(`#/${route} had browser errors:\n${errors.join("\n")}`);
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
    page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console error: ${message.text()}`);
    });
    // The heading is what a suite waits for; the load event also waits on every font and module a cold server is
    // still compiling, which on a busy machine took past goto's 30s (#110).
    await page.goto(`${url}#/${route}`, { waitUntil: "commit" });
    // The page's own masthead; an example of a whole page may hold a masthead of its own.
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    // The title shows before the examples; a suite starts once the page's examples have loaded.
    await page.getByRole("status").filter({ hasText: "Loading examples" }).waitFor({ state: "detached" });
    return { page, close };
  } catch (error) {
    // The failure that stopped the page matters more than anything it logged on the way.
    await browser.close();
    throw error;
  }
}

/** A theme colour as the browser resolves it, to compare with a computed background. */
export function themeColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.backgroundColor = `var(${name})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}

/**
 * Waits until a chart has drawn at its box's width in the page's loaded fonts, with `drawn` inside it. Under load a
 * resize or a new pick takes a second or more to land, so a poll with a clock of its own ran out first (#110). The
 * chart draws again once a font load finishes; two frames let that land.
 */
export async function chartDrawn(chart: Locator, drawn: string): Promise<void> {
  await chart.page().waitForFunction(
    ([box, selector]) => {
      const plot = box?.querySelector('[data-slot="chart"]');
      return (
        document.fonts.status === "loaded" &&
        plot != null &&
        plot.querySelector("svg.recharts-surface")?.getAttribute("width") === String(plot.clientWidth) &&
        box?.querySelector(selector) !== null
      );
    },
    [await chart.elementHandle(), drawn] as const,
  );
  await chart.page().evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}
