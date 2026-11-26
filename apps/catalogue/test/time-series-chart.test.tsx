// The TimeSeriesChart example in Chromium: Lightweight Charts lays its panes out and moves its crosshair on real
// pointer events, which happy-dom has neither of.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/time-series-chart");
  page = catalogue.page;
  // The examples load before their charts draw; with other suites' browsers running, a chart can take seconds.
  for (const drawn of await page
    .locator('[data-slot="time-series-chart"]:not(:has([data-slot="chart-placeholder"]))')
    .all()) {
    await drawn.locator("table tr").first().waitFor({ state: "attached", timeout: 30_000 });
  }
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The page's chart cards, in the order of its examples: panes, price, candles, live, then stale and loading. */
const card = (index: number) =>
  page
    .locator("main [data-slot=card]")
    .filter({ has: page.locator('[data-slot="time-series-chart"]') })
    .nth(index);
const plot = (index: number) => card(index).locator('[data-slot="time-series-chart"]');
const chart = () => plot(0);
const legends = () => chart().locator('[data-slot="time-series-chart-legend"]');
/** Each pane's legend as [label, value] pairs, top pane first. */
const legendValues = (index = 0) =>
  plot(index)
    .locator('[data-slot="time-series-chart-legend"]')
    .evaluateAll((lists) =>
      lists.map((list) => [...list.querySelectorAll("li")].map((item) => item.innerText.split("\n"))),
    );
/** Everything the chart drew, as pixels. */
const pixels = (index: number) =>
  plot(index)
    .locator("canvas")
    .evaluateAll((canvases) => canvases.map((canvas) => (canvas as HTMLCanvasElement).toDataURL()).join());
const pressed = (index: number) => card(index).locator('[aria-pressed="true"]').allInnerTexts();

/** The plot's box on screen, after scrolling it into view. */
async function box(index: number) {
  await plot(index).scrollIntoViewIfNeeded();
  const bounds = await plot(index).boundingBox();
  if (!bounds) throw new Error("not laid out");
  return bounds;
}

/** The first series' value under a point `x` pixels into the plot: what the reader sees there. */
async function valueAt(index: number, x: number): Promise<string | undefined> {
  const { x: left, y: top } = await box(index);
  // Off and back on, so the crosshair reads the plot as it is now.
  await page.mouse.move(left + x, top - 30);
  await page.mouse.move(left + x, top + 60);
  await page.waitForTimeout(100);
  return (await legendValues(index))[0]?.[0]?.[1];
}

