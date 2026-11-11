// The catalogue's information architecture in Chromium: a category lists its families, a family's route
// holds its reference and examples, and search reaches every family.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data");
  page = catalogue.page;
}, 60_000);

afterAll(async () => catalogue?.close());

const PAGES: [id: string, title: string][] = [
  ["overview", "Siyahi"],
  ["foundations", "Foundations"],
  ["components", "Components"],
  ["inputs", "Inputs and overlays"],
  ["layout", "Page layout"],
  ["data", "Data"],
  ["blocks", "Blocks"],
  ["reports", "Reports"],
];

/** Opens a route and waits for its page: the header's last breadcrumb names it once it has rendered. */
async function go(hash: string, title: string): Promise<void> {
  await page.evaluate((next) => {
    location.hash = next;
  }, hash);
  // The old page stays up, in a transition, until the new one's examples have loaded.
  await expect.poll(() => page.locator('[data-slot="breadcrumb-page"]').innerText(), { timeout: 20_000 }).toBe(title);
  await page.getByRole("status").filter({ hasText: "Loading examples" }).waitFor({ state: "detached" });
}

describe("catalogue families", { timeout: 60_000 }, () => {
  it("lists a category's families as links and draws none of their examples", async () => {
    await go("#/data", "Data");
    const sidebarLinks = await page
      .locator('[data-slot="sidebar"] a[href^="#/data/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const cardLinks = await page
      .locator('main main a[href^="#/data/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(cardLinks).toEqual(sidebarLinks);
    expect(cardLinks.length).toBeGreaterThan(10);
    expect(await page.locator('[data-slot="example"]').count()).toBe(0);
  });

  it("opens a family with its import line, props, captioned examples and its neighbours", async () => {
    await go("#/data/bar-chart", "Bar chart");
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toBe("Bar chart");
    expect(await page.locator('main [data-slot="code-block"]').first().innerText()).toContain(
      'import { BarChartCard, type ChartSeries } from "@siyahi/ui";',
    );
    const props = page.getByRole("table").filter({ hasText: "Prop and type" });
    expect(await props.getByRole("row").filter({ hasText: "onSelect" }).count()).toBe(1);
    const examples = page.locator('[data-slot="example"]');
    expect(await examples.count()).toBe(6);
    expect(await examples.first().innerText()).toContain("Five series grouped by quarter");
    const neighbours = page.getByRole("navigation", { name: "More in Data" });
    expect(await neighbours.getByRole("link").evaluateAll((links) => links.map((l) => l.getAttribute("href")))).toEqual(
      ["#/data/area-chart", "#/data/line-chart"],
    );
  });

  it("wraps each example's file name on a phone rather than cutting it, keeping the name whole", async () => {
    await go("#/data/scatter-chart", "Scatter chart");
    await page.setViewportSize({ width: 390, height: 844 });
    try {
      const files = await page.locator('[data-slot="example-file"]').evaluateAll((codes) =>
        codes.map((code) => ({
          text: code.textContent,
          cut: code.scrollWidth > code.clientWidth,
          // The text's own line boxes: the inline-block around it is one box however many lines it holds.
          nameLines: (() => {
            const range = document.createRange();
            range.selectNodeContents(code.querySelector("span")!);
            return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
          })(),
        })),
      );
      expect(files.map(({ text }) => text)).toContain("examples/scatter-chart-quadrants.tsx");
      for (const file of files) expect(file).toEqual({ text: file.text, cut: false, nameLines: 1 });
    } finally {
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });

  it("finds every family by its title, and a family by an export it ships", async () => {
    // The sidebar opens the current page's group, so visit each page to read all of its families.
    const families: string[] = [];
    for (const [id, title] of PAGES) {
      await go(`#/${id}`, title);
      const titles = await page
        .locator(`[data-slot="sidebar"] a[href^="#/${id}/"]`)
        .evaluateAll((links) => links.map((link) => link.textContent ?? ""));
      expect(titles.length).toBeGreaterThan(0);
      families.push(...titles);
    }
    expect(families.length).toBeGreaterThan(50);
    await page.keyboard.press("Control+k");
    const input = page.getByPlaceholder("Find a component, chart or rule…");
    await input.waitFor();
    for (const title of families) {
      await input.fill(title);
      await expect.poll(() => page.getByRole("option", { name: title, exact: true }).count()).toBeGreaterThan(0);
    }
    await input.fill("DataTableRowCount");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#/data/data-table");
  });
});
