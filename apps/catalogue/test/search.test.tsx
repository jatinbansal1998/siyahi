import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("overview");
}, 60_000);

afterAll(async () => catalogue?.close());

describe("catalogue search", () => {
  it("opens on Ctrl+K and goes to the section picked by name", async () => {
    const { page } = catalogue;
    await page.keyboard.press("Control+k");
    const input = page.getByPlaceholder("Find a component, chart or rule…");
    await input.waitFor();
    await input.fill("treemap");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#/data/treemap");
    await expect.poll(() => input.count()).toBe(0);
  }, 30_000);
});
