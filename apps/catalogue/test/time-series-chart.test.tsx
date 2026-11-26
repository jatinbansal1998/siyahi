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
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const chart = () => page.locator('[data-slot="time-series-chart"]');
const legends = () => chart().locator('[data-slot="time-series-chart-legend"]');
/** Each pane's legend as [label, value] pairs, top pane first. */
const legendValues = () =>
  legends().evaluateAll((lists) =>
    lists.map((list) => [...list.querySelectorAll("li")].map((item) => item.innerText.split("\n"))),
  );

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
    const box = await chart().boundingBox();
    if (!box) throw new Error("not laid out");
    // In the bottom pane, a third of the way along: every pane's legend follows the one crosshair.
    await page.mouse.move(box.x + box.width / 3, box.y + 360);
    await expect.poll(async () => (await legendValues())[0]?.[0]?.[1]).not.toBe("25,820");
    const hovered = (await legendValues()).flat();
    for (const [index, [label, value]] of hovered.entries()) {
      expect(value, label).not.toBe(latest.flat()[index]?.[1]);
    }
    await page.mouse.move(box.x + box.width / 3, box.y - 40);
    await expect.poll(legendValues).toEqual(latest);
  });
});
