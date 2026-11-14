// Reads the catalogue's Surfaces example in Chromium: how a card looks comes from the theme's CSS, which happy-dom
// does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("foundations/surfaces");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const example = (): Locator => page.locator('#surfaces [data-slot="example-preview"]');

interface Box {
  fill: string;
  corner: string;
  ring: string;
  padding: string;
  rules: string[];
}

/** How a card is drawn: its fill, corner, ring, padding and the rules on its four edges. */
const box = (card: Locator): Promise<Box> =>
  card.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fill: style.backgroundColor,
      corner: style.borderTopLeftRadius,
      ring: style.boxShadow,
      padding: style.paddingTop,
      rules: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
    };
  });

async function pick(surface: "Open" | "Card"): Promise<void> {
  await example().getByRole("button", { name: surface, exact: true }).click();
}

const NONE = "rgba(0, 0, 0, 0)";
const NO_RULES = ["0px", "0px", "0px", "0px"];
const transparentRing = (ring: string) => ring === "none" || /rgba\(0, 0, 0, 0\) 0px 0px 0px 1px/.test(ring);
const token = (name: string): Promise<string> => themeColor(page, name);
const products = (): Locator => example().locator('[data-slot="card"]', { hasText: "Top products" });

describe("surfaces", { timeout: 60_000 }, () => {
  it("opens on open, the default: no fill, ring, padding or rule on any block, and space between the panels", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    // The example sets the provider to the toggle's state, which starts on the default.
    expect(await example().getByRole("button", { name: "Open", exact: true }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    const cards = example().locator('[data-slot="card"]');
    await expect.poll(() => cards.count()).toBe(3);
    for (const drawn of await Promise.all((await cards.all()).map(box))) {
      expect({ fill: drawn.fill, padding: drawn.padding, rules: drawn.rules }).toEqual({
        fill: NONE,
        padding: "0px",
        rules: NO_RULES,
      });
      expect(transparentRing(drawn.ring)).toBe(true);
    }
    const grid = example().locator('[data-slot="panel-grid"]');
    expect(await box(grid)).toMatchObject({ rules: NO_RULES });
    const gap = await grid
      .locator(":scope > div")
      .evaluate((el) => [getComputedStyle(el).columnGap, getComputedStyle(el).rowGap]);
    expect(gap).toEqual(["24px", "16px"]);
  });

  it("names the page colour --card inside an open card, so its marks' halos and tints match the canvas", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    const inside = await products().evaluate((el) => {
      const probe = el.appendChild(document.createElement("div"));
      probe.style.backgroundColor = "var(--card)";
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    expect(inside).toBe(await token("--background"));
  });

  it("fills a card provider nested in an open card with the theme's card colour, not the page's", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    // <Card><SiyahiProvider surface="card"><Card /></SiyahiProvider></Card>, as the provider and the cards write it.
    const inner = await products().evaluate((open) => {
      const provider = open.appendChild(document.createElement("div"));
      provider.dataset.surface = "card";
      const card = provider.appendChild(document.createElement("div"));
      card.dataset.slot = "card";
      card.className = "bg-card";
      const fill = getComputedStyle(card).backgroundColor;
      provider.remove();
      return fill;
    });
    expect(inner).toBe(await token("--card"));
  });

  it("draws tight square cards on a card surface, filled inside a hairline, 8px apart", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    await pick("Card");
    const card = await box(products());
    expect({ fill: card.fill, corner: card.corner }).toEqual({ fill: await token("--card"), corner: "0px" });
    // A hairline ring and no shadow under it: every other layer Tailwind composes is empty.
    const layers = card.ring.split(/,(?![^(]*\))/).map((layer) => layer.trim());
    expect(layers.filter((layer) => !layer.endsWith("0px 0px 0px 0px"))).toEqual([
      `${await token("--border")} 0px 0px 0px 1px`,
    ]);
    const gap = await example()
      .locator('[data-slot="panel-grid"] > div')
      .evaluate((grid) => [getComputedStyle(grid).columnGap, getComputedStyle(grid).rowGap]);
    expect(gap).toEqual(["8px", "8px"]);
    await pick("Open");
  });

  it("keeps a card-surface grid's cards boxed when a portal draws it outside the provider's element", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    await pick("Card");
    // A dialog, sheet or popover renders under <body>, outside the provider's data-surface element.
    const drawn = await example()
      .locator('[data-slot="panel-grid"]')
      .evaluate((grid) => {
        const copy = document.body.appendChild(grid.cloneNode(true)) as HTMLElement;
        const card = getComputedStyle(copy.querySelector('[data-slot="card"]') as Element);
        const result = { ring: card.boxShadow, fill: card.backgroundColor };
        copy.remove();
        return result;
      });
    expect(transparentRing(drawn.ring)).toBe(false);
    expect(drawn.fill).toBe(await token("--card"));
    await pick("Open");
  });

  it("is open outside any provider: a lone card with no fill, ring or rule", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    const drawn = await products().evaluate((card) => {
      const copy = document.body.appendChild(card.cloneNode(true)) as HTMLElement;
      const style = getComputedStyle(copy);
      const result = {
        fill: style.backgroundColor,
        ring: style.boxShadow,
        rules: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      };
      copy.remove();
      return result;
    });
    expect(drawn.fill).toBe(NONE);
    expect(transparentRing(drawn.ring)).toBe(true);
    expect(drawn.rules).toEqual(NO_RULES);
  });
});
