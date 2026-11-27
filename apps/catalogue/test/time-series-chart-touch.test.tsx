// A finger on the TimeSeriesChart, on a phone: Lightweight Charts decides between the page's scroll and its own
// drag from real touch events, which only a browser with a touch screen sends.
import type { CDPSession, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;
let touch: CDPSession;

beforeAll(async () => {
  catalogue = await openCatalogue("data/time-series-chart", { viewport: { width: 390, height: 844 }, hasTouch: true });
  page = catalogue.page;
  touch = await page.context().newCDPSession(page);
  await chart().locator("table tr").first().waitFor({ state: "attached", timeout: 30_000 });
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const chart = () => page.locator('[data-slot="time-series-chart"]').first();

/** What a drag can change: the chart's drawing, and how far the page has scrolled. */
const seen = () =>
  chart().evaluate((element) => {
    let scrolled = 0;
    for (let parent: Element | null = element; parent; parent = parent.parentElement) scrolled += parent.scrollTop;
    const drawing = [...element.querySelectorAll("canvas")].map((canvas) => canvas.toDataURL()).join();
    return { drawing, scrolled };
  });

/** Drags a finger 120px up the chart, `fromRight` px in from its right edge, and says what that changed. */
async function dragUp(fromRight: number) {
  await chart().evaluate((element) => element.scrollIntoView({ block: "center" }));
  const box = await chart().boundingBox();
  if (!box) throw new Error("the chart has no box");
  const x = box.x + box.width - fromRight;
  const y = box.y + 150;
  const before = await seen();
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 20; step++) {
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 6 }] });
  }
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => JSON.stringify(await seen()) !== JSON.stringify(before)).toBe(true);
  const after = await seen();
  return { redrawn: after.drawing !== before.drawing, scrolled: after.scrolled - before.scrolled };
}

describe("TimeSeriesChart under a finger", { timeout: 60_000 }, () => {
  it("scrolls the page when the finger moves up the plot", async () => {
    const { redrawn, scrolled } = await dragUp(200);
    expect(scrolled).toBeGreaterThan(50);
    expect(redrawn).toBe(false);
  });

  it("stretches the scale when the finger moves up the price axis", async () => {
    const { redrawn, scrolled } = await dragUp(20);
    expect(redrawn).toBe(true);
    // The drag is 120px, and the page would follow it; a busy browser may move the page a pixel before the chart
    // has claimed the finger.
    expect(Math.abs(scrolled)).toBeLessThan(10);
  });
});
