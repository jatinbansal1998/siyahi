// Reads the chart picks in Chromium: names at the line ends, quiet series, forecast and today, gridlines, tinted bars,
// motion and stale blocks. Recharts lays charts out from measured sizes, which happy-dom does not have.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/chart-panels");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Goes to a family's route and waits for its page, by its title, so no locator reads the page it left. */
const open = async (route: string, title: string): Promise<Locator> => {
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
  const preview = page.locator('[data-slot="example-preview"]').first();
  await preview.locator(".recharts-surface").first().waitFor();
  return preview;
};

const card = (scope: Locator, title: string): Locator =>
  scope.locator('[data-slot="card"]', { has: page.locator('[data-slot="card-title"]', { hasText: title }) });

const names = (chart: Locator): Promise<string[]> => chart.locator('[data-slot="end-labels"] text').allTextContents();

describe("chart ink", { timeout: 60_000 }, () => {
  it("names each line at its end in a gutter, spread 14px apart where ends crowd, with no legend", async () => {
    const funds = card(await open("data/chart-panels", "Chart panels"), "Growth by fund");
    await expect.poll(() => names(funds)).toEqual(["Gold", "Nifty 50", "Flexi cap", "Debt", "Small cap"]);
    expect(await funds.locator(".recharts-legend-wrapper").count()).toBe(0);
    const ys = await funds
      .locator('[data-slot="end-labels"] text')
      .evaluateAll((texts) => texts.map((text) => Number(text.getAttribute("y"))));
    expect(ys.slice(1).every((y, i) => y - (ys[i] ?? 0) >= 13.99)).toBe(true);
    // The names sit right of the plot, past the last point.
    const grid = await funds.locator(".recharts-cartesian-grid").boundingBox();
    const first = await funds.locator('[data-slot="end-labels"] text').first().boundingBox();
    expect(first && grid && first.x).toBeGreaterThanOrEqual((grid?.x ?? 0) + (grid?.width ?? 0));
  });

  it("falls back to a legend below on a phone", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    try {
      const funds = card(await open("data/chart-panels", "Chart panels"), "Growth by fund");
      await expect.poll(() => funds.locator(".recharts-legend-wrapper").count()).toBe(1);
      expect(await funds.locator('[data-slot="end-labels"]').count()).toBe(0);
    } finally {
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });

  it("draws quiet series first in grey and gives them one shared name", async () => {
    const funds = card(await open("data/many-series", "Many series"), "Growth by fund");
    await expect.poll(() => names(funds)).toEqual(["Gold", "Nifty 50", "6 other funds"]);
    const strokes = await funds
      .locator(".recharts-line:not(.chart-forecast) .recharts-line-curve")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("stroke")));
    expect(strokes).toEqual([...Array(6).fill("var(--muted-foreground)"), "var(--chart-1)", "var(--chart-2)"]);
  });

  it("dashes a forecast after its point over a hatched band, hollows its end dots and rules today in the link colour", async () => {
    const chart = card(await open("data/forecast-and-today", "Forecast and today"), "Growth against plan");
    const forecast = chart.locator(".recharts-line.chart-forecast .recharts-line-curve");
    await expect.poll(() => forecast.count()).toBe(2);
    // Recharts animates the dash while a line draws in; once drawn, the forecast copy keeps its own.
    await expect.poll(() => forecast.first().getAttribute("stroke-dasharray")).toMatch(/^5(px)?,? 4(px)?/);
    // Each copy is clipped to its side of the forecast point.
    const clips = await chart
      .locator(".recharts-line")
      .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));
    expect(clips.every((clip) => clip.startsWith("url("))).toBe(true);
    const marks = chart.locator('[data-slot="time-marks"]');
    expect(await marks.locator("rect[fill^='url(']").count()).toBe(1);
    expect(await marks.locator("text").allTextContents()).toEqual(["Forecast", "Today"]);
    expect(await marks.locator("line").last().getAttribute("stroke")).toBe("var(--link)");
    // One end dot per line, hollow: the solid copy draws none past the forecast point.
    const dots = chart.locator(".recharts-line-dots circle");
    await expect.poll(() => dots.count()).toBe(2);
    expect(await dots.evaluateAll((circles) => circles.map((circle) => circle.getAttribute("fill")))).toEqual([
      "var(--card)",
      "var(--card)",
    ]);
  });

  it("draws solid gridlines and no fill under overlapping areas", async () => {
    const panels = await open("data/chart-panels", "Chart panels");
    const grid = panels.locator(".recharts-cartesian-grid line").first();
    expect(await grid.evaluate((line) => getComputedStyle(line).strokeDasharray)).toBe("none");
    const fills = await card(panels, "Value by kind")
      .locator(".recharts-area-area")
      .evaluateAll((areas) => areas.map((area) => area.getAttribute("fill")));
    expect(fills.length).toBeGreaterThan(0);
    expect(fills.every((fill) => fill === "none")).toBe(true);
  });

  it("draws every bar as a tint inside a 1px edge of its colour, fading in", async () => {
    const bars = card(await open("data/chart-panels", "Chart panels"), "Money added by kind and quarter").first();
    const bar = bars.locator(".recharts-bar-rectangle path").first();
    await bar.waitFor();
    const [fill, stroke, width] = await bar.evaluate((path) => [
      path.getAttribute("fill"),
      path.getAttribute("stroke"),
      path.getAttribute("stroke-width"),
    ]);
    expect([fill, stroke, width]).toEqual([
      "color-mix(in oklab, var(--chart-1) 35%, var(--card))",
      "var(--chart-1)",
      "1",
    ]);
    expect(
      await bars
        .locator(".recharts-bar-rectangles")
        .first()
        .evaluate((g) => getComputedStyle(g).animationName),
    ).toBe("chart-fade-in");
  });

  it("greys a block the page marks stale and says since when", async () => {
    const stale = await open("data/stale-data", "Stale data");
    const tile = stale.locator('[data-slot="section-card"] [data-slot="card"]', { hasText: "Gift cards" });
    expect(await tile.locator('[data-slot="stale-note"]').textContent()).toBe("Stale · 3 Nov");
    expect(await tile.locator('[data-slot="card-title"]').evaluate((el) => getComputedStyle(el).color)).toBe(
      await themeColor(page, "--muted-foreground"),
    );
    const fresh = stale.locator('[data-slot="section-card"] [data-slot="card"]', { hasText: "Revenue" });
    expect(await fresh.locator('[data-slot="stale-note"]').count()).toBe(0);
    const chart = card(stale, "Value by kind");
    expect(await chart.locator('[data-slot="stale-note"]').textContent()).toBe("Stale · 3 Nov");
    expect(await chart.locator('[data-slot="chart"]').evaluate((el) => getComputedStyle(el).filter)).toBe(
      "grayscale(1)",
    );
    // Grey, not faded: the marks keep the lightness that gives them 3:1 against the card.
    expect(
      await chart
        .locator(".recharts-area")
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    ).toBe("1");
  });
});
