// Scrolls the catalogue's ChangeGrid on a phone in Chromium: whether the row labels stay in view is layout, which
// happy-dom does not compute.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/change-grid");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("ChangeGrid layout", { timeout: 60_000 }, () => {
  it("keeps each row's label in view, over the cells, while a phone scrolls the months", async () => {
    await page.setViewportSize({ width: 390, height: 900 });
    const grid = page.locator('[data-slot="change-grid"]').first();
    const scroller = grid.locator("xpath=..");
    const label = grid.getByRole("rowheader", { name: "FY25" });
    await label.waitFor();
    const edge = (await scroller.boundingBox())!.x;
    const width = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(width).toBeGreaterThan(100);
    await scroller.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    // Scrolled a full table's width, the label still sits at the scroller's left edge, give or take the 2px cell gap.
    await expect.poll(async () => Math.abs((await label.boundingBox())!.x - edge)).toBeLessThanOrEqual(2);
    // The label is painted over the cells sliding under it, not behind them.
    const box = (await label.boundingBox())!;
    const top = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.closest("th")?.textContent,
      [box.x + box.width / 2, box.y + box.height / 2],
    );
    expect(top).toBe("FY25");
  });
});
