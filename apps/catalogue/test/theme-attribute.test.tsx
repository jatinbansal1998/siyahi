import { describe, expect, it, onTestFinished } from "vite-plus/test";
import type { Page } from "playwright";
import { openCatalogue } from "./catalogue";

type Scheme = "light" | "dark";

const OPPOSITE: Record<Scheme, Scheme> = { light: "dark", dark: "light" };

/** The page on a device in the other scheme, told by `data-theme` to use this one. */
async function openOverridden(route: string, theme: Scheme) {
  const catalogue = await openCatalogue(route, { colorScheme: OPPOSITE[theme] });
  await catalogue.page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  return catalogue;
}

/** The canvas colour and the scheme native controls take. */
function look(page: Page): Promise<{ background: string; colorScheme: string }> {
  return page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }));
}

/** Every canvas a Lightweight Charts chart draws, as pixels, once its fonts have loaded. */
async function chartPixels(page: Page, slot: string): Promise<string> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page
    .locator(`[data-slot="${slot}"] canvas`)
    .evaluateAll((canvases) => canvases.map((canvas) => (canvas as HTMLCanvasElement).toDataURL()).join());
}

// A host that frames the page, such as a Claude artifact, names the scheme on <html>; the device's setting loses.
describe("data-theme on <html>", { timeout: 60_000 }, () => {
  it.each<Scheme>(["light", "dark"])("data-theme=%s looks as that scheme does on the device", async (theme) => {
    const device = await openCatalogue("overview", { colorScheme: theme });
    onTestFinished(device.close);
    const overridden = await openOverridden("overview", theme);
    onTestFinished(overridden.close);
    const overriddenLook = await look(overridden.page);
    expect(overriddenLook.colorScheme).toBe(theme);
    expect(overriddenLook).toEqual(await look(device.page));
  });

  it("redraws the time-series-chart in the attribute's scheme", async () => {
    const slot = "time-series-chart";
    const device = await openCatalogue(`data/${slot}`, { colorScheme: "dark" });
    onTestFinished(device.close);
    const overridden = await openOverridden(`data/${slot}`, "dark");
    onTestFinished(overridden.close);
    // The page's charts draw over several frames, each page at its own pace; once both have drawn, they must match.
    const charts = (page: Page) => page.locator(`[data-slot="${slot}"] table`).count();
    await expect.poll(() => charts(device.page), { timeout: 30_000 }).toBe(5);
    await expect.poll(() => charts(overridden.page), { timeout: 30_000 }).toBe(5);
    await expect
      .poll(async () => (await chartPixels(overridden.page, slot)) === (await chartPixels(device.page, slot)))
      .toBe(true);
  });
});