describe("TimeSeriesChart", { timeout: 60_000 }, () => {
  it("draws each pane at the height the page gives it, over one time axis, with its legend at its top", async () => {
    // The library lays out a table: a row per pane, a 1px divider between them, and the time axis last.
    await expect
      .poll(() =>
        chart()
          .locator("table tr")
          .evaluateAll((rows) => rows.map((row) => row.clientHeight)),
      )
      .toEqual([180, 1, 120, 1, 120, 28]);
    expect(await legends().evaluateAll((lists) => lists.map((list) => (list as HTMLElement).offsetTop))).toEqual([
      4, 185, 306,
    ]);
  });

  it("gives every line's latest value, the hovered date's in every pane, and the latest again off the chart", async () => {
    await expect.poll(async () => (await legendValues())[2]?.[1]?.[1]).toBe("62%");
    const latest = await legendValues();
    expect(latest).toEqual([
      [["Nifty 50 close", "25,820"]],
      [
        ["Foreign net contracts", "−59,476"],
        ["Retail net contracts", "+46,955"],
      ],
      [
        ["Foreign share long", "30%"],
        ["Retail share long", "62%"],
      ],
    ]);
    const { x, y, width } = await box(0);
    // In the bottom pane, a third of the way along: every pane's legend follows the one crosshair.
    await page.mouse.move(x + width / 3, y + 360);
    await expect.poll(async () => (await legendValues())[0]?.[0]?.[1]).not.toBe("25,820");
    const hovered = (await legendValues()).flat();
    for (const [index, [label, value]] of hovered.entries()) {
      expect(value, label).not.toBe(latest.flat()[index]?.[1]);
    }
    await page.mouse.move(x + width / 3, y - 40);
    await expect.poll(() => legendValues()).toEqual(latest);
  });

  it("shows the picked range up to the last point, and no range once the reader zooms by hand", async () => {
    expect(await pressed(0)).toEqual(["All"]);
    const whole = await valueAt(0, 200);
    await card(0).getByRole("button", { name: "1M" }).click();
    await expect.poll(() => pressed(0)).toEqual(["1M"]);
    // 250 sessions fill the plot on All; a month of them puts a later, higher close under the same point.
    await expect.poll(() => valueAt(0, 200)).not.toBe(whole);
    const { x, y } = await box(0);
    await page.mouse.move(x + 300, y + 60);
    await page.mouse.down();
    await page.mouse.move(x + 500, y + 60, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => pressed(0)).toEqual([]);
    await card(0).getByRole("button", { name: "All" }).click();
    await expect.poll(() => valueAt(0, 200)).toBe(whole);
  });

  it("leaves the wheel to the page until the reader clicks into the chart", async () => {
    const { x, y } = await box(0);
    const scrolled = () => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    const before = await valueAt(0, 500);
    const top = await scrolled();
    await page.mouse.wheel(0, 100);
    await expect.poll(scrolled).toBe(top + 100);
    await page.mouse.wheel(0, -100);
    await expect.poll(scrolled).toBe(top);
    expect(await valueAt(0, 500)).toBe(before);
    await page.mouse.move(x + 200, y + 60);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.wheel(0, -300);
    await expect.poll(() => valueAt(0, 500)).not.toBe(before);
    expect(await scrolled()).toBe(top);
    await card(0).getByRole("button", { name: "All" }).click();
  });

  it("opens on the page's range and draws the first pane on a log axis when the reader picks Log", async () => {
    await expect.poll(() => pressed(1)).toEqual(["1Y", "Linear"]);
    await card(1).getByRole("button", { name: "All" }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    const linear = await pixels(1);
    await card(1).getByRole("button", { name: "Log" }).click();
    await expect.poll(() => pixels(1)).not.toBe(linear);
  });

  it("writes a candlestick's open, high, low and close in its legend", async () => {
    await expect
      .poll(() => legendValues(2))
      .toEqual([
        [["Price", "O ₹1,664 H ₹1,684 L ₹1,640 C ₹1,656"]],
        [["Shares traded", "11,93,942"]],
        [["Gain on 100 shares", "+₹17,621"]],
      ]);
  });

  it("keeps the reader's view when new data arrives, and gives no value where one is missing", async () => {
    const { x, y, width } = await box(3);
    // Zoom in around the middle, then drag the latest reading out of view, so a new one cannot shift the view.
    await page.mouse.move(x + width / 2, y + 60);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.wheel(0, -600);
    await page.mouse.down();
    await page.mouse.move(x + width / 2 + 250, y + 60, { steps: 5 });
    await page.mouse.up();
    const held = await valueAt(3, 200);
    expect(held).toMatch(/^\d/);
    await card(3).getByRole("button", { name: "Add 5 minutes" }).click();
    await page.waitForTimeout(300);
    expect(await valueAt(3, 200)).toBe(held);
    // Readings 50 to 59 of 95 are missing: somewhere along the plot the crosshair finds no value.
    await page.reload();
    await plot(3).locator("canvas").first().waitFor();
    const found: (string | undefined)[] = [];
    for (let at = 0.4; at < 0.75; at += 0.02) found.push(await valueAt(3, (width - 70) * at));
    expect(found).toContain("—");
  });

  it("greys a stale card's chart and draws a placeholder in the chart's place, at its height", async () => {
    await plot(4).scrollIntoViewIfNeeded();
    expect(await plot(4).evaluate((element) => getComputedStyle(element).filter)).toBe("grayscale(1)");
    await expect.poll(() => plot(4).locator("canvas").count()).toBeGreaterThan(0);
    expect(await plot(5).locator("canvas").count()).toBe(0);
    expect(await plot(5).evaluate((element) => element.clientHeight)).toBe(
      await plot(4).evaluate((element) => element.clientHeight),
    );
  });
});
