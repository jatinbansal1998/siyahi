// Reads the catalogue's ChangeBar example in Chromium: the footnote's width follows the table's scroll container,
// which happy-dom does not lay out.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/change-bar", { viewport: { width: 390, height: 900 } });
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("DataTableFootnote", { timeout: 60_000 }, () => {
  it("spans every column and stays at the card's width while a wide table scrolls under it", async () => {
    await page.getByRole("button", { name: /All columns/ }).click();
    const container = page.getByRole("region", { name: "February against January" });
    const sizes = () =>
      container.evaluate((box) => {
        const note = box.querySelector<HTMLElement>('[data-slot="data-table-footnote"] p')!;
        const cell = note.parentElement as HTMLTableCellElement;
        return {
          scrolls: box.scrollWidth > box.clientWidth,
          span: cell.colSpan,
          columns: box.querySelectorAll("thead th").length,
          note: note.getBoundingClientRect().width,
          viewport: box.clientWidth,
        };
      });
    await expect.poll(async () => (await sizes()).columns, { timeout: 5000 }).toBe(4);
    const before = await sizes();
    expect(before.scrolls).toBe(true);
    expect(before.span).toBe(before.columns);
    expect(before.note).toBeLessThanOrEqual(before.viewport);

    // Scrolled to the far end, the note is still in view: it sits at the container's left edge.
    await container.evaluate((box) => box.scrollTo({ left: box.scrollWidth }));
    const offset = await container.evaluate((box) => {
      const note = box.querySelector('[data-slot="data-table-footnote"] p')!;
      return note.getBoundingClientRect().left - box.getBoundingClientRect().left;
    });
    expect(Math.abs(offset)).toBeLessThanOrEqual(2);
  });
});
