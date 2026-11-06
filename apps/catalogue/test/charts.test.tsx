// Hovers every bar and point of the catalogue's chart examples in Chromium
// and reads the tooltip. happy-dom cannot do this: Recharts picks the hovered
// point from laid-out pixel positions.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/bar-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Opens a Data family's own route: the Data page itself only links to the families. */
async function show(family: string): Promise<void> {
  const hash = `#/data/${family}`;
  if ((await page.evaluate(() => location.hash)) !== hash) {
    await page.evaluate((next) => {
      location.hash = next;
    }, hash);
  }
  await page.locator(`#${family} [data-slot="example-preview"]`).first().waitFor();
}

const card = (title: string): Locator =>
  page.locator('[data-slot="card"]', { has: page.getByText(title, { exact: true }) });

const center = async (target: Locator): Promise<{ x: number; y: number }> => {
  // A chart re-renders its marks as it animates in; wait for this one to be on the page before measuring it.
  await target.waitFor({ state: "visible" });
  const box = await target.boundingBox();
  if (!box) throw new Error("not laid out");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** Waits until the targets stop moving: the chart resizes to its card and animates in after the first paint. */
async function settled(targets: Locator): Promise<void> {
  const boxes = async () =>
    JSON.stringify(await targets.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON())));
  let last = "";
  await expect
    .poll(
      async () => {
        const now = await boxes();
        const same = now === last;
        last = now;
        return same;
      },
      { interval: 250, timeout: 5000 },
    )
    .toBe(true);
}

/** The tooltip's lines once the pointer is at x, y: the heading, then a label and a value per series. */
async function tooltipAt(chart: Locator, x: number, y: number, heading: string): Promise<string[]> {
  await page.mouse.move(x, y);
  const tooltip = chart.locator(".recharts-tooltip-wrapper");
  // Wait for this point's tooltip, so a wrong heading fails on the comparison below.
  await expect.poll(async () => (await tooltip.innerText()).split("\n")[0], { timeout: 2000 }).toBe(heading);
  return (await tooltip.innerText()).split("\n").filter(Boolean);
}

/** One x axis and one y axis: a mark that misses its axis by id makes Recharts add a second one and split the plot (dash#88). */
async function onePlot(chart: Locator): Promise<void> {
  expect(await chart.locator(".recharts-xAxis").count()).toBe(1);
  expect(await chart.locator(".recharts-yAxis").count()).toBe(1);
}

/** Hovers the plot above each x axis tick, as a reader sliding along an area or line chart does. */
async function hoverEachPoint(title: string, expected: string[][]): Promise<void> {
  const chart = card(title);
  await chart.scrollIntoViewIfNeeded();
  const ticks = chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
  await expect.poll(() => ticks.count()).toBe(expected.length);
  await settled(ticks);
  await onePlot(chart);
  const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
  if (!grid) throw new Error("not laid out");
  for (const [index, lines] of expected.entries()) {
    // The first and last ticks sit on the plot's edges; stay a pixel inside it.
    const x = Math.min(Math.max((await center(ticks.nth(index))).x, grid.x + 1), grid.x + grid.width - 1);
    expect(await tooltipAt(chart, x, grid.y + grid.height / 2, lines[0] ?? "")).toEqual(lines);
  }
}

/** Hovers the middle of every bar; each names its own category and lists every series there. */
async function hoverEachBar(title: string, expected: string[][]): Promise<void> {
  const chart = card(title);
  await chart.scrollIntoViewIfNeeded();
  const bars = chart.locator(".recharts-bar-rectangle");
  const series = (expected[0]!.length - 1) / 2;
  await expect.poll(() => bars.count()).toBe(expected.length * series);
  await settled(bars);
  await onePlot(chart);
  // Recharts draws one series' bars after another, so bar i is category i % categories.
  for (let i = 0; i < expected.length * series; i++) {
    const lines = expected[i % expected.length]!;
    const { x, y } = await center(bars.nth(i));
    expect(await tooltipAt(chart, x, y, lines[0] ?? "")).toEqual(lines);
  }
}

