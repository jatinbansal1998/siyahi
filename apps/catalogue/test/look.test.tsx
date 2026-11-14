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
    const masthead = example().locator('[data-slot="page-header"]');
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

  it("fills the selected toggle with the text colour, so the reader sees which one is on", async () => {
    const items = example().getByRole("group", { name: "Period" }).locator('[data-slot="toggle-group-item"]');
    const drawn = await items.evaluateAll((els) =>
      els.map((el) => [el.getAttribute("aria-pressed"), getComputedStyle(el).backgroundColor]),
    );
    const ink = await token("--foreground");
    expect(drawn.map(([pressed, fill]) => [pressed, fill === ink])).toEqual([
      ["false", false],
      ["true", true],
      ["false", false],
    ]);
  });

  it("sets the page in mono as a terminal, its sentences in sans and its column heads in small muted capitals", async () => {
    const font = async (locator: Locator) => ((await style(locator, "font-family"))[0] ?? "").replace(/"/g, "");
    const header = example().locator('[data-slot="page-header"]');
    expect(await font(header.locator("h1"))).toMatch(/^Geist Mono/);
    expect(await font(example().getByRole("button", { name: "Export" }))).toMatch(/^Geist Mono/);
    // A sidebar row sits in a list item, which holds labels, not a sentence.
    expect(await font(page.locator('[data-sidebar="menu-button"]').first())).toMatch(/^Geist Mono/);
    expect(await font(header.locator('[data-slot="page-header-description"]'))).toMatch(/^Geist Variable/);
    expect(await font(example().locator('[data-slot="callout-description"]'))).toMatch(/^Geist Variable/);
    const head = example().locator('[data-slot="table-head"]').first();
    const [transform, size, color] = await style(head, "text-transform", "font-size", "color");
    expect([transform, size, color]).toEqual(["uppercase", "11px", await token("--muted-foreground")]);
  });

  it("sets a MetricStrip figure's label in small monospaced capitals", async () => {
    const label = example().locator('[data-slot="metric-strip-label"]').first();
    const [font, transform, size] = await style(label, "font-family", "text-transform", "font-size");
    expect([font?.startsWith('"Geist Mono'), transform, size]).toEqual([true, "uppercase", "11px"]);
  });

  it("filters the holdings as the reader searches, and totals the rows shown", async () => {
    const search = example().getByRole("searchbox", { name: "Search holdings" });
    await search.fill("small cap");
    const body = example().locator('[data-slot="table-body"] [data-slot="table-row"]');
    await expect.poll(() => body.count()).toBe(1);
    expect(await example().locator('[data-slot="table-footer"]').innerText()).toContain("₹3,18,200");
    await search.fill("");
    await expect.poll(() => body.count()).toBe(5);
  });

  it("washes only the figure and the rows the page marks, and outlines the figure", async () => {
    const figures = example().locator('[data-slot="metric-strip-item"]');
    const fills = await figures.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    // The middle figure, cash flow, is marked negative; the others show the page through.
    expect(fills.map((fill) => fill === TRANSPARENT)).toEqual([true, false, true]);
    const outline = await figures
      .nth(1)
      .evaluate((el) => [getComputedStyle(el).outlineWidth, getComputedStyle(el).outlineColor]);
    expect(outline[0]).toBe("1px");
    expect(outline[1]).not.toBe(TRANSPARENT);
    const rows = example().locator('[data-slot="table-body"] [data-slot="table-row"]');
    const rowFills = await rows.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    // Gold bonds (warning) and the small cap fund (negative) are marked; rows on track stay clear.
    expect(rowFills.map((fill) => fill !== TRANSPARENT)).toEqual([false, false, true, false, true]);
  });
});
