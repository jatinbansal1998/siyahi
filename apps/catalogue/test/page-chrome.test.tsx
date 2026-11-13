// What paints, and takes a tap, where a page's sticky header sits, on a phone in Chromium: stacking is worked out
// only by a real browser.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("blocks/metric-strip", { viewport: { width: 390, height: 844 }, hasTouch: true });
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const open = async (route: string, title: string): Promise<void> => {
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
  await page.locator('[data-slot="example-preview"]').first().waitFor();
};

describe("page chrome", { timeout: 60_000 }, () => {
  it("keeps a picker figure's button under the sticky header, so a tap on the header is the header's", async () => {
    await open("blocks/metric-strip", "MetricStrip");
    const picker = page
      .locator('[data-slot="example-preview"] [data-slot="metric-strip-item"] > button[aria-pressed]')
      .first();
    await picker.waitFor();
    const header = page.locator("header").first();
    const bar = await header.boundingBox();
    // The picker is the page's last example, too near its foot on a phone to scroll under the header; give it room.
    await page.evaluate(() => (document.body.style.paddingBottom = "100vh"));
    // Scroll until the figure's button runs under the middle of the header.
    await picker.evaluate(
      (el, middle) => {
        scrollTo({ top: scrollY + el.getBoundingClientRect().top + 8 - middle, behavior: "instant" });
      },
      (bar?.y ?? 0) + (bar?.height ?? 0) / 2,
    );
    const box = await picker.boundingBox();
    const point = { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (bar?.y ?? 0) + (bar?.height ?? 0) / 2 };
    expect(box && box.y < point.y && box.y + box.height > point.y).toBe(true);
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest("header"), point)).toBe(true);
    await page.evaluate(() => (document.body.style.paddingBottom = ""));
  });

  it("keeps an avatar's badge over the next avatar in its group", async () => {
    await open("components/avatar", "Avatar");
    const badge = page.locator('main [data-slot="avatar-group"] [data-slot="avatar-badge"]').first();
    const box = await badge.boundingBox();
    // The badge's right half, where the next avatar overlaps it.
    const point = { x: (box?.x ?? 0) + (box?.width ?? 0) * 0.75, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 };
    expect(
      await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest("[data-slot]")?.getAttribute("data-slot"),
        point,
      ),
    ).toBe("avatar-badge");
  });

  // Every part a component lifts with a z-index, on the pages that show such parts: each must rank inside the stacking
  // context of its component's own root, never against the page's header or section strip. The nearest isolated
  // ancestor must be that root: an example's card isolates too, and would otherwise hide a root that does not.
  it.each([
    // A strip's picker buttons rank in its card; its period toggle's pressed item in the toggle group.
    ["blocks/metric-strip", "MetricStrip", "card toggle-group"],
    ["data/data-table", "Data table", "table-container"],
    ["components/avatar", "Avatar", "avatar-group"],
    ["inputs/calendar", "Calendar", "calendar"],
    ["inputs/toggle-group", "Toggle group", "toggle-group"],
    ["data/price-chart", "PriceChart", "price-chart"],
  ])("keeps every lifted part on %s inside its own component", async (route, title, root) => {
    await open(route, title);
    // A toggle lifts itself only while focused.
    if (route === "inputs/toggle-group") await page.locator('main [data-slot="toggle-group-item"]').first().focus();
    const { lifted, loose } = await page.evaluate((rootSlot) => {
      const main = document.querySelector("main main") ?? document.querySelector("main");
      const chrome = '[data-slot="page-toc"], header';
      // The slot of the nearest isolated ancestor, or "nothing".
      const isolatedBy = (el: Element): string => {
        for (let node = el.parentElement; node && node !== main; node = node.parentElement) {
          if (getComputedStyle(node).isolation === "isolate") return node.getAttribute("data-slot") ?? node.tagName;
        }
        return "nothing";
      };
      const raised = [...(main?.querySelectorAll("*") ?? [])].filter(
        (el) => getComputedStyle(el).zIndex !== "auto" && !el.closest(chrome) && !el.closest("svg"),
      );
      return {
        lifted: raised.length,
        loose: raised
          .filter((el) => !rootSlot.split(" ").includes(isolatedBy(el)))
          .map(
            (el) => `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? el.className}] in ${isolatedBy(el)}`,
          ),
      };
    }, root);
    // The page shows at least one lifted part, so the check has something to hold.
    expect(lifted).toBeGreaterThan(0);
    expect(loose).toEqual([]);
  });
});
