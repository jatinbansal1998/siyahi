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

/** The panels' rows, as the distinct tops they sit at, with the grid's column given `rem` wide. */
const rowsAt = (rem: number): Promise<number> =>
  grid.evaluate((el, width) => {
    (el.parentElement as HTMLElement).style.width = width;
    const tops = [...el.querySelectorAll('[data-slot="panel"]')].map((panel) => panel.getBoundingClientRect().top);
    return new Set(tops).size;
  }, `${rem}rem`);

it("lays columns={3} three across in a reading column from 42rem, and one under another below it", async () => {
  expect(await rowsAt(41)).toBe(3);
  for (const rem of [42, 55]) expect(await rowsAt(rem)).toBe(1);
});
