// Reads the catalogue's Surfaces and SectionCards examples in Chromium: how a
// card looks comes from the theme's CSS, which happy-dom does not apply.
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

const NONE = "rgba(0, 0, 0, 0)";
const transparentRing = (ring: string) => ring === "none" || /rgba\(0, 0, 0, 0\) 0px 0px 0px 1px/.test(ring);

const token = (name: string): Promise<string> => themeColor(page, name);

describe("surfaces", { timeout: 60_000 }, () => {
  it("fills every block with the card colour on a ruled page, with rules between the panels and none on the sides", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    await pick("Ruled");
    const card = await token("--card");
    const cards = example().locator('[data-slot="card"]');
    await expect.poll(() => cards.count()).toBe(3);
    for (const drawn of await Promise.all((await cards.all()).map(box))) {
      expect({ fill: drawn.fill, corner: drawn.corner }).toEqual({ fill: card, corner: "0px" });
      expect(transparentRing(drawn.ring)).toBe(true);
    }
    const panels = await example()
      .locator('[data-slot="panel"]')
      .evaluateAll((els) =>
        els.map((p) => [
          getComputedStyle(p).borderTopWidth,
          getComputedStyle(p).borderLeftWidth,
          getComputedStyle(p).backgroundColor,
        ]),
      );
    expect(panels).toEqual([
      ["1px", "1px", card],
      ["1px", "1px", card],
    ]);
    // The grid clips its first panel's left rule and draws none on its right: the outer lines are top and bottom.
    const outer = await example()
      .locator('[data-slot="panel-grid"]')
      .evaluate((grid) => {
        const style = getComputedStyle(grid);
        const first = grid.querySelector('[data-slot="panel"]') as Element;
        return {
          edges: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
          leftRuleShows: first.getBoundingClientRect().left >= grid.getBoundingClientRect().left,
        };
      });
    expect(outer).toEqual({ edges: ["1px", "0px", "1px", "0px"], leftRuleShows: false });
  });

  it("draws tight square cards on a card surface, and drops the box and padding on an open one", async () => {
    const products = example().locator('[data-slot="card"]', { hasText: "Top products" });
    await pick("Card");
    const card = await box(products);
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
    expect((await box(products)).padding).toBe("0px");
    expect((await box(products)).fill).toBe(NONE);
    expect(
      await example()
        .locator('[data-slot="panel"]')
        .first()
        .evaluate((p) => getComputedStyle(p).borderTopWidth),
    ).toBe("0px");
    await pick("Ruled");
  });

  it("is a card outside any provider", async () => {
    const drawn = await example()
      .locator('[data-slot="card"]', { hasText: "Top products" })
      .evaluate((card) => {
        const copy = document.body.appendChild(card.cloneNode(true)) as HTMLElement;
        const result = { fill: getComputedStyle(copy).backgroundColor, ring: getComputedStyle(copy).boxShadow };
        copy.remove();
        return result;
      });
    expect(drawn.fill).toBe(await token("--card"));
    expect(transparentRing(drawn.ring)).toBe(false);
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

  it("parts filled stat tiles with hairlines on a ruled page, its ring inside the picked tile and the footer's rule and band kept", async () => {
    await page.goto(page.url().replace(/#.*/, "#/blocks/section-cards"));
    const picker = page.locator('[data-slot="card"]', { has: page.locator('button[aria-label="All"]') });
    await picker.waitFor();
    const row = await picker.evaluate((tile) => {
      const cell = tile.closest('[data-slot="section-card"]') as Element;
      const grid = cell.parentElement as Element;
      const wrapper = grid.parentElement as Element;
      return {
        rule: [getComputedStyle(wrapper).borderTopWidth, getComputedStyle(wrapper).borderBottomWidth],
        tiles: [...grid.children].map((t) => [
          getComputedStyle(t).borderTopWidth,
          getComputedStyle(t).borderLeftWidth,
          getComputedStyle(t).backgroundColor,
        ]),
        pickedRing: getComputedStyle(tile).boxShadow,
        footer: ((footer) => [footer.paddingTop, footer.borderTopWidth, footer.backgroundColor])(
          getComputedStyle(tile.querySelector('[data-slot="card-footer"]') as Element),
        ),
        // siyahi-shots measures cards against the page gutter, so no tile may start left of its row (siyahi#34).
        outdent: Math.min(
          ...[...grid.querySelectorAll('[data-slot="card"]')].map(
            (c) => c.getBoundingClientRect().left - wrapper.getBoundingClientRect().left,
          ),
        ),
      };
    });
    expect(row.rule).toEqual(["1px", "1px"]);
    const card = await token("--card");
    expect(row.tiles.every(([top, left, fill]) => top === "1px" && left === "1px" && fill === card)).toBe(true);
    expect(row.pickedRing).toContain("inset");
    // The footer keeps the card's band: its padding, a rule above it and a faint fill.
    expect(row.footer.slice(0, 2)).toEqual(["12px", "1px"]);
    expect(row.footer[2]).not.toBe(NONE);
    expect(row.outdent).toBeGreaterThanOrEqual(0);
  });

  it("draws stat tiles compact: 12px in from the edge and a 24px figure", async () => {
    await page.goto(page.url().replace(/#.*/, "#/blocks/section-cards"));
    const tile = page.locator('[data-slot="card"]', { has: page.locator('button[aria-label="All"]') });
    await tile.waitFor();
    const size = await tile.evaluate((card) => ({
      padding: getComputedStyle(card).paddingTop,
      inset: getComputedStyle(card.querySelector('[data-slot="card-header"]') as Element).paddingLeft,
      figure: getComputedStyle(card.querySelector('[data-slot="card-title"]') as Element).fontSize,
    }));
    expect(size).toEqual({ padding: "12px", inset: "12px", figure: "24px" });
  });

  for (const colorScheme of ["light", "dark"] as const) {
    it(`lets a ruled panel's sticky child follow the page in ${colorScheme} mode`, async () => {
      await page.emulateMedia({ colorScheme });
      await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
      await pick("Ruled");
      const grid = example().locator('[data-slot="panel-grid"]');
      await grid.waitFor();
      // Isolate the rendered grid from the catalogue's example frame. The tall
      // neighbour models a list beside a detail card, as used by dash.
      await grid.evaluate((el) => {
        const fixture = document.createElement("div");
        fixture.id = "sticky-panels";
        fixture.style.cssText = "margin: 100px 32px 1000px; width: 900px";
        const copy = el.cloneNode(true) as HTMLElement;
        const list = copy.querySelector<HTMLElement>('[data-slot="panel"]:first-child')!;
        list.style.minHeight = "1200px";
        const detail = copy.querySelector<HTMLElement>('[data-slot="panel"]:nth-child(2) [data-slot="card"]')!;
        detail.style.cssText = "position: sticky; top: 24px";
        fixture.append(copy);
        document.body.append(fixture);
      });
      try {
        const fixture = page.locator("#sticky-panels");
        const detail = fixture.locator('[data-slot="card"]', { hasText: "Top products" });
        const top = await fixture.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        for (const offset of [100, 300]) {
          await page.evaluate((y) => window.scrollTo(0, y), top + offset);
          await expect.poll(() => detail.evaluate((el) => el.getBoundingClientRect().top)).toBeCloseTo(24, 0);
        }
        const clipping = await fixture.locator('[data-slot="panel-grid"]').evaluate((el) => {
          el.scrollLeft = 10;
          return { overflow: getComputedStyle(el).overflow, scrollLeft: el.scrollLeft };
        });
        expect(clipping).toEqual({ overflow: "clip", scrollLeft: 0 });
      } finally {
        await page.locator("#sticky-panels").evaluate((el) => el.remove());
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    });
  }
});
