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
  ring: string;
  padding: string;
  rules: string[];
}

/** How a card is drawn: its fill, ring, padding and the rules on its four edges. */
const box = (card: Locator): Promise<Box> =>
  card.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fill: style.backgroundColor,
      ring: style.boxShadow,
      padding: style.paddingTop,
      rules: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
    };
  });

const NONE = "rgba(0, 0, 0, 0)";
const NO_RULES = ["0px", "0px", "0px", "0px"];
const transparentRing = (ring: string) => ring === "none" || /rgba\(0, 0, 0, 0\) 0px 0px 0px 1px/.test(ring);
const token = (name: string): Promise<string> => themeColor(page, name);
const products = (): Locator => example().locator('[data-slot="card"]', { hasText: "Top products" });

describe("surfaces", { timeout: 60_000 }, () => {
  it("draws no fill, ring, padding or rule on any block, and parts the panels by space", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
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
    expect(gap).toEqual(["16px", "12px"]);
  });

  it("names the page colour --card inside a card, so its marks' halos and tints match the canvas", async () => {
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

  it("draws a card portaled under <body>, as a dialog draws it, with no fill, ring or rule", async () => {
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
