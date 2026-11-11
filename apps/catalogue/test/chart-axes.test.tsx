// Stacking, axes, reference lines, curves and selection.
import { describe, expect, it } from "vite-plus/test";
import { card, center, page, q1Lefts, quarterLines, settled, show, tooltipAt, useChartPage } from "./chart-page";

useChartPage();

describe("chart cards", { timeout: 60_000 }, () => {
  it("the quarterly bar example starts grouped and stacks on Stacked", async () => {
    await show("bar-chart");
    // A fresh page, so the default is what this reads and not a layout an earlier test chose.
    await page.reload();
    const chart = card("Revenue by channel and quarter");
    await chart.scrollIntoViewIfNeeded();
    expect((await q1Lefts(chart)).size).toBe(5);
    await chart.getByRole("button", { name: "Stacked" }).click();
    expect((await q1Lefts(chart)).size).toBe(1);
  });

  it("the quarterly bar example's stacked tooltip lists every series at the hovered quarter", async () => {
    await show("bar-chart");
    const chart = card("Revenue by channel and quarter");
    await chart.scrollIntoViewIfNeeded();
    await chart.getByRole("button", { name: "Stacked" }).click();
    // Grouped and stacked tooltips list the same figures, so prove the bars are stacked first.
    expect((await q1Lefts(chart)).size).toBe(1);
    const q1Online = chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle").first();
    const { x, y } = await center(q1Online);
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
        const line = g.querySelector(".recharts-reference-line-line");
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
    const chart = card("Operating loss by financial year");
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
    const limit = await chart.locator(".recharts-reference-line-line").first().boundingBox();
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
    const chart = card("Profit by financial year");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-xAxis-tick-labels text");
    await settled(ticks);
    const lines = await ticks.evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll("tspan")].map((t) => t.textContent)),
    );
    expect(lines).toEqual([
      ["FY22", "+₹1.4L"],
      ["FY23", "+₹1.9L"],
      ["FY24", "−₹1.6L"],
      ["FY25", "+₹1.3L"],
      ["FY26", "−₹1.2L"],
    ]);
    // The second line sits under the first.
    const [name, detail] = await ticks
      .first()
      .locator("tspan")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(detail).toBeGreaterThan(name ?? Number.POSITIVE_INFINITY);
  });

  it("a bar below zero takes the series' negative colour, as a tint inside a full edge, and in the tooltip", async () => {
    await show("bar-chart");
    const chart = card("Profit by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    await settled(bars);
    expect(await bars.evaluateAll((els) => els.map((el) => el.getAttribute("stroke")))).toEqual([
      "var(--positive)",
      "var(--positive)",
      "var(--negative)",
      "var(--positive)",
      "var(--negative)",
    ]);
    expect(await bars.nth(2).getAttribute("fill")).toBe(
      "color-mix(in oklab, var(--negative) var(--bar-tint), var(--card))",
    );
    const { x, y } = await center(bars.nth(2));
    await tooltipAt(chart, x, y, "FY24");
    const swatch = chart.locator(".recharts-tooltip-wrapper span").first();
    expect(await swatch.evaluate((el) => (el as HTMLElement).style.backgroundColor)).toBe("var(--negative)");
  });

  it("a click picks a year, fading the others, and a second click clears it", async () => {
    await show("bar-chart");
    const chart = card("Profit by financial year");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle path");
    // A faded bar's interior mixes further toward the card; its outline stays at full colour, so it keeps 3:1.
    const faded = async () => {
      await settled(bars);
      return bars.evaluateAll((els) => els.map((el) => (el.getAttribute("fill") ?? "").includes(" 10%")));
    };
    const none = [false, false, false, false, false];
    expect(await faded()).toEqual(none);
    await bars.nth(2).click();
    expect(await faded()).toEqual([true, true, false, true, true]);
    expect(await bars.evaluateAll((els) => els.every((el) => el.getAttribute("stroke")?.startsWith("var(--")))).toBe(
      true,
    );
    await expect.poll(() => chart.locator('[data-slot="card-description"]').innerText()).toContain("FY24 picked");
    await bars.nth(2).click();
    expect(await faded()).toEqual(none);
  });

  it("selects the full highlighted category outside the bar", async () => {
    await show("bar-chart");
    const chart = card("Profit by financial year");
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
      .poll(() => bars.evaluateAll((els) => els.some((el) => (el.getAttribute("fill") ?? "").includes(" 10%"))))
      .toBe(false);
  });
});
