// Hovers every bar and point of the catalogue's chart examples in Chromium
// and reads the tooltip. happy-dom cannot do this: Recharts picks the hovered
// point from laid-out pixel positions.
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Locator, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

let server: ViteDevServer;
let browser: Browser;
let page: Page;

beforeAll(async () => {
  server = await createServer({
    configFile: at("../vite.config.ts"),
    root: at(".."),
    logLevel: "error",
    server: { port: 0 },
    // The package from source, as the other tests use it, so no build is needed.
    resolve: {
      alias: [
        { find: /^@siyahi\/ui$/, replacement: at("../../../packages/ui/src/index.ts") },
        { find: /^@siyahi\/ui\/styles\.css$/, replacement: at("./from-source.css") },
        { find: /^@siyahi\/ui\/report\.css/, replacement: at("../../../packages/ui/report.css") },
        { find: /^@siyahi\/ui\/(.*)$/, replacement: at("../../../packages/ui/src/$1") },
      ],
    },
  });
  await server.listen();
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${server.resolvedUrls?.local[0]}#/data`);
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const card = (title: string): Locator =>
  page.locator('[data-slot="card"]', { has: page.getByText(title, { exact: true }) });

const center = async (target: Locator): Promise<{ x: number; y: number }> => {
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
const valueLines = (month: string, invested: string, value: string) => [month, "Invested", invested, "Value", value];
const returnLines = (month: string, portfolio: string, index: string) => [
  month,
  "Portfolio",
  portfolio,
  "Nifty 50",
  index,
];

describe("chart cards", { timeout: 60_000 }, () => {
  it("BarChartCard names the hovered category and its formatted values", async () => {
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
    await hoverEachPoint("Portfolio value", [
      valueLines("May", "₹36,00,000", "₹38,20,000"),
      valueLines("Jun", "₹36,85,000", "₹39,50,000"),
      valueLines("Jul", "₹37,70,000", "₹41,10,000"),
      valueLines("Aug", "₹38,55,000", "₹40,20,000"),
      valueLines("Sep", "₹39,40,000", "₹43,80,000"),
      valueLines("Oct", "₹40,25,000", "₹45,12,300"),
    ]);
  });

  it("LineChartCard names the hovered month and its formatted values", async () => {
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
    // A fresh page, so the default is what this reads and not a layout an earlier test chose.
    await page.reload();
    const chart = card("Money invested by quarter");
    await chart.scrollIntoViewIfNeeded();
    expect((await q1Lefts(chart)).size).toBe(5);
    await chart.getByRole("button", { name: "Stacked" }).click();
    expect((await q1Lefts(chart)).size).toBe(1);
  });

  it("the quarterly bar example's stacked tooltip lists every series at the hovered quarter", async () => {
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
    // Recharts draws the labels in a layer of their own, in the lines' order.
    expect(await chart.locator("text.recharts-text.fill-muted-foreground").allTextContents()).toEqual([
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

  it("a fixed y domain and ticks hold the value axis at 0 to 100%", async () => {
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
    const chart = card("Memory pressure of a test group, %");
    await chart.scrollIntoViewIfNeeded();
    const path = chart.locator("path.recharts-line-curve");
    await settled(path);
    // A straight-segment path has only move and line commands; a monotone one has cubic curves (C).
    expect(await path.getAttribute("d")).toMatch(/^M[\d.,\sL-]+$/);
  });

  it("axis titles sit under the x ticks and beside the y ticks, read bottom to top", async () => {
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
    const chart = card("Realized by financial year");
    await chart.scrollIntoViewIfNeeded();
    const ticks = chart.locator(".recharts-xAxis-tick-labels text");
    await settled(ticks);
    const lines = await ticks.evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll("tspan")].map((t) => t.textContent)),
    );
    expect(lines).toEqual([
      ["FY21", "▲₹42,000"],
      ["FY22", "▲₹1.9L"],
      ["FY23", "▼₹64,000"],
      ["FY24", "▲₹1.3L"],
      ["FY25", "▼₹21,000"],
      ["FY26", "▲₹73,000"],
    ]);
    // The second line sits under the first.
    const [name, detail] = await ticks
      .first()
      .locator("tspan")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(detail).toBeGreaterThan(name ?? Number.POSITIVE_INFINITY);
  });
});
