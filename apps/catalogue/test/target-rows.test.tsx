// Reads the catalogue's TargetRows example in Chromium: the row layout follows a container query, which happy-dom
// does not compute.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/target-rows");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The first row's label and track boxes. */
async function firstRow(): Promise<{ label: DOMRect; track: DOMRect }> {
  return page
    .locator('[data-slot="target-row"]')
    .first()
    .evaluate((row) => ({
      label: row.children[0]!.getBoundingClientRect().toJSON() as DOMRect,
      track: row.children[1]!.getBoundingClientRect().toJSON() as DOMRect,
    }));
}

describe("TargetRows layout", { timeout: 60_000 }, () => {
  it("sets the label beside the track on a wide card and above it on a phone", async () => {
    const wide = await firstRow();
    expect(wide.track.left).toBeGreaterThanOrEqual(wide.label.right);

    await page.setViewportSize({ width: 390, height: 900 });
    await expect.poll(async () => (await firstRow()).track.top, { timeout: 5000 }).toBeGreaterThan(wide.track.top);
    const narrow = await firstRow();
    expect(narrow.track.top).toBeGreaterThanOrEqual(narrow.label.bottom);
    expect(narrow.track.width).toBeGreaterThan(narrow.label.width * 0.9);
    // The track keeps its height when stacked, not just its width.
    expect(narrow.track.height).toBe(wide.track.height);
  });

  it("writes every label and detail in full on a phone, wrapping rather than cutting", async () => {
    await page.setViewportSize({ width: 390, height: 900 });
    const cut = await page
      .locator('[data-slot="target-row"] *')
      .evaluateAll((parts) =>
        parts.filter((part) => part.scrollWidth > part.clientWidth).map((part) => part.textContent),
      );
    expect(cut).toEqual([]);

    // A word longer than the column wraps too, rather than pushing the target past the row's edge.
    const overrun = await page
      .locator('[data-slot="target-row"]')
      .first()
      .evaluate((row) => {
        const [detail, target] = row.children[0]!.children[1]!.children;
        detail!.textContent = "Cloudhostingtoolscontractorsandsupportsubscriptions";
        return target!.getBoundingClientRect().right - row.getBoundingClientRect().right;
      });
    expect(overrun).toBeLessThanOrEqual(0);
  });
});
