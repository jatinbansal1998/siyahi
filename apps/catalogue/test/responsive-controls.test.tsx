import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table", { viewport: { width: 390, height: 844 }, hasTouch: true });
}, 60_000);
afterAll(async () => catalogue?.close());

describe("touch controls", { timeout: 60_000 }, () => {
  it("keeps the compact example search readable on a narrow phone", async () => {
    const { page } = catalogue;
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`${new URL(page.url()).origin}/#/data/data-table`);
    const search = page.getByRole("textbox", { name: "Search orders" });
    await search.waitFor({ state: "visible" });
    await expect.poll(() => search.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(200);
    await search.fill("ORD-1042");
    const table = page.getByRole("region", { name: "Open orders" });
    await expect.poll(() => table.locator("tbody tr").count()).toBe(1);
    expect(await table.textContent()).toContain("ORD-1042");
    await search.fill("");
    await page.setViewportSize({ width: 390, height: 844 });
  });

  it("gives touch controls a finger-sized target without relying on screen width", async () => {
    const sort = catalogue.page.locator('#data-table th[data-col-id="revenue"] button').first();
    await sort.waitFor();
    expect((await sort.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  });

  it("keeps composed sheet controls finger-sized when their slot changes", async () => {
    const { page } = catalogue;
    await page.goto(`${new URL(page.url()).origin}/#/inputs/sheet`);
    // The page before, the data table at phone width, has a Filters sheet of its own and stays up until the route
    // swaps; a click on its button opened that sheet, which the swap then took away. Wait for the Sheet page itself.
    await page.getByRole("heading", { level: 1, name: "Sheet", exact: true }).waitFor();
    const filters = page.getByRole("button", { name: "Filters", exact: true });
    await filters.waitFor({ state: "visible" });
    await expect.poll(() => filters.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await filters.click();
    const done = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
    await done.waitFor({ state: "visible" });
    // The sheet scales in; measure the button at rest, not partway through the opening animation.
    await page
      .getByRole("dialog")
      // A cancelled animation rejects its finished promise; it has ended all the same.
      .evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined))),
      );
    expect(await done.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await done.click();
  });
});
