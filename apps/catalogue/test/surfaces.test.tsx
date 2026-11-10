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

interface Ruling {
  /** The group's own rules: top, right, bottom, left. */
  edges: string[];
  /** The grid's fill, which shows in an empty cell. */
  fill: string;
  /** Per cell, in order: whether a rule shows under it and at its end; the group clips the ones on its own edges. */
  cells: { under: boolean; end: boolean }[];
  /** The cells' tops, rounded, to read the rows. */
  tops: number[];
}

/** How a ruled group (a PanelGrid or a SectionCards row) parts its cells, measured as drawn. */
const ruling = (group: Locator): Promise<Ruling> =>
  group.evaluate((wrapper) => {
    const style = getComputedStyle(wrapper);
    const grid = wrapper.firstElementChild as Element;
    const frame = wrapper.getBoundingClientRect();
    const inner = frame.bottom - parseFloat(style.borderBottomWidth);
    return {
      edges: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      fill: getComputedStyle(grid).backgroundColor,
      cells: [...grid.children].map((cell) => {
        const rect = cell.getBoundingClientRect();
        const cellStyle = getComputedStyle(cell);
        return {
          under: cellStyle.borderBottomWidth === "1px" && rect.bottom <= inner + 0.5,
          end: cellStyle.borderRightWidth === "1px" && rect.right <= frame.right + 0.5,
        };
      }),
      tops: [...grid.children].map((cell) => Math.round(cell.getBoundingClientRect().top)),
    };
  });

describe("surfaces", { timeout: 60_000 }, () => {
  it("opens on ruled, the default, and fills every block with the card colour, rules between the panels and none on the sides", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    // The example sets the provider to the toggle's state, which starts on the default.
    expect(await example().getByRole("button", { name: "Ruled", exact: true }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    const card = await token("--card");
    const cards = example().locator('[data-slot="card"]');
    await expect.poll(() => cards.count()).toBe(3);
    for (const drawn of await Promise.all((await cards.all()).map(box))) {
      expect({ fill: drawn.fill, corner: drawn.corner }).toEqual({ fill: card, corner: "0px" });
      expect(transparentRing(drawn.ring)).toBe(true);
    }
    expect(await ruling(example().locator('[data-slot="panel-grid"]'))).toMatchObject({
      edges: ["1px", "0px", "1px", "0px"],
      fill: card,
      cells: [
        { under: false, end: true },
        { under: false, end: false },
      ],
    });
  });

  it("rules a MetricStrip standing alone above and below on a ruled page, as it rules a PanelGrid", async () => {
    const strip = example().locator('[data-slot="card"]', { has: page.locator('[data-slot="metric-strip"]') });
    const rules = await strip.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
    });
    expect(rules).toEqual(["1px", "0px", "1px", "0px"]);
    // A card inside a panel is ruled by the panel, not by rules of its own.
    const inPanel = await example()
      .locator('[data-slot="panel"] [data-slot="card"]')
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(inPanel).toBe("0px");
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

  it("keeps a card-surface grid's cards boxed when a portal draws it outside the provider's element", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    await pick("Card");
    // A dialog, sheet or popover renders under <body>, outside the provider's data-surface element.
    const drawn = await example()
      .locator('[data-slot="panel-grid"]')
      .evaluate((grid) => {
        const copy = document.body.appendChild(grid.cloneNode(true)) as HTMLElement;
        const card = getComputedStyle(copy.querySelector('[data-slot="card"]') as Element);
        const result = { ring: card.boxShadow, rules: [card.borderTopWidth, card.borderBottomWidth] };
        copy.remove();
        return result;
      });
    expect(transparentRing(drawn.ring)).toBe(false);
    expect(drawn.rules).toEqual(["0px", "0px"]);
    await pick("Ruled");
  });

  it("rules a lone card in a ruled provider nested inside a card, as a family index's preview is", async () => {
    await page.goto(page.url().replace(/#.*/, "#/data"));
    const preview = page
      .locator('[data-slot="family-preview"] [data-slot="siyahi-provider"] [data-slot="card"]')
      .first();
    await preview.waitFor({ state: "attached" });
    expect(
      await preview.evaluate((el) => [getComputedStyle(el).borderTopWidth, getComputedStyle(el).borderBottomWidth]),
    ).toEqual(["1px", "1px"]);
  });

  it("is ruled outside any provider: a lone card filled, with no ring and a rule above and below", async () => {
    await page.goto(page.url().replace(/#.*/, "#/foundations/surfaces"));
    const drawn = await example()
      .locator('[data-slot="card"]', { hasText: "Top products" })
      .evaluate((card) => {
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
    expect(drawn.fill).toBe(await token("--card"));
    expect(transparentRing(drawn.ring)).toBe(true);
    expect(drawn.rules).toEqual(["1px", "0px", "1px", "0px"]);
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
        fill: getComputedStyle(grid).backgroundColor,
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
    expect(row.fill).toBe(await token("--card"));
    expect(row.pickedRing).toContain("inset");
    // The footer keeps the card's band: its padding, a rule above it and a faint fill.
    expect(row.footer.slice(0, 2)).toEqual(["12px", "1px"]);
    expect(row.footer[2]).not.toBe(NONE);
    expect(row.outdent).toBeGreaterThanOrEqual(0);
  });

  it("rules a 3 + 2 and a 2 x 2 row of tiles across and down, the empty cell a blank, ruled-off stretch of the sheet", async () => {
    await page.goto(page.url().replace(/#.*/, "#/blocks/section-cards"));
    // The first example draws rows of three, four and five tiles; a row is the group whose last tile is the fifth.
    const preview = page.locator('#section-cards [data-slot="example-preview"]').first();
    const five = preview.locator('[data-slot="section-card"]:nth-child(5):last-child').locator("xpath=../..");
    const fiveRuling = await ruling(five);
    // At the test's 1280px the five tiles run three, then two.
    expect(new Set(fiveRuling.tops).size).toBe(2);
    expect(fiveRuling).toMatchObject({
      edges: ["1px", "0px", "1px", "0px"],
      fill: await token("--card"),
      cells: [
        { under: true, end: true },
        { under: true, end: true },
        { under: true, end: false },
        { under: false, end: true },
        { under: false, end: true },
      ],
    });
    // The empty cell under the third tile shows the grid's card fill, not the page.
    await five.scrollIntoViewIfNeeded();
    const empty = await five.evaluate((wrapper) => {
      const cells = (wrapper.firstElementChild as Element).children;
      const third = (cells[2] as Element).getBoundingClientRect();
      const fifth = (cells[4] as Element).getBoundingClientRect();
      const hit = document.elementFromPoint(third.left + third.width / 2, fifth.top + fifth.height / 2);
      return hit ? getComputedStyle(hit).backgroundColor : "";
    });
    expect(empty).toBe(await token("--card"));
    const four = await ruling(
      preview.locator('[data-slot="section-card"]:nth-child(4):last-child').locator("xpath=../.."),
    );
    expect(new Set(four.tops).size).toBe(2);
    expect(four.cells).toEqual([
      { under: true, end: true },
      { under: true, end: false },
      { under: false, end: true },
      { under: false, end: false },
    ]);
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
