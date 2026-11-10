// Hovers and focuses the catalogue's weekday heatmap in Chromium: hover and focus styles only apply to a real pointer
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

/** A block's painted opacity, outline colour and width, and the colour a token resolves to on the page. */
const paint = (selector: string) =>
  page.locator(selector).evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      opacity: style.opacity,
      stroke: style.stroke,
      width: style.strokeWidth,
      dash: style.strokeDasharray,
    };
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

describe("WeekdayHeatmap states", { timeout: 60_000 }, () => {
  it("outlines a hovered hour in the text colour without fading it", async () => {
    const busy = '[data-slot="weekday-heatmap-block"][data-level="3"] >> nth=0';
    await page.locator(busy).hover();
    await expect.poll(async () => (await paint(busy)).stroke).toBe(await token("--foreground"));
    expect((await paint(busy)).opacity).toBe("1");
  });

  it("dashes a keyboard-focused hour in the focus colour", async () => {
    const first = '[data-slot="weekday-heatmap-block"][tabindex="0"]';
    await page.locator(first).focus();
    await page.keyboard.press("ArrowRight");
    const focused = '[data-slot="weekday-heatmap-block"]:focus-visible';
    await expect.poll(async () => (await paint(focused)).dash).toBe("3px, 2px");
    expect((await paint(focused)).stroke).toBe(await token("--ring"));
  });

  it("dashes a picked hour in the focus colour, apart from its solid picked stroke, when the keyboard comes back to it", async () => {
    await page.locator('[data-slot="weekday-heatmap-block"][tabindex="0"]').focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.locator('[data-slot="weekday-heatmap-block"][aria-pressed="true"]').count()).toBe(1);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    const focused = '[data-slot="weekday-heatmap-block"][aria-pressed="true"]:focus-visible';
    await expect.poll(async () => (await paint(focused)).dash).toBe("3px, 2px");
    expect((await paint(focused)).stroke).toBe(await token("--ring"));
  });
});
