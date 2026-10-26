// Reads the catalogue's Surfaces and SectionCards examples in Chromium: how a
// card looks comes from the theme's CSS, which happy-dom does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("foundations/surfaces");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const example = (): Locator => page.locator("#surfaces > div:last-child > div:first-child");

interface Box {
  fill: string;
  corner: string;
  ring: string;
  padding: string;
}

/** How a card is drawn: its fill, corner, ring and padding. */
const box = (card: Locator): Promise<Box> =>
  card.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fill: style.backgroundColor,
      corner: style.borderTopLeftRadius,
      ring: style.boxShadow,
      padding: style.paddingTop,
    };
  });

async function pick(surface: "Ruled" | "Open" | "Card"): Promise<void> {
  await example().getByRole("button", { name: surface, exact: true }).click();
}

const NONE: Pick<Box, "fill" | "corner"> = { fill: "rgba(0, 0, 0, 0)", corner: "0px" };
const transparentRing = (ring: string) => ring === "none" || /rgba\(0, 0, 0, 0\) 0px 0px 0px 1px/.test(ring);

describe("surfaces", { timeout: 60_000 }, () => {
  it("draws no box on a ruled page, MetricStrip's card included, and rules between the panels", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    await pick("Ruled");
    const cards = example().locator('[data-slot="card"]');
    await expect.poll(() => cards.count()).toBe(3);
    for (const card of await cards.all()) {
      const drawn = await box(card);
      expect({ fill: drawn.fill, corner: drawn.corner }).toEqual(NONE);
      expect(transparentRing(drawn.ring)).toBe(true);
    }
    const rules = await example()
      .locator('[data-slot="panel"]')
      .evaluateAll((panels) =>
        panels.map((p) => [getComputedStyle(p).borderTopWidth, getComputedStyle(p).borderLeftWidth]),
      );
    expect(rules).toEqual([
      ["1px", "1px"],
      ["1px", "1px"],
    ]);
  });

  it("gives shadcn's card back on a card surface, and drops the padding on an open one", async () => {
    const holdings = example().locator('[data-slot="card"]', { hasText: "Holdings" });
    await pick("Card");
    const card = await box(holdings);
    expect(card.fill).not.toBe(NONE.fill);
    expect(card.corner).toBe("14px");
    expect(transparentRing(card.ring)).toBe(false);
    await pick("Open");
    expect((await box(holdings)).padding).toBe("0px");
    expect(
      await example()
        .locator('[data-slot="panel"]')
        .first()
        .evaluate((p) => getComputedStyle(p).borderTopWidth),
    ).toBe("0px");
    await pick("Ruled");
  });

  it("is ruled outside any provider too", async () => {
    const corner = await example()
      .locator('[data-slot="card"]', { hasText: "Holdings" })
      .evaluate((card) => {
        const copy = document.body.appendChild(card.cloneNode(true)) as HTMLElement;
        const result = getComputedStyle(copy).borderTopLeftRadius;
        copy.remove();
        return result;
      });
    expect(corner).toBe("0px");
  });

  it("keeps a picked SectionCards tile's ring on a ruled page", async () => {
    await page.goto(page.url().replace(/#.*/, "#/blocks/section-cards"));
    // The picker example starts on "All"; its tile's button carries the tile's label.
    const picked = page.locator('[data-slot="card"]', {
      has: page.locator('button[aria-label="All"][aria-pressed="true"]'),
    });
    await picked.waitFor();
    expect(transparentRing((await box(picked)).ring)).toBe(false);
  });
});
