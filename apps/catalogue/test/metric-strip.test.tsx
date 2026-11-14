// Reads the catalogue's MetricStrip example in Chromium: a sparkline's line
// comes from Recharts' layout, which happy-dom does not compute.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("blocks/metric-strip");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The first example, six figures for October: the page's other examples reuse some of its labels. */
const october = (): Locator => page.locator('[data-slot="example-preview"]').first();

/** The figure in the October strip with this label. */
const tile = (label: string): Locator =>
  october().locator('[data-slot="metric-strip-item"]', { has: page.getByText(label, { exact: true }) });

/** The colour of a tile's sparkline's last step, the part that carries its sign. */
const stroke = (label: string): Promise<string | null> =>
  tile(label).locator(".sparkline-now .recharts-line-curve").getAttribute("stroke", { timeout: 5000 });

describe("MetricStrip sparklines", { timeout: 60_000 }, () => {
  it("fits the line to its values, from the box's bottom to its top", async () => {
    const sparkline = tile("Target").locator('[data-slot="sparkline"]');
    await sparkline.scrollIntoViewIfNeeded();
    const line = sparkline.locator(".recharts-line:not(.sparkline-now) .recharts-line-curve");
    const box = await sparkline.boundingBox();
    if (!box) throw new Error("not laid out");
    // A rising run fills the plot: the box less the 3px kept above and below for the end dot. An axis from zero drew
    // it about 3px tall.
    await expect
      .poll(() => line.evaluate((path) => Math.round((path as SVGPathElement).getBBox().height)), { timeout: 5000 })
      .toBe(box.height - 6);
  });

  it("draws the run muted and colours its last step by the sign of the change", async () => {
    expect(
      await tile("Revenue").locator(".recharts-line:not(.sparkline-now) .recharts-line-curve").getAttribute("stroke"),
    ).toBe("var(--muted-foreground)");
    expect(await stroke("Revenue")).toBe("var(--positive)");
    expect(await stroke("Gross margin")).toBe("var(--negative)");
  });
});