/**
 * Where Q1's bar of each series starts, once the bars stop moving. Recharts draws each
 * series in its own layer, one bar per quarter in axis order, so the first bar of every
 * layer is Q1's, however many quarters there are: five places when grouped, one when stacked.
 */
async function q1Lefts(chart: Locator): Promise<Set<number>> {
  await settled(chart.locator(".recharts-bar-rectangle"));
  const lefts = await chart
    .locator(".recharts-bar")
    .evaluateAll((layers) =>
      layers.map((layer) =>
        Math.round(layer.querySelector(".recharts-bar-rectangle")?.getBoundingClientRect().left ?? NaN),
      ),
    );
  return new Set(lefts);
}

const quarterLines = (quarter: string, ...values: string[]) => [
  quarter,
  ...["Equity", "Debt", "Gold", "Cash", "REITs"].flatMap((label, i) => [label, values[i] ?? ""]),
];
// The tooltip lists the series in their order: value first, then the money put in.
const valueLines = (month: string, invested: string, value: string) => [month, "Value", value, "Invested", invested];
const returnLines = (month: string, portfolio: string, index: string) => [
  month,
  "Portfolio",
  portfolio,
  "Nifty 50",
  index,
];

describe("chart cards", { timeout: 60_000 }, () => {
  it("category xTicks labels only April without dropping months or their tooltips on every series card", async () => {
    await show("category-ticks");
    for (const kind of ["bars", "line", "area"]) {
      const chart = card(`Monthly orders, ${kind}`);
      await chart.scrollIntoViewIfNeeded();
      const ticks = chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
      await settled(ticks);
      expect(await ticks.allTextContents()).toEqual([
        "Apr 19",
        "Apr 20",
        "Apr 21",
        "Apr 22",
        "Apr 23",
        "Apr 24",
        "Apr 25",
      ]);
      const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
      if (!grid) throw new Error("not laid out");
      // January has no tick, but remains the first of all 84 plotted months.
      if (kind === "bars") expect(await chart.locator(".recharts-bar-rectangle").count()).toBe(84);
      expect(await tooltipAt(chart, grid.x + grid.width / 168, grid.y + grid.height / 2, "2019-01")).toEqual([
        "2019-01",
        "Orders",
        "20",
      ]);
    }
  });

  it("category xTicks follows the category axis on sideways bars", async () => {
    await show("category-ticks");
    const chart = card("Monthly orders, sideways");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await settled(ticks);
    expect(await ticks.allTextContents()).toEqual(["Apr 19"]);
    const bars = chart.locator(".recharts-bar-rectangle");
    expect(await bars.count()).toBe(12);
    const { x, y } = await center(bars.first());
    expect(await tooltipAt(chart, x, y, "2019-01")).toEqual(["2019-01", "Orders", "20"]);
  });

  it("keeps sideways bars visible with a long selected category on mobile", async () => {
    await show("category-ticks");
    const viewport = page.viewportSize()!;
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      const chart = card("Orders by sector");
      await chart.scrollIntoViewIfNeeded();
      const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
      await settled(ticks);
      expect(await ticks.first().getAttribute("aria-label")).toBe("Information Technology and Services");
      const bars = chart.locator(".recharts-bar-rectangle");
      expect(await bars.count()).toBe(3);
      const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
      const surface = await chart.locator("svg.recharts-surface").boundingBox();
      expect(grid?.width).toBeGreaterThan((surface?.width ?? 0) * 0.4);
      const { x, y } = await center(bars.first());
      expect(await tooltipAt(chart, x, y, "Information Technology and Services")).toEqual([
        "Information Technology and Services",
        "Orders",
        "100",
      ]);
    } finally {
      await page.setViewportSize(viewport);
    }
  });

  it("keeps wrapped category names and their details apart on phones", async () => {
    await show("bar-chart");
    const viewport = page.viewportSize()!;
    try {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        const chart = card("Sectors against the index");
        await chart.scrollIntoViewIfNeeded();
        const labels = chart.locator(".recharts-yAxis-tick-labels text");
        await settled(labels);
        const details = await labels.evaluateAll((elements) =>
          elements
            .filter((_, index) => index % 2 === 1)
            .map((element) => ({
              visible: [...element.querySelectorAll("tspan")].map((line) => line.textContent).join(" "),
              complete: element.getAttribute("aria-label"),
            })),
        );
        for (const detail of details) expect(detail.visible).toBe(detail.complete);
        const boxes = await labels.evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().toJSON()),
        );
        expect(boxes.length).toBe(12);
        for (let index = 1; index < boxes.length; index++) {
          expect(boxes[index]!.top).toBeGreaterThan(boxes[index - 1]!.bottom);
        }
        const surface = await chart.locator("svg.recharts-surface").boundingBox();
        expect(boxes[0]!.top).toBeGreaterThanOrEqual(surface!.y);
        expect(boxes.at(-1)!.bottom).toBeLessThanOrEqual(surface!.y + surface!.height);
      }
    } finally {
      await page.setViewportSize(viewport);
    }
  });

  it("BarChartCard names the hovered category and its formatted values", async () => {
    await show("bar-chart");
    await hoverEachBar("Orders by hour", [
      ["09:00", "Orders", "42"],
      ["10:00", "Orders", "31"],
      ["11:00", "Orders", "18"],
      ["12:00", "Orders", "12"],
      ["13:00", "Orders", "15"],
      ["14:00", "Orders", "24"],
      ["15:00", "Orders", "38"],
    ]);
    await hoverEachBar("Money invested by quarter", [
      quarterLines("Q1", "₹1,20,000", "₹40,000", "₹15,000", "₹9,000", "₹4,000"),
      quarterLines("Q2", "₹95,000", "₹52,000", "₹20,000", "₹6,000", "₹3,000"),
      quarterLines("Q3", "₹1,40,000", "₹38,000", "₹12,000", "₹11,000", "₹5,000"),
      quarterLines("Q4", "₹1,60,000", "₹45,000", "₹25,000", "₹7,000", "₹2,000"),
    ]);
  });

  it("AreaChartCard names the hovered month and its formatted values", async () => {
    await show("area-chart");
    await hoverEachPoint("₹4.9L ahead of the money put in", [
      valueLines("May", "₹36,00,000", "₹38,20,000"),
      valueLines("Jun", "₹36,85,000", "₹39,50,000"),
      valueLines("Jul", "₹37,70,000", "₹41,10,000"),
      valueLines("Aug", "₹38,55,000", "₹40,20,000"),
      valueLines("Sep", "₹39,40,000", "₹43,80,000"),
      valueLines("Oct", "₹40,25,000", "₹45,12,300"),
    ]);
  });

  it("LineChartCard names the hovered month and its formatted values", async () => {
    await show("line-chart");
    await hoverEachPoint("Return against the index", [
      returnLines("May", "1.2%", "0.8%"),
      returnLines("Jun", "2.1%", "1.5%"),
      returnLines("Jul", "3.4%", "2.9%"),
      returnLines("Aug", "-0.6%", "0.4%"),
      returnLines("Sep", "4.1%", "3.1%"),
      returnLines("Oct", "5.2%", "3.6%"),
    ]);
  });

  it("the quarterly bar example starts grouped and stacks on Stacked", async () => {
    await show("bar-chart");
    // A fresh page, so the default is what this reads and not a layout an earlier test chose.
    await page.reload();
    const chart = card("Money invested by quarter");
    await chart.scrollIntoViewIfNeeded();
    expect((await q1Lefts(chart)).size).toBe(5);
    await chart.getByRole("button", { name: "Stacked" }).click();
    expect((await q1Lefts(chart)).size).toBe(1);
  });

  it("the quarterly bar example's stacked tooltip lists every series at the hovered quarter", async () => {
    await show("bar-chart");
    const chart = card("Money invested by quarter");
    await chart.scrollIntoViewIfNeeded();
    await chart.getByRole("button", { name: "Stacked" }).click();
    // Grouped and stacked tooltips list the same figures, so prove the bars are stacked first.
    expect((await q1Lefts(chart)).size).toBe(1);
    const q1Equity = chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle").first();
    const { x, y } = await center(q1Equity);
    expect(await tooltipAt(chart, x, y, "Q1")).toEqual(
      quarterLines("Q1", "₹1,20,000", "₹40,000", "₹15,000", "₹9,000", "₹4,000"),
    );
  });

  it("a numeric x axis puts each tick at its value, not in a slot per row", async () => {
    await show("limits-and-events");
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await settled(ticks);
    expect(await ticks.allTextContents()).toEqual(["19:34", "19:35", "19:36", "19:37", "19:38", "19:39", "19:40"]);
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!grid) throw new Error("not laid out");
    // The domain is [0, 390]; the ticks sit at 2, 62, … 362 seconds.
    for (const [index, value] of [2, 62, 122, 182, 242, 302, 362].entries()) {
      const { x } = await center(ticks.nth(index));
      expect(x).toBeCloseTo(grid.x + (value / 390) * grid.width, 0);
    }
  });

  it("reference lines mark limits dashed and events solid, each with its label and emphasis", async () => {
    await show("limits-and-events");
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    const lines = chart.locator(".recharts-reference-line");
    await settled(lines);
    const drawn = await lines.evaluateAll((groups) =>
      groups.map((g) => {
        const line = g.querySelector("line");
        const box = line?.getBoundingClientRect();
        return {
          stroke: line?.getAttribute("stroke"),
          dashed: Boolean(line?.getAttribute("stroke-dasharray")),
          upright: box ? box.width < 1 : false,
          left: box?.left ?? Number.NaN,
        };
      }),
    );
    expect(drawn.map(({ stroke, dashed, upright }) => ({ stroke, dashed, upright }))).toEqual([
      { stroke: "var(--muted-foreground)", dashed: true, upright: false },
      { stroke: "var(--foreground)", dashed: true, upright: false },
      { stroke: "var(--muted-foreground)", dashed: false, upright: true },
      { stroke: "var(--foreground)", dashed: false, upright: true },
    ]);
    // Recharts draws the labels in a layer of their own, in the lines' order; text-xs tells them from the ticks.
    expect(await chart.locator("text.recharts-text.fill-muted-foreground.text-xs").allTextContents()).toEqual([
      "old limit, 80%",
      "new limit, 50%",
      "limit 50%",
      "killed",
    ]);
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!grid) throw new Error("not laid out");
    // Events sit at their second on the numeric axis, between samples.
    expect(drawn[2]?.left).toBeCloseTo(grid.x + (313 / 390) * grid.width, 0);
    expect(drawn[3]?.left).toBeCloseTo(grid.x + (367 / 390) * grid.width, 0);
  });

  it("the tooltip heading can say more than the x tick", async () => {
    await show("limits-and-events");
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    await settled(chart.locator(".recharts-line-curve"));
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!grid) throw new Error("not laid out");
    // The sample at 75 s: ticks read 19:35, the tooltip the whole time and what was measured.
    const x = grid.x + (75 / 390) * grid.width;
    expect(await tooltipAt(chart, x, grid.y + grid.height / 2, "19:35:13 IST, 10 s average")).toEqual([
      "19:35:13 IST, 10 s average",
      "Full pressure",
      "66%",
    ]);
  });

  it("a series of losses runs down from zero, unstacked, with the negative colour in its legend", async () => {
    await show("bar-chart");
    const chart = card("F&O realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    // Every tick in the unit of the largest, so the axis does not switch from lakh to thousands half way down.
    expect(await ticks.allTextContents()).toEqual(["-₹1L", "-₹0.75L", "-₹0.5L", "-₹0.25L", "₹0"]);
    // Zero ends the value axis, so every bar hangs from the plot's top edge (the grid's box adds half a stroke).
    const plot = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!plot) throw new Error("not laid out");
    const tops = await bars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(tops).toHaveLength(4);
    for (const top of tops) expect(Math.abs(top - plot.y)).toBeLessThanOrEqual(1);
    const chip = chart.locator(".recharts-legend-wrapper .rounded-\\[2px\\]");
    expect(await chip.evaluate((el) => (el as HTMLElement).style.backgroundColor)).toBe("var(--negative)");
  });

  it("a fixed y domain and ticks hold the value axis at 0 to 100%", async () => {
    await show("limits-and-events");
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await settled(ticks);
    expect(await ticks.allTextContents()).toEqual(["0%", "25%", "50%", "75%", "100%"]);
    // The 80% limit sits a fifth of the way down from the top of a 0 to 100 axis.
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    const limit = await chart.locator(".recharts-reference-line line").first().boundingBox();
    if (!grid || !limit) throw new Error("not laid out");
    expect(limit.y).toBeCloseTo(grid.y + 0.2 * grid.height, 0);
  });

  it("a linear curve joins samples with straight segments", async () => {
    await show("limits-and-events");
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    const path = chart.locator("path.recharts-line-curve");
    await settled(path);
    // A straight-segment path has only move and line commands; a monotone one has cubic curves (C).
    expect(await path.getAttribute("d")).toMatch(/^M[\d.,\sL-]+$/);
  });

  it("axis titles sit under the x ticks and beside the y ticks, read bottom to top", async () => {
    await show("bar-chart");
    const chart = card("Orders by hour");
    await chart.scrollIntoViewIfNeeded();
    // Recharts draws an axis title as text with the class it is given, in a layer of its own.
    const titles = chart.locator("text.recharts-text.fill-muted-foreground");
    await settled(titles);
    const drawn = await titles.evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent,
        transform: el.getAttribute("transform"),
        box: el.getBoundingClientRect().toJSON(),
      })),
    );
    const x = drawn.find((t) => t.text === "Hour of day (IST)");
    const y = drawn.find((t) => t.text === "Orders");
    const xTicks = await chart.locator(".recharts-xAxis-tick-labels").boundingBox();
    const yTicks = await chart.locator(".recharts-yAxis-tick-labels").boundingBox();
    if (!x || !y || !xTicks || !yTicks) throw new Error(`titles not drawn: ${JSON.stringify(drawn)}`);
    expect(x.box.top).toBeGreaterThanOrEqual(xTicks.y + xTicks.height - 1);
    expect(y.transform).toContain("rotate(-90");
    expect(y.box.right).toBeLessThanOrEqual(yTicks.x + 1);
  });

  it("a two-line x tick prints each row's figure under its name", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-xAxis-tick-labels text");
    await settled(ticks);
    const lines = await ticks.evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll("tspan")].map((t) => t.textContent)),
    );
    expect(lines).toEqual([
      ["FY22", "▲₹1.4L"],
      ["FY23", "▲₹1.9L"],
      ["FY24", "▼₹1.6L"],
      ["FY25", "▲₹1.3L"],
      ["FY26", "▼₹1.2L"],
    ]);
    // The second line sits under the first.
    const [name, detail] = await ticks
      .first()
      .locator("tspan")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(detail).toBeGreaterThan(name ?? Number.POSITIVE_INFINITY);
  });

  it("a bar below zero takes the series' negative colour, in the plot and the tooltip", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    expect(await bars.evaluateAll((els) => els.map((el) => el.getAttribute("fill")))).toEqual([
      "var(--positive)",
      "var(--positive)",
      "var(--negative)",
      "var(--positive)",
      "var(--negative)",
    ]);
    const { x, y } = await center(bars.nth(2));
    await tooltipAt(chart, x, y, "FY24");
    const swatch = chart.locator(".recharts-tooltip-wrapper span").first();
    expect(await swatch.evaluate((el) => (el as HTMLElement).style.backgroundColor)).toBe("var(--negative)");
  });

  it("a click picks a year, fading the others, and a second click clears it", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    // A faded bar mixes toward the card, opaque, so it stays readable on a dark card.
    const faded = async () => {
      await settled(bars);
      return bars.evaluateAll((els) => els.map((el) => (el.getAttribute("fill") ?? "").startsWith("color-mix")));
    };
    const none = [false, false, false, false, false];
    expect(await faded()).toEqual(none);
    await bars.nth(2).click();
    expect(await faded()).toEqual([true, true, false, true, true]);
    await expect.poll(() => chart.locator('[data-slot="card-description"]').innerText()).toContain("FY24 picked");
    await bars.nth(2).click();
    expect(await faded()).toEqual(none);
  });

  it("selects the full highlighted category outside the bar", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!grid) throw new Error("not laid out");
    const { x } = await center(bars.nth(2));
    await tooltipAt(chart, x, grid.y + 2, "FY24");
    await page.mouse.click(x, grid.y + 2);
    await expect.poll(() => chart.locator('[data-slot="card-description"]').innerText()).toContain("FY24 picked");
    await page.mouse.click(x, grid.y + 2);
    await expect
      .poll(() => bars.evaluateAll((els) => els.some((el) => (el.getAttribute("fill") ?? "").startsWith("color-mix"))))
      .toBe(false);
  });

  it("horizontal bars put the categories down the left, each name beside its own bars", async () => {
    await show("bar-chart");
    const chart = card("Sectors against the index");
    await chart.scrollIntoViewIfNeeded();
    const names = chart.locator(".recharts-yAxis-tick-labels text.recharts-cartesian-axis-tick-value");
    await settled(names);
    expect(await names.evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")))).toEqual([
      "Financial Services",
      "Information Technology",
      "Oil, Gas & Consumable Fuels",
      "Fast Moving Consumer Goods",
      "Automobile and Auto Components",
      "Healthcare",
    ]);
    const bars = chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle path");
    const lefts = new Set<number>();
    for (let i = 0; i < 6; i++) {
      const bar = await bars.nth(i).boundingBox();
      const name = await names.nth(i).boundingBox();
      if (!bar || !name) throw new Error("not laid out");
      // Bars grow rightwards from one baseline, right of the names; a sector's bar sits by its name's first line.
      lefts.add(Math.round(bar.x));
      expect(bar.x).toBeGreaterThanOrEqual(name.x + name.width);
      expect(Math.abs(bar.y - name.y)).toBeLessThan(24);
    }
    expect(lefts.size).toBe(1);
  });

  it("two-line ticks remain readable and do not overlap in a narrow scrolling chart", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    const fill = (selector: string) =>
      chart
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fill);
    await chart.scrollIntoViewIfNeeded();
    await settled(chart.locator(".recharts-xAxis-tick-labels text"));
    // Every tick takes the theme's muted colour, not Recharts' fixed #666, so it follows the scheme.
    const muted = await chart.evaluate((el) => {
      const probe = el.appendChild(document.createElement("span"));
      probe.style.color = "var(--muted-foreground)";
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(await fill(".recharts-xAxis-tick-labels text")).toBe(muted);
    expect(await fill(".recharts-yAxis-tick-labels text")).toBe(muted);
    // Exact ticks retain their natural glyph width; the chart scrolls when they need more space.
    await page.setViewportSize({ width: 320, height: 900 });
    try {
      await chart.scrollIntoViewIfNeeded();
      const lines = chart.locator(".recharts-xAxis-tick-labels tspan");
      await settled(lines);
      const boxes = await lines.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
      // tspans alternate name, detail, name, detail…; neighbouring years' lines must not overlap.
      for (const row of [0, 1]) {
        const line = boxes.filter((_, i) => i % 2 === row);
        for (let i = 1; i < line.length; i++) expect(line[i].left).toBeGreaterThanOrEqual(line[i - 1].right);
      }
    } finally {
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });

  it("stacked bars put negative values below zero, not hanging from the positive stack", async () => {
    await show("bar-chart");
    const chart = card("Cash in and out by month");
    await chart.scrollIntoViewIfNeeded();
    const layers = chart.locator(".recharts-bar");
    await settled(chart.locator(".recharts-bar-rectangle"));
    const zero = await chart.locator(".recharts-reference-line line").first().boundingBox();
    if (!zero) throw new Error("no zero line");
    const ins = await layers
      .nth(0)
      .locator(".recharts-bar-rectangle path")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
    const outs = await layers
      .nth(1)
      .locator(".recharts-bar-rectangle path")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
    // Within a pixel and a half: bar edges and the zero line round to different half pixels.
    for (const bar of ins) expect(Math.abs(bar.bottom - zero.y)).toBeLessThanOrEqual(1.5);
    for (const bar of outs) expect(Math.abs(bar.top - zero.y)).toBeLessThanOrEqual(1.5);
  });

  it("sideways, a value level runs down the plot at its value on the fixed axis", async () => {
    await show("bar-chart");
    const chart = card("Sectors against the index");
    await chart.scrollIntoViewIfNeeded();
    const line = chart.locator(".recharts-reference-line line");
    await settled(line);
    const cap = await line.boundingBox();
    const bars = await chart
      .locator(".recharts-bar-rectangle path")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
    if (!cap || bars.length === 0) throw new Error("not laid out");
    // The value axis starts where every bar does and runs 0 to 40%; the 30% cap sits three quarters along it.
    const start = Math.min(...bars.map((bar) => bar.left));
    const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
    if (!grid) throw new Error("not laid out");
    expect(cap.height).toBeGreaterThan(cap.width);
    expect(await line.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(Math.abs(cap.x - (start + 0.75 * (grid.x + grid.width - start)))).toBeLessThanOrEqual(1.5);
    expect(await chart.locator("text.recharts-text.fill-muted-foreground.text-xs").allTextContents()).toEqual([
      "cap 30%",
    ]);
  });

  it("a value formatter is called with the value alone, so its own second parameter keeps its default", async () => {
    await show("line-chart");
    const chart = card("Return against the index");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await settled(ticks);
    // pct(value, fractionDigits = 1): handed Recharts' tick index as its second argument it would print 0, 1, 2… decimals.
    for (const tick of await ticks.allTextContents()) expect(tick).toMatch(/^-?\d+\.\d%$/);
  });

  it("draws every explicit x tick inside the chart, the ones at both ends of the domain included", async () => {
    await show("limits-and-events");
    const chart = card("Memory in use, GiB");
    const all = ["15:00", "15:10", "15:20", "15:30", "15:40", "15:50", "16:00", "16:10"];
    const ticks = chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
    // At 1920 the dash Dell page lost its first label; check there and at a phone's width.
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: 900 });
      try {
        await chart.scrollIntoViewIfNeeded();
        await settled(ticks);
        expect(await ticks.allTextContents(), `at ${width}px`).toEqual(all);
        // The last label sits on the domain's right end; it must end inside the chart, not be cut at its edge.
        const last = await ticks.last().boundingBox();
        const surface = await chart.locator("svg.recharts-surface").boundingBox();
        if (!last || !surface) throw new Error("not laid out");
        expect(last.x + last.width, `at ${width}px`).toBeLessThanOrEqual(surface.x + surface.width);
      } finally {
        await page.setViewportSize({ width: 1280, height: 900 });
      }
    }
  });

  it("names each mark after its series, and no mark on the page carries a name of undefined", async () => {
    await show("bar-chart");
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    expect(await bars.count()).toBeGreaterThan(0);
    expect(await chart.locator('.recharts-bar-rectangle path[name="Net realized"]').count()).toBe(await bars.count());
    expect(await page.locator('.recharts-surface [name="undefined"]').count()).toBe(0);
  });
});
