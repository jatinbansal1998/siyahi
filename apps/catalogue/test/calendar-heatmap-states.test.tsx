// Hovers and focuses the catalogue's signed calendar in Chromium: hover and focus styles only apply to a real pointer
// and keyboard.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/heatmaps");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const calendar = () => page.locator('[data-slot="card"]', { hasText: "Profit by day" });
const paint = (selector: string) =>
  calendar()
    .locator(selector)
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, stroke: style.stroke, width: style.strokeWidth };
    });
const token = (name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${variable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

describe("CalendarHeatmap states", { timeout: 60_000 }, () => {
  it("outlines a hovered day in the text colour without fading it", async () => {
    const day = '[data-slot="calendar-heatmap-block"][data-date="2026-05-04"]';
    await calendar().locator(day).hover();
    await expect.poll(async () => (await paint(day)).stroke).toBe(await token("--foreground"));
    expect((await paint(day)).opacity).toBe("1");
  });

  it("rings a keyboard-focused day in the focus colour", async () => {
    await calendar().locator('[data-slot="calendar-heatmap-block"][tabindex="0"]').focus();
    await page.keyboard.press("ArrowRight");
    const focused = '[data-slot="calendar-heatmap-block"]:focus-visible';
    await expect.poll(async () => (await paint(focused)).stroke).toBe(await token("--ring"));
    expect((await paint(focused)).width).toBe("2px");
  });
});
