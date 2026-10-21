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
    const chart = card("Money invested by quarter");
    await chart.scrollIntoViewIfNeeded();
    const bars = chart.locator(".recharts-bar-rectangle");
    // Recharts draws each series in its own layer, one bar per quarter in axis order,
    // so the first bar of every layer is Q1's, however many quarters there are.
    const q1Lefts = async (): Promise<Set<number>> => {
      await settled(bars);
      const lefts = await chart
        .locator(".recharts-bar")
        .evaluateAll((layers) =>
          layers.map((layer) =>
            Math.round(layer.querySelector(".recharts-bar-rectangle")?.getBoundingClientRect().left ?? NaN),
          ),
        );
      return new Set(lefts);
    };
    expect((await q1Lefts()).size).toBe(5);
    await chart.getByRole("button", { name: "Stacked" }).click();
    expect((await q1Lefts()).size).toBe(1);
  });

  it("the quarterly bar example's stacked tooltip lists every series at the hovered quarter", async () => {
    const chart = card("Money invested by quarter");
    await chart.scrollIntoViewIfNeeded();
    // Pressing the selected item keeps it, so this stacks whatever ran before.
    await chart.getByRole("button", { name: "Stacked" }).click();
    const bars = chart.locator(".recharts-bar-rectangle");
    await settled(bars);
    const q1Equity = chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle").first();
    const { x, y } = await center(q1Equity);
    expect(await tooltipAt(chart, x, y, "Q1")).toEqual(
      quarterLines("Q1", "₹1,20,000", "₹40,000", "₹15,000", "₹9,000", "₹4,000"),
    );
  });
});
