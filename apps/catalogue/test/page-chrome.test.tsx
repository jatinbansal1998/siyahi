// What paints, and takes a tap, where a page's sticky header sits, on a phone in Chromium: stacking is worked out
// only by a real browser.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("blocks/section-cards", { viewport: { width: 390, height: 844 }, hasTouch: true });
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
  it("keeps a picker tile's button under the sticky header, so a tap on the header is the header's", async () => {
    await open("blocks/section-cards", "SectionCards");
    const picker = page.locator('[data-slot="example-preview"] [data-slot="card"] > button[aria-pressed]').first();
    await picker.waitFor();
    const header = page.locator("header").first();
    const bar = await header.boundingBox();
    // Scroll until the tile's button runs under the middle of the header.
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

  // Every part a component lifts with a z-index, on the pages that show such parts: each must rank inside a stacking
  // context of its own component, never against the page's header or section strip.
  it.each([
    ["blocks/section-cards", "SectionCards"],
    ["data/data-table", "Data table"],
    ["components/avatar", "Avatar"],
    ["inputs/calendar", "Calendar"],
    ["inputs/toggle-group", "Toggle group"],
    ["data/price-chart", "PriceChart"],
  ])("keeps every lifted part on %s inside its own component", async (route, title) => {
    await open(route, title);
    // A toggle lifts itself only while focused.
    if (route === "inputs/toggle-group") await page.locator('main [data-slot="toggle-group-item"]').first().focus();
    const { lifted, loose } = await page.evaluate(() => {
      const main = document.querySelector("main main") ?? document.querySelector("main");
      const chrome = '[data-slot="page-toc"], header';
      const contained = (el: Element): boolean => {
        for (let node = el.parentElement; node && node !== main; node = node.parentElement) {
          if (getComputedStyle(node).isolation === "isolate") return true;
        }
        return false;
      };
      const raised = [...(main?.querySelectorAll("*") ?? [])].filter(
        (el) => getComputedStyle(el).zIndex !== "auto" && !el.closest(chrome) && !el.closest("svg"),
      );
      return {
        lifted: raised.length,
        loose: raised
          .filter((el) => !contained(el))
          .map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? el.className}]`),
      };
    });
    // The page shows at least one lifted part, so the check has something to hold.
    expect(lifted).toBeGreaterThan(0);
    expect(loose).toEqual([]);
  });
});
