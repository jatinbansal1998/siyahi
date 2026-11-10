// Hovers and focuses the catalogue's status heatmap in Chromium: hover and focus styles only apply to a real pointer
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
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
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

describe("StatusHeatmap states", { timeout: 60_000 }, () => {
  it("outlines a hovered day in the text colour without fading it", async () => {
    const degraded = '[data-slot="status-heatmap-block"][data-value="2"] >> nth=0';
    await page.locator(degraded).hover();
    await expect.poll(async () => (await paint(degraded)).stroke).toBe(await token("--foreground"));
    expect((await paint(degraded)).opacity).toBe("1");
  });

  it("outlines a keyboard-focused day in the focus colour", async () => {
    const first = '[data-slot="status-heatmap-block"][tabindex="0"]';
    await page.locator(first).focus();
    await page.keyboard.press("ArrowRight");
    const focused = '[data-slot="status-heatmap-block"]:focus-visible';
    await expect.poll(async () => (await paint(focused)).outline).toBe(`solid 2px ${await token("--ring")}`);
  });

  it("outlines a picked day in the focus colour, apart from its picked stroke, when the keyboard comes back to it", async () => {
    await page.locator('[data-slot="status-heatmap-block"][tabindex="0"]').focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.locator('[data-slot="status-heatmap-block"][aria-pressed="true"]').count()).toBe(1);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    const focused = '[data-slot="status-heatmap-block"][aria-pressed="true"]:focus-visible';
    await expect.poll(async () => (await paint(focused)).outline).toBe(`solid 2px ${await token("--ring")}`);
  });
});
