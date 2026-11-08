// The catalogue's chart examples in Chromium, shared by the chart-*.test.tsx suites. happy-dom cannot hover a
// chart: Recharts picks the hovered point from laid-out pixel positions. The suites are split only so they run
// side by side; each opens its own page.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, expect } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

export let page: Page;

/** Opens the chart page before the suite's tests and closes it after them. */
export function useChartPage(): void {
  let catalogue: Catalogue | undefined;
  beforeAll(async () => {
    catalogue = await openCatalogue("data/bar-chart");
    page = catalogue.page;
  }, 60_000);
  afterAll(async () => {
    await catalogue?.close();
  });
}

/** Opens a Data family's own route: the Data page itself only links to the families. */
export async function show(family: string): Promise<void> {
  const hash = `#/data/${family}`;
  if ((await page.evaluate(() => location.hash)) !== hash) {
    await page.evaluate((next) => {
      location.hash = next;
    }, hash);
  }
  await page.locator(`#${family} [data-slot="example-preview"]`).first().waitFor();
}

export const card = (title: string): Locator =>
  page.locator('[data-slot="card"]', { has: page.getByText(title, { exact: true }) });

export const center = async (target: Locator): Promise<{ x: number; y: number }> => {
  // A chart re-renders its marks as it animates in; wait for this one to be on the page before measuring it.
  // Recharts swaps a mark's element when the tooltip re-renders it, so a box read in that moment is empty; read again.
  let box: Awaited<ReturnType<Locator["boundingBox"]>> = null;
  await expect
    .poll(async () => {
      await target.waitFor({ state: "visible" });
      box = await target.boundingBox();
      return box !== null;
    })
    .toBe(true);
  if (!box) throw new Error("not laid out");
  const { x, y, width, height } = box;
  return { x: x + width / 2, y: y + height / 2 };
};

/** Waits until the targets stop moving: the chart resizes to its card and animates in after the first paint. */
export async function settled(targets: Locator): Promise<void> {
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
export async function tooltipAt(chart: Locator, x: number, y: number, heading: string): Promise<string[]> {
  await page.mouse.move(x, y);
  const tooltip = chart.locator(".recharts-tooltip-wrapper");
  // Wait for this point's tooltip, so a wrong heading fails on the comparison below.
  await expect.poll(async () => (await tooltip.innerText()).split("\n")[0], { timeout: 2000 }).toBe(heading);
  return (await tooltip.innerText()).split("\n").filter(Boolean);
}

/** One x axis and one y axis: a mark that misses its axis by id makes Recharts add a second one and split the plot (dash#88). */
export async function onePlot(chart: Locator): Promise<void> {
  expect(await chart.locator(".recharts-xAxis").count()).toBe(1);
  expect(await chart.locator(".recharts-yAxis").count()).toBe(1);
}

/** Hovers the plot above each x axis tick, as a reader sliding along an area or line chart does. */
export async function hoverEachPoint(title: string, expected: string[][]): Promise<void> {
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
export async function hoverEachBar(title: string, expected: string[][]): Promise<void> {
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
export async function q1Lefts(chart: Locator): Promise<Set<number>> {
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

export const quarterLines = (quarter: string, ...values: string[]) => [
  quarter,
  ...["Online", "Retail", "Wholesale", "Marketplace", "Events"].flatMap((label, i) => [label, values[i] ?? ""]),
];
// The tooltip lists the series in their order: revenue first, then the target.
export const revenueLines = (month: string, target: string, revenue: string) => [
  month,
  "Revenue",
  revenue,
  "Target",
  target,
];
export const growthLines = (month: string, store: string, category: string) => [
  month,
  "Our store",
  store,
  "Category average",
  category,
];
