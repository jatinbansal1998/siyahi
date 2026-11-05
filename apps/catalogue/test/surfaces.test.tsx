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

  it("is a card outside any provider", async () => {
    const corner = await example()
      .locator('[data-slot="card"]', { hasText: "Holdings" })
      .evaluate((card) => {
        const copy = document.body.appendChild(card.cloneNode(true)) as HTMLElement;
        const result = getComputedStyle(copy).borderTopLeftRadius;
        copy.remove();
        return result;
      });
    expect(corner).not.toBe("0px");
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

  it("parts stat tiles with hairlines on a ruled page, its ring inside the picked tile and no gap above the footer", async () => {
    await page.goto(page.url().replace(/#.*/, "#/blocks/section-cards"));
    const picker = page.locator('[data-slot="card"]', { has: page.locator('button[aria-label="All"]') });
    await picker.waitFor();
    const row = await picker.evaluate((tile) => {
      const cell = tile.closest('[data-slot="section-card"]') as Element;
      const grid = cell.parentElement as Element;
      const wrapper = grid.parentElement as Element;
      return {
        rule: [getComputedStyle(wrapper).borderTopWidth, getComputedStyle(wrapper).borderBottomWidth],
        tiles: [...grid.children].map((t) => [getComputedStyle(t).borderTopWidth, getComputedStyle(t).borderLeftWidth]),
        pickedRing: getComputedStyle(tile).boxShadow,
        footerTop: getComputedStyle(tile.querySelector('[data-slot="card-footer"]') as Element).paddingTop,
        // siyahi-shots measures cards against the page gutter, so no tile may start left of its row (siyahi#34).
        outdent: Math.min(
          ...[...grid.querySelectorAll('[data-slot="card"]')].map(
            (c) => c.getBoundingClientRect().left - wrapper.getBoundingClientRect().left,
          ),
        ),
      };
    });
    expect(row.rule).toEqual(["1px", "1px"]);
    expect(row.tiles.every(([top, left]) => top === "1px" && left === "1px")).toBe(true);
    expect(row.pickedRing).toContain("inset");
    // The footer lines follow the figure at the card's own gap, with no band's padding above them.
    expect(row.footerTop).toBe("0px");
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
        const detail = fixture.locator('[data-slot="card"]', { hasText: "Holdings" });
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
