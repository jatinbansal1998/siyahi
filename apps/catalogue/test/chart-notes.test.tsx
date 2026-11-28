// Event notes on a phone, in Chromium: where a note fits is worked out from the laid-out plot.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/limits-and-events", { viewport: { width: 390, height: 844 } });
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("event notes", { timeout: 60_000 }, () => {
  it("writes a note with no room beside its rule under the chart, with its date, and keeps its rule", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Memory pressure of a test group, %" });
    await chart.scrollIntoViewIfNeeded();
    // "killed" has the 19:40:05 rule at its left and the plot's end close at its right, too close for six letters.
    const written = chart.locator('[data-slot="chart-notes"] li span');
    await expect.poll(() => written.allTextContents()).toEqual(["", "19:40:05 IST", "killed"]);
    expect(await chart.locator('[data-slot="event-notes"] text').allTextContents()).toEqual(["limit 50%"]);
    const upright = await chart
      .locator(".recharts-reference-line-line")
      .evaluateAll((lines) => lines.filter((line) => line.getBoundingClientRect().width < 1).length);
    expect(upright).toBe(2);
  });
});
