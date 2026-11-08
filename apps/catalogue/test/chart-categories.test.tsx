// Category ticks, phones, and the hovered values of the bar, area and line cards.
import { describe, expect, it } from "vite-plus/test";
import {
  card,
  center,
  growthLines,
  hoverEachBar,
  hoverEachPoint,
  page,
  quarterLines,
  revenueLines,
  settled,
  show,
  tooltipAt,
  useChartPage,
} from "./chart-page";

useChartPage();

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
      const chart = card("Orders by category");
      await chart.scrollIntoViewIfNeeded();
      const ticks = chart.locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
      await settled(ticks);
      expect(await ticks.first().getAttribute("aria-label")).toBe("Home Appliances and Kitchen Equipment");
      const bars = chart.locator(".recharts-bar-rectangle");
      expect(await bars.count()).toBe(3);
      const grid = await chart.locator(".recharts-cartesian-grid").boundingBox();
      const surface = await chart.locator("svg.recharts-surface").boundingBox();
      expect(grid?.width).toBeGreaterThan((surface?.width ?? 0) * 0.4);
      const { x, y } = await center(bars.first());
      expect(await tooltipAt(chart, x, y, "Home Appliances and Kitchen Equipment")).toEqual([
        "Home Appliances and Kitchen Equipment",
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
        const chart = card("Spend by team against plan or last year");
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
    await hoverEachBar("Revenue by channel and quarter", [
      quarterLines("Q1", "₹1,20,000", "₹40,000", "₹15,000", "₹9,000", "₹4,000"),
      quarterLines("Q2", "₹95,000", "₹52,000", "₹20,000", "₹6,000", "₹3,000"),
      quarterLines("Q3", "₹1,40,000", "₹38,000", "₹12,000", "₹11,000", "₹5,000"),
      quarterLines("Q4", "₹1,60,000", "₹45,000", "₹25,000", "₹7,000", "₹2,000"),
    ]);
  });

  it("AreaChartCard names the hovered month and its formatted values", async () => {
    await show("area-chart");
    await hoverEachPoint("October revenue ₹4.9L ahead of target", [
      revenueLines("May", "₹36,00,000", "₹38,20,000"),
      revenueLines("Jun", "₹36,85,000", "₹39,50,000"),
      revenueLines("Jul", "₹37,70,000", "₹41,10,000"),
      revenueLines("Aug", "₹38,55,000", "₹40,20,000"),
      revenueLines("Sep", "₹39,40,000", "₹43,80,000"),
      revenueLines("Oct", "₹40,25,000", "₹45,12,300"),
    ]);
  });

  it("LineChartCard names the hovered month and its formatted values", async () => {
    await show("line-chart");
    await hoverEachPoint("Sales growth against the category", [
      growthLines("May", "1.2%", "0.8%"),
      growthLines("Jun", "2.1%", "1.5%"),
      growthLines("Jul", "3.4%", "2.9%"),
      growthLines("Aug", "-0.6%", "0.4%"),
      growthLines("Sep", "4.1%", "3.1%"),
      growthLines("Oct", "5.2%", "3.6%"),
    ]);
  });
});
