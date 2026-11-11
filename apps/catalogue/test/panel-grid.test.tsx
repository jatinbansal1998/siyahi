// Where a PanelGrid steps up to its columns: container queries are laid out only by a real browser.
import type { Locator } from "playwright";
import { afterAll, beforeAll, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let grid: Locator;

beforeAll(async () => {
  catalogue = await openCatalogue("data/chart-panels", { viewport: { width: 1366, height: 900 } });
  grid = catalogue.page
    .locator('[data-slot="example"]', { hasText: "examples/chart-panels-three.tsx" })
    .locator('[data-slot="panel-grid"]');
  await grid.waitFor();
}, 60_000);

afterAll(async () => catalogue?.close());

/**
 * How many rows the panels sit in, as distinct tops, with the grid's column set to each width in turn. One call reads
 * them all: reading a box forces the layout, container queries included, before the charts can redraw for the width.
 */
const rowsAt = (rems: number[]): Promise<number[]> =>
  grid.evaluate((el, widths) => {
    const column = el.parentElement as HTMLElement;
    return widths.map((rem) => {
      column.style.width = `${rem}rem`;
      const tops = [...el.querySelectorAll('[data-slot="panel"]')].map((panel) => panel.getBoundingClientRect().top);
      return new Set(tops).size;
    });
  }, rems);

it("lays columns={3} three across in a reading column from 42rem, and one under another below it", async () => {
  expect(await rowsAt([41, 42, 55])).toEqual([3, 1, 1]);
});
