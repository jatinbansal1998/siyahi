// Reads the catalogue's data table in Chromium, in dark mode, where the card and the page differ most: a toned row's
// wash comes from the theme's CSS, which happy-dom does not apply, and a pinned cell paints an opaque fill of its own
// over the row's.
import type { Locator } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let card: Locator;
let row: Locator;

beforeAll(async () => {
  catalogue = await openCatalogue("data/data-table", { colorScheme: "dark" });
  card = catalogue.page.locator('#data-table [data-slot="example"] [data-slot="card"]').first();
  row = card.locator('tbody tr[data-tone="warning"]');
}, 60_000);

afterAll(async () => catalogue?.close());

const wash = (): Promise<string> => row.evaluate((el) => getComputedStyle(el).backgroundColor);

/** The pinned cell's position, its opaque fill and the layer it paints over that fill. */
const pinned = (cells: Locator): Promise<[string, string, string]> =>
  cells.locator("td[data-pinned]").evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.position, style.backgroundColor, style.backgroundImage];
  });

describe("a toned data table row", { timeout: 60_000 }, () => {
  it("washes its pinned cell as it washes the row, over the page's colour, at rest and under the pointer", async () => {
    // On the open default the card has no fill, so the pinned cells and the sticky header paint the page.
    expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
    const page = await themeColor(catalogue.page, "--background");
    const rest = await wash();
    expect(rest).not.toBe("rgba(0, 0, 0, 0)");
    expect(await pinned(row)).toEqual(["sticky", page, `linear-gradient(${rest}, ${rest})`]);
    expect((await pinned(card.locator("tbody tr:not([data-tone])").first()))[1]).toBe(page);
    expect(await card.locator("thead").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(page);
    // The wash outranks the hover band, as on a plain TableRow, on the pinned cell too.
    await row.hover();
    expect(await wash()).toBe(rest);
    expect(await pinned(row)).toEqual(["sticky", page, `linear-gradient(${rest}, ${rest})`]);
  });

  it("paints the pinned cells in the card's colour on a card surface, whose cards are filled", async () => {
    // As a SiyahiProvider surface="card" around the card would write it; the theme reads the attribute.
    await card.evaluate((el) => el.parentElement?.setAttribute("data-surface", "card"));
    const fill = await themeColor(catalogue.page, "--card");
    expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(fill);
    expect((await pinned(card.locator("tbody tr:not([data-tone])").first()))[1]).toBe(fill);
  });
});