describe("MetricStrip tones", { timeout: 60_000 }, () => {
  it("washes only the figure the page marks, in the page's colour, and outlines it 8px out so its text stays in line", async () => {
    const figures = october().locator('[data-slot="metric-strip-item"]');
    const fills = await figures.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    // The wash as the theme mixes it, probed inside the strip's own card: an open card has no fill, so the tone mixes
    // into the page colour there, not into a grey no box shows.
    const wash = await tile("Cash flow").evaluate((el) => {
      const probe = (el.parentElement as Element).appendChild(document.createElement("div"));
      probe.style.backgroundColor = "color-mix(in oklab, var(--negative) var(--wash), var(--background))";
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    // Cash flow, the fourth figure, is marked negative; the others show the page through.
    expect(fills.map((fill) => (fill === "rgba(0, 0, 0, 0)" ? "clear" : fill === wash ? "wash" : fill))).toEqual([
      "clear",
      "clear",
      "clear",
      "wash",
      "clear",
      "clear",
    ]);
    const marked = await tile("Cash flow").evaluate((el) => {
      const style = getComputedStyle(el);
      const label = el.querySelector('[data-slot="metric-strip-label"]') as Element;
      const neighbour = el.nextElementSibling?.querySelector('[data-slot="metric-strip-label"]') as Element;
      return {
        outline: [style.outlineWidth, style.outlineOffset],
        shadow: style.boxShadow.endsWith("0px 0px 0px 8px"),
        // The label's top against its neighbour's: the wash reaches out, the text does not move in.
        offset: label.getBoundingClientRect().top - neighbour.getBoundingClientRect().top,
      };
    });
    expect(marked).toEqual({ outline: ["1px", "8px"], shadow: true, offset: 0 });
  });
});

/** Each figure's row top, value top and sparkline top, in page pixels. */
const tops = (strip: Locator) =>
  strip.locator('[data-slot="metric-strip-item"]').evaluateAll((els) =>
    els.map((el) => ({
      row: Math.round(el.getBoundingClientRect().top),
      value: Math.round((el.querySelector('[data-slot="metric-strip-value"]') as Element).getBoundingClientRect().top),
      trend: Math.round((el.querySelector('[data-slot="sparkline"]') as Element).getBoundingClientRect().top),
    })),
  );

describe("MetricStrip alignment", { timeout: 60_000 }, () => {
  it("keeps a row's values and sparklines level when one figure's note wraps", async () => {
    // Revenue's note, made long enough to wrap onto lines of its own at any width the strip takes.
    await tile("Revenue")
      .locator('[data-slot="delta"] + span')
      .evaluate((note) => (note.textContent = "against September, the best month of the year by far so far"));
    const rows = Map.groupBy(await tops(october()), (figure) => figure.row);
    for (const row of rows.values()) {
      expect(new Set(row.map((figure) => figure.value)).size).toBe(1);
      expect(new Set(row.map((figure) => figure.trend)).size).toBe(1);
    }
  });

  it("keeps a stale figure's value and sparkline level with a fresh neighbour's", async () => {
    await page.goto(page.url().replace(/#.*/, "#/data/stale-data"));
    // The old page stays up until the new one's examples load, so wait for the new page's heading.
    await page.getByRole("heading", { level: 1, name: "Stale data", exact: true }).waitFor();
    const strip = page.locator('[data-slot="metric-strip"]').first();
    await strip.waitFor();
    const [fresh, stale] = await tops(strip);
    expect(stale).toEqual(fresh);
  });

  it("shows a stale figure's whole label on a phone, its note under the value", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    try {
      await page.goto(page.url().replace(/#.*/, "#/data/stale-data"));
      await page.getByRole("heading", { level: 1, name: "Stale data", exact: true }).waitFor();
      const stale = page.locator('[data-slot="metric-strip-item"]', { hasText: "Gift cards" }).first();
      const label = stale.locator('[data-slot="metric-strip-label"]');
      // Two figures share a phone's row, so a note beside the label cut it to "GIF…".
      expect(await label.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const [value, note] = await Promise.all(
        ['[data-slot="metric-strip-value"]', '[data-slot="stale-note"]'].map((slot) =>
          stale.locator(slot).evaluate((el) => el.getBoundingClientRect().top),
        ),
      );
      expect(note).toBeGreaterThan(value ?? 0);
    } finally {
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });
});

describe("a headline MetricStrip", { timeout: 60_000 }, () => {
  it("sets each figure on a solid block, orange, the text colour, then grey, its words in the block's ink", async () => {
    // An earlier test leaves the page on another route.
    await page.goto(page.url().replace(/#.*/, "#/blocks/metric-strip"));
    await page.getByRole("heading", { level: 1, name: "MetricStrip", exact: true }).waitFor();
    // Examples render as they near the viewport: scroll to this one's caption first.
    await page.getByText("Three headline figures on solid blocks", { exact: false }).scrollIntoViewIfNeeded();
    const headline = page.locator('[data-slot="metric-strip"][data-variant="blocks"]');
    await headline.waitFor();
    const drawn = await headline.locator('[data-slot="metric-strip-item"]').evaluateAll((els) =>
      els.map((el) => {
        const label = el.querySelector('[data-slot="metric-strip-label"]') as Element;
        return [getComputedStyle(el).backgroundColor, getComputedStyle(label).color];
      }),
    );
    const token = (name: string) => themeColor(page, name);
    expect(drawn).toEqual([
      [await token("--headline"), await token("--headline-foreground")],
      [await token("--foreground"), await token("--background")],
      [await token("--headline-muted"), await token("--headline-muted-foreground")],
    ]);
    // The blocks touch: no gap parts them.
    const boxes = await headline
      .locator('[data-slot="metric-strip-item"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    expect(Math.round((boxes[1]?.left ?? 0) - (boxes[0]?.right ?? 0))).toBe(0);
  });
});
