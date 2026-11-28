// Sideways and stacked bars, ticks at the domain's ends, mark names, waterfalls and legends.
import { describe, expect, it } from "vite-plus/test";
import type { Locator } from "playwright";
import { card, center, onePlot, page, settled, show, tooltipAt, useChartPage } from "./chart-page";

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Hovers bar `index`, waits for its category's tooltip to come to rest, and gives the tooltip's and every bar's box. */
async function hoverBar(chart: Locator, index: number, heading: string) {
  await chart.scrollIntoViewIfNeeded();
  const bars = chart.locator(".recharts-bar-rectangle");
  await settled(bars);
  const { x, y } = await center(bars.nth(index));
  await tooltipAt(chart, x, y, heading);
  const tooltip = chart.locator(".recharts-tooltip-wrapper");
  await settled(tooltip);
  const boxes = await bars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as Box));
  return { tooltip: (await tooltip.boundingBox())!, card: (await chart.boundingBox())!, bars: boxes };
}

useChartPage();

describe("chart cards", { timeout: 60_000 }, () => {
  it("horizontal bars put the categories down the left, each name beside its own bars", async () => {
    await show("bar-chart");
    const chart = card("Spend by team against plan or last year");
    await chart.scrollIntoViewIfNeeded();
    const names = chart.locator(".recharts-yAxis-tick-labels text.recharts-cartesian-axis-tick-value");
    await settled(names);
    expect(await names.evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")))).toEqual([
      "Engineering and Infrastructure",
      "Sales and Business Development",
      "Finance, Legal & Compliance",
      "Marketing and Communications",
      "Customer Support and Success",
      "Operations",
    ]);
    const bars = chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle path");
    const lefts = new Set<number>();
    for (let i = 0; i < 6; i++) {
      const bar = await bars.nth(i).boundingBox();
      const name = await names.nth(i).boundingBox();
      if (!bar || !name) throw new Error("not laid out");
      // Bars grow rightwards from one baseline, right of the names; a team's bar sits by its name's first line.
      lefts.add(Math.round(bar.x));
      expect(bar.x).toBeGreaterThanOrEqual(name.x + name.width);
      expect(Math.abs(bar.y - name.y)).toBeLessThan(24);
    }
    expect(lefts.size).toBe(1);
  });

  it("two-line ticks remain readable and do not overlap in a narrow scrolling chart", async () => {
    await show("bar-chart");
    const chart = card("Profit by financial year");
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
    const zero = await chart.locator(".recharts-reference-line-line").first().boundingBox();
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
    const chart = card("Spend by team against plan or last year");
    await chart.scrollIntoViewIfNeeded();
    const line = chart.locator(".recharts-reference-line-line");
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
    const chart = card("Sales growth against the category");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await settled(ticks);
    // pct(value, fractionDigits = 1): handed Recharts' tick index as its second argument it would print 0, 1, 2… decimals.
    for (const tick of await ticks.allTextContents()) expect(tick).toMatch(/^−?\d+\.\d%$/);
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

  it("sideways, the value axis keeps only ticks whose labels fit apart, the last centred on the plot's end", async () => {
    await show("bar-chart");
    const chart = card("Foreign buying by sector");
    const ticks = chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
    // At 390 the crore labels ran into each other; at every width the last ran 7px past the chart.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      try {
        await chart.scrollIntoViewIfNeeded();
        await settled(ticks);
        const boxes = await ticks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as Box));
        expect(boxes.length, `at ${width}px`).toBeGreaterThanOrEqual(2);
        for (const [i, box] of boxes.slice(1).entries()) {
          expect(box.x, `tick ${i + 1} at ${width}px`).toBeGreaterThanOrEqual(boxes[i]!.x + boxes[i]!.width);
        }
        const last = boxes.at(-1)!;
        const surface = await chart.locator("svg.recharts-surface").boundingBox();
        if (!surface) throw new Error("not laid out");
        expect(last.x + last.width, `at ${width}px`).toBeLessThanOrEqual(surface.x + surface.width);
        // Still on its gridline, the domain's end: kept inside by room past the plot, not by sliding off its value.
        const end = await chart
          .locator(".recharts-cartesian-grid-vertical line")
          .evaluateAll((lines) => Math.max(...lines.map((line) => line.getBoundingClientRect().x)));
        expect(Math.abs(last.x + last.width / 2 - end), `at ${width}px`).toBeLessThanOrEqual(1);
      } finally {
        await page.setViewportSize({ width: 1280, height: 900 });
      }
    }
  });

  it("names each mark after its series, and no mark on the page carries a name of undefined", async () => {
    await show("bar-chart");
    const chart = card("Profit by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    expect(await bars.count()).toBeGreaterThan(0);
    expect(await chart.locator('.recharts-bar-rectangle path[name="Net profit"]').count()).toBe(await bars.count());
    expect(await page.locator('.recharts-surface [name="undefined"]').count()).toBe(0);
  });

  it("a waterfall's tooltip gives the step's signed change and the running total after it", async () => {
    await show("waterfall-chart");
    const chart = card("Profit for the year, month by month");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await expect.poll(() => bars.count()).toBe(13);
    await settled(bars);
    await onePlot(chart);
    const { x, y } = await center(bars.nth(2));
    expect(await tooltipAt(chart, x, y, "Jun")).toEqual(["Jun", "Loss", "−₹12,000", "Running total", "₹68,000"]);
  });

  it("a waterfall's dashed line carries each level to the edge of the next bar", async () => {
    await show("waterfall-chart");
    const chart = card("Profit for the year, month by month");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    const lines = chart.locator(".recharts-reference-line-line");
    await expect.poll(() => lines.count()).toBe(12);
    // April rises from zero, so its line runs along April's top, where May starts.
    const geometry = await chart.evaluate((el) => {
      const [line, april, may] = [
        el.querySelector(".recharts-reference-line-line"),
        ...el.querySelectorAll(".recharts-bar-rectangle path"),
      ].map((node) =>
        Object.fromEntries(
          ["x", "y", "width", "height", "x1", "x2", "y1", "y2"].map((name) => [name, Number(node?.getAttribute(name))]),
        ),
      );
      if (!line || !april || !may) throw new Error("not drawn");
      return {
        line: { y: line.y1!, y2: line.y2!, from: line.x1!, to: line.x2! },
        april: { top: april.y!, right: april.x! + april.width! },
        may: { bottom: may.y! + may.height!, left: may.x! },
      };
    });
    expect(geometry.line.y2).toBe(geometry.line.y);
    expect(geometry.line.y).toBeCloseTo(geometry.april.top, 1);
    expect(geometry.line.y).toBeCloseTo(geometry.may.bottom, 1);
    // It spans the gap between the two bars.
    expect(geometry.line.from).toBeLessThan(geometry.april.right);
    expect(geometry.line.to).toBeGreaterThan(geometry.may.left);
  });

  it("puts a tooltip clear of the marks beside the hovered category, inside the card", async () => {
    await show("bar-chart");
    // Columns: hovering Q2's revenue, the tooltip had covered Q3's tallest bar. Bar i is quarter i % 4.
    const quarters = await hoverBar(card("Revenue by channel and quarter"), 1, "Q2");
    const others = quarters.bars.filter((_, i) => i % 4 !== 1);
    expect(others.filter((bar) => overlaps(bar, quarters.tooltip))).toEqual([]);
    expect(quarters.tooltip.x).toBeGreaterThanOrEqual(quarters.card.x);
    expect(quarters.tooltip.x + quarters.tooltip.width).toBeLessThanOrEqual(quarters.card.x + quarters.card.width);
    // Sideways bars: the tooltip goes right of the bars beside it. Bar i is team i % 6.
    const teams = await hoverBar(card("Spend by team against plan or last year"), 2, "Finance, Legal & Compliance");
    expect(teams.bars.filter((bar) => overlaps(bar, teams.tooltip))).toEqual([]);
    // A line chart's tooltip leaves the hovered points in view: at 1440 wide there is no room above July's.
    await page.setViewportSize({ width: 1440, height: 900 });
    const growth = card("Sales growth against the category");
    await show("line-chart");
    await growth.scrollIntoViewIfNeeded();
    const tick = growth.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value").nth(2);
    await settled(tick);
    const grid = (await growth.locator(".recharts-cartesian-grid").boundingBox())!;
    await tooltipAt(growth, (await center(tick)).x, grid.y + grid.height / 2, "Jul");
    await settled(growth.locator(".recharts-tooltip-wrapper"));
    const tooltip = (await growth.locator(".recharts-tooltip-wrapper").boundingBox())!;
    const dots = await growth
      .locator(".recharts-active-dot")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as Box));
    expect(dots.length).toBe(2);
    expect(dots.filter((dot) => overlaps(dot, tooltip))).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  it("shows the band behind a hovered category at 40%, so a pale bar keeps 3:1 against it", async () => {
    await show("bar-chart");
    const chart = card("Orders by hour");
    await chart.scrollIntoViewIfNeeded();
    const bar = chart.locator(".recharts-bar-rectangle").nth(3);
    const { x, y } = await center(bar);
    await page.mouse.move(x, y);
    const cursor = chart.locator(".recharts-tooltip-cursor");
    await expect.poll(() => cursor.count()).toBe(1);
    expect(await cursor.evaluate((el) => getComputedStyle(el).fillOpacity)).toBe("0.4");
  });

  it("wraps a five-series legend on a phone instead of running it past the card", async () => {
    await show("bar-chart");
    await page.setViewportSize({ width: 390, height: 900 });
    const chart = card("Revenue by channel and quarter");
    await chart.scrollIntoViewIfNeeded();
    const items = chart.locator(".recharts-legend-wrapper > div > div");
    await expect.poll(() => items.count()).toBe(5);
    const frame = (await chart.boundingBox())!;
    const boxes = await items.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
    expect(boxes.filter((box) => box.left < frame.x || box.right > frame.x + frame.width)).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 900 });
  });
  it("draws each average as a line over its bars, keyed by a stroke, with the band behind the hovered month", async () => {
    await show("bar-chart");
    const chart = card("Orders by month, with the trend");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle");
    await settled(bars);
    await onePlot(chart);
    const { x, y } = await center(bars.nth(6));
    expect(await tooltipAt(chart, x, y, "Jul")).toEqual([
      "Jul",
      "Online",
      "690",
      "In store",
      "330",
      "Online, 3-month average",
      "590",
      "In store, 3-month average",
      "310",
    ]);
    // A bar chart's band, not the hairline Recharts draws for a ComposedChart.
    expect(await chart.locator(".recharts-tooltip-cursor").getAttribute("class")).toContain("recharts-rectangle");
    expect(await chart.locator('.recharts-legend-wrapper [data-slot="line-swatch"]').count()).toBe(2);
    // Drawn after the bars, so the lines sit over them.
    expect(
      await chart.evaluate((el) => {
        const lastBars = [...el.querySelectorAll(".recharts-bar")].at(-1)!;
        const firstLine = el.querySelector(".recharts-line")!;
        return Boolean(lastBars.compareDocumentPosition(firstLine) & Node.DOCUMENT_POSITION_FOLLOWING);
      }),
    ).toBe(true);
  });
});
