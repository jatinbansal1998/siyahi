// How wide a table is against its block, and how tall its rows: laid out only by a real browser.
import type { Locator } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;

beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table", { viewport: { width: 1440, height: 900 } });
}, 60_000);

afterAll(async () => catalogue?.close());

const exampleCard = (file: string): Locator =>
  catalogue.page
    .locator('[data-slot="example"]', { hasText: `examples/${file}.tsx` })
    .locator('[data-slot="card"]')
    .first();

const widths = (card: Locator) =>
  card.evaluate((el) => {
    const table = el.querySelector('[data-slot="table"]')!;
    return {
      block: el.querySelector('[data-slot="card-content"]')!.clientWidth,
      box: table.parentElement!.getBoundingClientRect().width,
      table: table.getBoundingClientRect().width,
    };
  });

describe("table width", () => {
  it("is as wide as its columns, inside a box that hugs it", async () => {
    const { block, box, table } = await widths(exampleCard("data-table"));
    expect(table).toBeLessThan(block * 0.8);
    // The data table's box draws a 1px frame each side.
    expect(box - table).toBeLessThanOrEqual(2);
  });

  it("keeps a row count by the controls it counts, not at the toolbar's far end", async () => {
    const card = exampleCard("data-table-filters");
    await card.getByRole("textbox", { name: "Search orders" }).waitFor();
    const { gap, room } = await card.evaluate((el) => {
      const count = el.querySelector('[data-slot="data-table-row-count"]')!;
      const before = count.previousElementSibling!.getBoundingClientRect();
      const toolbar = count.parentElement!.getBoundingClientRect();
      return { gap: count.getBoundingClientRect().left - before.right, room: toolbar.right - before.right };
    });
    // The toolbar has room to push it far away; it sits one toolbar gap after the last control instead.
    expect(room).toBeGreaterThan(200);
    expect(gap).toBeLessThanOrEqual(16);
  });

  it("fills its block where the page sets --table-width: 100%", async () => {
    const card = exampleCard("data-table");
    await card.evaluate((el) => el.style.setProperty("--table-width", "100%"));
    const { block, box, table } = await widths(card);
    await card.evaluate((el) => el.style.removeProperty("--table-width"));
    expect(box).toBe(block);
    expect(box - table).toBeLessThanOrEqual(2);
  });

  it("keeps a short table's wide-screen toolbar: it measures its block, not its own width", async () => {
    const card = exampleCard("data-table-filters");
    await card.getByRole("textbox", { name: "Search orders" }).waitFor();
    // Under 40rem of room the filters fold into one Filters button, as on a phone.
    expect(await card.getByRole("button", { name: "Filters" }).count()).toBe(0);
  });
});

it("keeps every Holdings row on the overview one line tall", async () => {
  const overview = await openCatalogue("", { viewport: { width: 1440, height: 900 } });
  try {
    const { page } = overview;
    const rows = page
      .locator('[data-slot="card"]', { has: page.getByText("Value today and change over twelve months") })
      .locator('[data-slot="table-body"] > [data-slot="table-row"]');
    await expect.poll(() => rows.count()).toBe(5);
    const heights = await rows.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
    // The last row draws no bottom hairline.
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  } finally {
    await overview.close();
  }
}, 60_000);
