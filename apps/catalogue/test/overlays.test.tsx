// Opens the catalogue's menus, lists, popovers, dialogs and sheets in Chromium and reads how the theme draws them,
// with the parts it squares: the look comes from the theme's CSS, which happy-dom does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("inputs/dropdown-menu");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Goes to a family's route and waits for its page, by its title, so no locator reads the page it left. */
const open = async (route: string, title: string): Promise<Locator> => {
  await page.keyboard.press("Escape");
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
  const preview = page.locator('[data-slot="example-preview"]').first();
  await preview.waitFor();
  return preview;
};

const style = (locator: Locator, ...names: string[]): Promise<string[]> =>
  locator.evaluate((el, props) => props.map((prop) => getComputedStyle(el).getPropertyValue(prop)), names);

/** A box-shadow's layers that draw something: a transparent layer is an unset Tailwind slot. */
const drawnLayers = (shadow: string): string[] =>
  shadow === "none"
    ? []
    : shadow
        .split(/,(?![^(]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => !layer.startsWith("rgba(0, 0, 0, 0)"));

/** A surface lies flat when its only drawn layer is a 1px ring in the card's hairline, or it draws none at all. */
async function edge(surface: Locator): Promise<{ layers: string[]; ring: string | undefined }> {
  await surface.waitFor();
  // Let the opening animation settle, so the ring is read at its resting colour.
  await page.waitForTimeout(250);
  const [shadow = ""] = await style(surface, "box-shadow");
  const layers = drawnLayers(shadow);
  return { layers, ring: layers.find((layer) => layer.endsWith("0px 0px 0px 1px")) };
}

const LABEL = { mono: true, transform: "uppercase", size: "11px" };

const labelType = async (label: Locator): Promise<typeof LABEL> => {
  const [font = "", transform, size] = await style(label, "font-family", "text-transform", "font-size");
  return { mono: font.startsWith('"Geist Mono'), transform: transform ?? "", size: size ?? "" };
};

describe("floating surfaces, group labels and square parts", { timeout: 60_000 }, () => {
  it("draws menus, a select's list and a popover flat, edged in the card's hairline, with mono group labels", async () => {
    const border = await themeColor(page, "--border");

    let preview = await open("inputs/dropdown-menu", "Dropdown menu");
    await preview.getByRole("button", { name: "Actions" }).click();
    expect(await edge(page.locator('[data-slot="dropdown-menu-content"]'))).toEqual({
      layers: [`${border} 0px 0px 0px 1px`],
      ring: `${border} 0px 0px 0px 1px`,
    });
    expect(await labelType(page.locator('[data-slot="dropdown-menu-label"]'))).toEqual(LABEL);

    preview = await open("inputs/context-menu", "Context menu");
    await preview.getByText("Right-click").click({ button: "right" });
    expect((await edge(page.locator('[data-slot="context-menu-content"]'))).layers).toEqual([
      `${border} 0px 0px 0px 1px`,
    ]);
    expect(await labelType(page.locator('[data-slot="context-menu-label"]'))).toEqual(LABEL);

    preview = await open("inputs/select", "Select");
    await preview.getByRole("combobox").click();
    expect((await edge(page.locator('[data-slot="select-content"]'))).layers).toEqual([`${border} 0px 0px 0px 1px`]);
    expect(await labelType(page.locator('[data-slot="select-label"]'))).toEqual(LABEL);

    preview = await open("inputs/popover", "Popover");
    await preview.getByRole("button").first().click();
    expect((await edge(page.locator('[data-slot="popover-content"]'))).layers).toEqual([`${border} 0px 0px 0px 1px`]);
  });

  it("draws a dialog and a sheet flat, a dialog in the card's hairline ring and a sheet on its hairline edge", async () => {
    const border = await themeColor(page, "--border");

    let preview = await open("inputs/dialog", "Dialog");
    await preview.getByRole("button").first().click();
    expect((await edge(page.locator('[data-slot="dialog-content"]'))).layers).toEqual([`${border} 0px 0px 0px 1px`]);

    preview = await open("inputs/sheet", "Sheet");
    await preview.getByRole("button").first().click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    expect((await edge(sheet)).layers).toEqual([]);
    expect(await style(sheet, "border-left-width", "border-left-color")).toEqual(["1px", border]);
  });

  it("sets the command palette's group headings as labels", async () => {
    const preview = await open("inputs/command", "Command");
    expect(await labelType(preview.locator("[cmdk-group-heading]").first())).toEqual(LABEL);
  });

  it("edges the data table's filter chip in a solid hairline, and opens its list flat", async () => {
    const border = await themeColor(page, "--border");
    const preview = await open("data/data-table", "Data table");
    const chip = preview.locator('[data-slot="popover-trigger"]', { hasText: "Category" });
    expect(await style(chip, "border-top-style", "border-top-width")).toEqual(["solid", "1px"]);
    await chip.click();
    expect((await edge(page.locator('[data-slot="popover-content"]'))).layers).toEqual([`${border} 0px 0px 0px 1px`]);
  });

  it("draws a chart's tooltip flat in the card's hairline, and its tooltip and legend chips square", async () => {
    const border = await themeColor(page, "--border");
    const preview = await open("data/bar-chart", "Bar chart");
    const chips = preview.locator('.recharts-legend-wrapper [class~="rounded-[2px]"]');
    await chips.first().waitFor();
    expect(await chips.evaluateAll((els) => [...new Set(els.map((el) => getComputedStyle(el).borderRadius))])).toEqual([
      "0px",
    ]);
    const chart = preview.locator('[data-slot="chart"]:has(.recharts-legend-wrapper)').first();
    const plot = await chart.locator(".recharts-surface").first().boundingBox();
    if (!plot) throw new Error("the bar chart drew no plot");
    await page.mouse.move(plot.x + plot.width * 0.3, plot.y + plot.height * 0.5);
    const tooltip = chart.locator(".recharts-tooltip-wrapper > div");
    expect((await edge(tooltip)).layers).toEqual([]);
    expect(await style(tooltip, "border-top-color")).toEqual([border]);
    // Siyahi's cards write their own tooltip rows, so core's chip shows only in a page's stock ChartTooltipContent:
    // lay one in, with core's classes, beside a round status dot that must stay round.
    const [chip, dot] = await tooltip.evaluate((box) =>
      ["h-2.5 w-2.5 shrink-0 rounded-[2px]", "size-1.5 rounded-full"].map((className) => {
        const el = box.appendChild(document.createElement("div"));
        el.className = className;
        return getComputedStyle(el).borderTopLeftRadius;
      }),
    );
    expect(chip).toBe("0px");
    expect(dot).not.toBe("0px");
  });

  it("fills a selected pill tab with no drop shadow under it", async () => {
    const preview = await open("components/tabs", "Tabs");
    const tab = preview
      .locator('[data-slot="tabs-list"][data-variant="default"] [data-slot="tabs-trigger"][data-active]')
      .first();
    const [shadow = ""] = await style(tab, "box-shadow");
    expect(drawnLayers(shadow)).toEqual([]);
  });

  it("squares a slider, a scroll area's thumb and a range position's thumb", async () => {
    let preview = await open("inputs/slider", "Slider");
    for (const slot of ["slider-track", "slider-thumb"]) {
      expect(await style(preview.locator(`[data-slot="${slot}"]`).first(), "border-radius")).toEqual(["0px"]);
    }
    preview = await open("components/scroll-area", "Scroll area");
    const thumb = preview.locator('[data-slot="scroll-area-thumb"]').first();
    await thumb.waitFor({ state: "attached" });
    expect(await style(thumb, "border-radius")).toEqual(["0px"]);
    preview = await open("data/range-position", "Range position");
    expect(await style(preview.locator('[data-slot="range-thumb"]').first(), "border-radius")).toEqual(["0px"]);
  });

  it("squares heatmap cells, treemap tiles and their legend swatches, and keeps a signed loss day round", async () => {
    await open("data/heatmaps", "Heatmaps");
    const cells = page.locator('[data-slot="example-preview"] [data-slot="card"] svg rect:not([fill="none"])');
    await cells.first().waitFor();
    // Each rounded rect, as a full circle (a signed calendar's loss day) or a box with softened corners.
    const rounded = await cells.evaluateAll((els) =>
      els
        .filter((el) => Number(el.getAttribute("rx") ?? 0) > 0)
        .map((el) => (Number(el.getAttribute("rx")) * 2 >= Number(el.getAttribute("width")) - 1 ? "circle" : "box")),
    );
    expect([...new Set(rounded)]).toEqual(["circle"]);
    // The signed calendar's loss days themselves, apart from its legend's swatches.
    const lossDays = page
      .locator('[data-slot="calendar-heatmap-block"]')
      .evaluateAll(
        (els) =>
          els.filter((el) => Number(el.getAttribute("rx") ?? 0) * 2 >= Number(el.getAttribute("width")) - 1).length,
      );
    expect(await lossDays).toBeGreaterThan(0);
    await open("data/treemap", "Treemap");
    const tiles = page.locator(
      '[data-slot="example-preview"] :is([data-slot="treemap-tile"], [data-slot="treemap-legend-swatch"]) rect',
    );
    await tiles.first().waitFor();
    expect(await tiles.evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute("rx") ?? "0"))])).toEqual([
      "0",
    ]);
  });
});
