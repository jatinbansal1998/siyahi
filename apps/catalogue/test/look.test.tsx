// Reads the front page's "At a glance" app page in Chromium: the look comes from the theme's CSS, which happy-dom
// does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  // Wide enough for the masthead's line and its actions to share a row, as on a laptop page without the sidebar.
  catalogue = await openCatalogue("overview/at-a-glance", { viewport: { width: 1600, height: 900 } });
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const example = (): Locator => page.locator('[data-slot="example-preview"]').first();

const style = (locator: Locator, ...names: string[]): Promise<string[]> =>
  locator.evaluate((el, props) => props.map((prop) => getComputedStyle(el).getPropertyValue(prop)), names);

const token = (name: string): Promise<string> => themeColor(page, name);

const TRANSPARENT = "rgba(0, 0, 0, 0)";

describe("the look", { timeout: 60_000 }, () => {
  it("opens on a masthead: a 30px title, the actions at the right and a hairline under it", async () => {
    const masthead = example().locator('[data-slot="page-hero"]');
    expect(await style(masthead, "border-bottom-width", "border-radius", "background-color")).toEqual([
      "1px",
      "0px",
      TRANSPARENT,
    ]);
    expect(await style(masthead.locator("h1"), "font-size")).toEqual(["30px"]);
    const right = await masthead.evaluate((el) => {
      const actions = el.lastElementChild as Element;
      return Math.round(el.getBoundingClientRect().right - actions.getBoundingClientRect().right);
    });
    expect(right).toBe(0);
  });

  it("numbers the blocks of a PanelGrid 01 and 02 before their titles", async () => {
    // The number is ::before content, which only the accessibility tree reads back as text.
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
      nodes: { role?: { value?: string }; name?: { value?: string } }[];
    };
    const numbers = nodes
      .filter((node) => node.role?.value === "StaticText" && /^\d\d$/.test(node.name?.value ?? ""))
      .map((node) => node.name?.value);
    expect(numbers).toEqual(["01", "02"]);
    const title = example().locator('[data-slot="panel"] [data-slot="card-title"]').first();
    const before = await title.evaluate((el) => {
      const pseudo = getComputedStyle(el, "::before");
      return { font: pseudo.fontFamily, color: pseudo.color };
    });
    expect(before.font).toMatch(/^"Geist Mono/);
    expect(before.color).toBe(await token("--link"));
  });

  it("joins a toggle group's items, sharing their borders", async () => {
    const items = example().getByRole("group", { name: "Period" }).locator('[data-slot="toggle-group-item"]');
    const edges = await items.evaluateAll((els) =>
      els.map((el) => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right })),
    );
    expect(edges.slice(1).map((edge, i) => edge.left - (edges[i]?.right ?? 0))).toEqual([-1, -1]);
  });

  it("sets labels over figures in small monospaced capitals", async () => {
    const labels = [
      example().locator('[data-slot="table-head"]').first(),
      example().locator('[data-slot="section-card"] [data-slot="card-description"]').first(),
      example().locator('[data-slot="section-card"] [data-slot="card-footer"]').first(),
    ];
    for (const label of labels) {
      const [font, transform, size] = await style(label, "font-family", "text-transform", "font-size");
      expect([font?.startsWith('"Geist Mono'), transform, size]).toEqual([true, "uppercase", "11px"]);
    }
  });

  it("draws a total row between a rule and a double rule, with no band", async () => {
    const total = example().locator('[data-slot="table-footer"]');
    expect(
      await style(total, "border-top-width", "border-top-style", "border-bottom-width", "border-bottom-style"),
    ).toEqual(["1px", "solid", "3px", "double"]);
    expect(await style(total, "border-top-color", "background-color")).toEqual([
      await token("--foreground"),
      TRANSPARENT,
    ]);
  });

  it("washes only the tile and the rows the page marks, and outlines the tile", async () => {
    const tiles = example().locator('[data-slot="section-card"] [data-slot="card"]');
    const card = await token("--card");
    const tileFills = await tiles.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    // The middle tile, cash flow, is marked negative; the others keep the card colour.
    expect(tileFills.map((fill) => fill === card)).toEqual([true, false, true]);
    const ring = await tiles.nth(1).evaluate((el) => getComputedStyle(el).boxShadow);
    const outline = ring.split(/,(?![^(]*\))/).find((layer) => layer.trim().endsWith("0px 0px 0px 1px"));
    expect(outline).toBeDefined();
    expect(outline).not.toMatch(/rgba\(0, 0, 0, 0\)/);
    const rows = example().locator('[data-slot="table-body"] [data-slot="table-row"]');
    const rowFills = await rows.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    // Gold bonds (warning) and the small cap fund (negative) are marked; rows on track stay clear.
    expect(rowFills.map((fill) => fill !== TRANSPARENT)).toEqual([false, false, true, false, true]);
  });
});
