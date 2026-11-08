// The Linear and Log buttons on the catalogue's chart examples in Chromium: the axis ticks and the plot follow the
// pick. happy-dom cannot do this: Recharts lays the axes out from measured sizes.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/scatter-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => catalogue?.close());

async function show(family: string): Promise<void> {
  await page.evaluate((next) => {
    location.hash = next;
  }, `#/data/${family}`);
  await page.locator(`#${family} [data-slot="example-preview"]`).first().waitFor();
}

const card = (title: string): Locator =>
  page.locator('[data-slot="card"]', { has: page.getByText(title, { exact: true }) });

/** The tick labels along one axis, in order. */
const ticks = (chart: Locator, axis: "x" | "y") =>
  chart.locator(`.recharts-${axis === "x" ? "x" : "y"}Axis-tick-labels text`).allTextContents();

describe("scale toggle", () => {
  it("opens a scatter chart on the page's log scale, then ticks and redraws in round linear steps on Linear", async () => {
    await show("scatter-chart");
    const stores = card("Stores by size and growth");
    const scale = stores.getByRole("group", { name: "Share of sales scale" });
    await expect.poll(() => scale.getByRole("button", { name: "Log" }).getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => ticks(stores, "x")).toEqual(["0.2%", "0.5%", "1.0%", "2.0%", "5.0%", "10.0%", "20.0%"]);
    const shillong = stores.locator('[data-slot="scatter-point"][data-key="Shillong"]');
    const before = Number(await shillong.getAttribute("cx"));

    await scale.getByRole("button", { name: "Linear" }).click();

    await expect.poll(() => ticks(stores, "x")).toEqual(["0.0%", "5.0%", "10.0%", "15.0%"]);
    // 0.4% sits a third of the way along a log axis from 0.2% to 20%, but hard against 0% on a linear one.
    await expect.poll(async () => Number(await shillong.getAttribute("cx"))).toBeLessThan(before - 50);
  });

  it("switches a line chart's value axis from the keyboard", async () => {
    await show("line-chart");
    const users = card("Active users grew about 1.5× a month all year");
    const scale = users.getByRole("group", { name: "Active users scale" });
    await expect
      .poll(() => ticks(users, "y"))
      .toEqual(["200", "500", "1,000", "2,000", "5,000", "10,000", "20,000", "50,000"]);

    await scale.getByRole("button", { name: "Log" }).focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Space");

    await expect.poll(() => scale.getByRole("button", { name: "Linear" }).getAttribute("aria-pressed")).toBe("true");
    await expect.poll(async () => (await ticks(users, "y"))[0]).toBe("0");
  });

  it("opens an area chart on linear when the page sets no scale, with the range toggle beside the buttons", async () => {
    await show("area-chart");
    const managed = card("₹3.1Cr managed a year after launch");
    const scale = managed.getByRole("group", { name: "Value axis scale" });
    await expect.poll(() => scale.getByRole("button", { name: "Linear" }).getAttribute("aria-pressed")).toBe("true");
    const range = await managed.getByRole("group", { name: "Range" }).boundingBox();
    const buttons = await scale.boundingBox();
    expect(range && buttons && Math.abs(range.y - buttons.y)).toBeLessThan(2);
  });
});
