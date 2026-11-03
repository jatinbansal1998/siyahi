import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table", { viewport: { width: 390, height: 844 }, hasTouch: true });
}, 60_000);
afterAll(async () => catalogue?.close());

describe("touch controls", () => {
  it("gives touch controls a finger-sized target without relying on screen width", async () => {
    const sort = catalogue.page.locator('#data-table th[data-col-id="value"] button');
    await sort.waitFor();
    expect((await sort.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  });

  it("keeps composed sheet controls finger-sized when their slot changes", async () => {
    const { page } = catalogue;
    await page.goto(`${new URL(page.url()).origin}/#/inputs/sheet`);
    const filters = page.getByRole("button", { name: "Filters", exact: true });
    await filters.waitFor({ state: "visible" });
    expect((await filters.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await filters.click();
    const done = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
    await done.waitFor({ state: "visible" });
    expect((await done.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await done.click();
  });
});
