// The catalogue's shell in Chromium: the collapsed sidebar and an example's
// frame are matters of layout, which happy-dom does not compute.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  // Overview, not Data: collapsing the sidebar over Data's charts blocks the page for up to half a second a frame,
  // long enough to starve a check run beside other browsers.
  catalogue = await openCatalogue("overview");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("catalogue shell", { timeout: 60_000 }, () => {
  it("shows each page's icon, and no cut-off title, when the sidebar collapses", async () => {
    await page.locator('[data-slot="sidebar-trigger"]').click();
    const sidebar = page.locator('[data-slot="sidebar"][data-collapsible="icon"]');
    await sidebar.waitFor();
    const buttons = sidebar.locator('[data-slot="sidebar-group"] [data-sidebar="menu-button"]');
    await expect.poll(() => buttons.count()).toBe(8);
    // The page's icon comes first; every item with sections also ends in a chevron, which is not the icon.
    const icons = await buttons.evaluateAll((els) => els.map((el) => el.firstElementChild?.tagName === "svg"));
    expect(icons).toEqual(Array.from({ length: 8 }, () => true));
    await page.locator('[data-slot="sidebar-trigger"]').click();
  });

  it("fits an example's frame to its example, not to the code beside it", async () => {
    await page.evaluate(() => (location.hash = "#/data/ranked-list"));
    await page.locator('#ranked-list [data-slot="card"]').first().waitFor();
    const frame = page
      .locator("#ranked-list > div")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();
    const sizes = await frame.evaluate((el) => {
      const pane = el.firstElementChild as HTMLElement;
      const card = pane.querySelector('[data-slot="card"]') as HTMLElement;
      const { paddingTop, paddingBottom, borderTopWidth, borderBottomWidth } = getComputedStyle(pane);
      const chrome = [paddingTop, paddingBottom, borderTopWidth, borderBottomWidth].map(parseFloat);
      return {
        pane: pane.getBoundingClientRect().height,
        content: card.getBoundingClientRect().height + chrome.reduce((a, b) => a + b),
      };
    });
    expect(sizes.pane).toBeCloseTo(sizes.content, 0);
  });
});
