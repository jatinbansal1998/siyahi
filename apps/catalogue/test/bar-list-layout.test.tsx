import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
beforeAll(async () => {
  catalogue = await openCatalogue("data/ranked-list", { viewport: { width: 390, height: 844 }, hasTouch: true });
}, 60_000);
afterAll(async () => catalogue?.close());

describe("narrow ranked labels", () => {
  it("keeps full ranked labels above their bars without clipping or shrinking them", async () => {
    const card = catalogue.page.locator('[data-slot="card"]').filter({ hasText: "Needs attention" });
    const row = card.locator('[data-slot="bar-list-row"]').last();
    await row.scrollIntoViewIfNeeded();
    const label = row.getByText("Asian Paints (India)", { exact: true });
    const shape = await label.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
      clipped: el.scrollWidth > el.clientWidth,
    }));
    expect(shape.height).toBeGreaterThan(shape.lineHeight);
    expect(shape.clipped).toBe(false);
    const bar = await row.locator('div[aria-hidden="true"]').boundingBox();
    const text = await label.boundingBox();
    expect(bar?.y).toBeGreaterThanOrEqual((text?.y ?? 0) + (text?.height ?? 0));
  });
});
