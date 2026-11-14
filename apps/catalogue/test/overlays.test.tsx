// Opens the catalogue's menus, lists, popovers, dialogs and sheets in Chromium and reads how the theme draws them:
// the look comes from the theme's CSS, which happy-dom does not apply.
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

/** The drawn layers of a surface's box-shadow that cast a shadow: anything but a 1px ring, its edge. */
async function shadows(surface: Locator): Promise<string[]> {
  await surface.waitFor();
  // Let the opening animation settle, so the layers are read at rest.
  await page.waitForTimeout(250);
  const [shadow = ""] = await style(surface, "box-shadow");
  return drawnLayers(shadow).filter((layer) => !layer.endsWith("0px 0px 0px 1px"));
}

/**
 * Lays stock markup into the page, focuses its [data-focus] element if any, and reads [selector, CSS property,
 * pseudo-element?] off it, then removes it.
 */
const probe = async (html: string, reads: [string, string, string?][]): Promise<string[]> => {
  const preview = await open("inputs/dropdown-menu", "Dropdown menu");
  return preview.evaluate(
    (host, [markup, list]) => {
      const box = host.appendChild(document.createElement("div"));
      box.innerHTML = markup;
      box.querySelector<HTMLElement>("[data-focus]")?.focus();
      const values = list.map(([selector, property, pseudo]) =>
        getComputedStyle(box.querySelector(selector)!, pseudo ?? null).getPropertyValue(property),
      );
      box.remove();
      return values;
    },
    [html, reads] as const,
  );
};

describe("floating surfaces lie flat", { timeout: 60_000 }, () => {
  it("draws menus, a select's list, a popover, a dialog and a sheet with no drop shadow", async () => {
    let preview = await open("inputs/dropdown-menu", "Dropdown menu");
    await preview.getByRole("button", { name: "Actions" }).click();
    expect(await shadows(page.locator('[data-slot="dropdown-menu-content"]'))).toEqual([]);

    preview = await open("inputs/context-menu", "Context menu");
    await preview.getByText("Right-click").click({ button: "right" });
    expect(await shadows(page.locator('[data-slot="context-menu-content"]'))).toEqual([]);

    preview = await open("inputs/select", "Select");
    await preview.getByRole("combobox").click();
    expect(await shadows(page.locator('[data-slot="select-content"]'))).toEqual([]);

    preview = await open("inputs/popover", "Popover");
    await preview.getByRole("button").first().click();
    expect(await shadows(page.locator('[data-slot="popover-content"]'))).toEqual([]);

    preview = await open("inputs/dialog", "Dialog");
    await preview.getByRole("button").first().click();
    expect(await shadows(page.locator('[data-slot="dialog-content"]'))).toEqual([]);

    preview = await open("inputs/sheet", "Sheet");
    await preview.getByRole("button").first().click();
    expect(await shadows(page.locator('[data-slot="sheet-content"]'))).toEqual([]);
  });

  it("draws a chart's tooltip with no drop shadow", async () => {
    const preview = await open("data/bar-chart", "Bar chart");
    const chart = preview.locator('[data-slot="chart"]:has(.recharts-legend-wrapper)').first();
    const plot = await chart.locator(".recharts-surface").first().boundingBox();
    if (!plot) throw new Error("the bar chart drew no plot");
    await page.mouse.move(plot.x + plot.width * 0.3, plot.y + plot.height * 0.5);
    expect(await shadows(chart.locator(".recharts-tooltip-wrapper > div"))).toEqual([]);
  });

  it("casts no shadow from a component Siyahi does not list, written with a stock shadow class", async () => {
    const preview = await open("inputs/dropdown-menu", "Dropdown menu");
    // A surface written with stock shadcn classes, as a component added later (a hover card, a menubar) is.
    const box = await preview.evaluateHandle((host) => {
      const el = host.appendChild(document.createElement("div"));
      el.className = "size-8 bg-popover shadow-md ring-1 ring-foreground/10";
      return el;
    });
    expect(await shadows(preview.locator(":scope > div.ring-1").last())).toEqual([]);
    await box.evaluate((el) => (el as Element).remove());
  });

  it("washes any invalid field, and a box that holds one, though neither is named", async () => {
    const [plain, chips, inner] = await probe(
      `<input id="plain" aria-invalid="true" />
       <div id="chips" data-slot="combobox-chips"><input id="inner" aria-invalid="true" /></div>`,
      [
        ["#plain", "background-color"],
        ["#chips", "background-color"],
        ["#inner", "background-color"],
      ],
    );
    expect(plain).not.toBe("rgba(0, 0, 0, 0)");
    expect(chips).toBe(plain);
    expect(inner).not.toBe(plain);
  });

  it("edges a box in red when the invalid field it holds has the focus", async () => {
    const destructive = await themeColor(page, "--destructive");
    const [boxEdge] = await probe(
      `<div id="chips" data-slot="combobox-chips" class="border"><input aria-invalid="true" data-focus /></div>`,
      [["#chips", "border-top-color"]],
    );
    expect(boxEdge).toBe(destructive);
  });

  it("draws faded muted text at the muted colour", async () => {
    const [faded, muted] = await probe(
      `<p id="faded" class="text-muted-foreground/70">Faded</p>
       <p id="muted" class="text-muted-foreground">Muted</p>`,
      [
        ["#faded", "color"],
        ["#muted", "color"],
      ],
    );
    expect(faded).toBe(muted);
  });

  it("fills a selected pill tab with no drop shadow under it", async () => {
    const preview = await open("components/tabs", "Tabs");
    const tab = preview
      .locator('[data-slot="tabs-list"][data-variant="default"] [data-slot="tabs-trigger"][data-active]')
      .first();
    const [shadow = ""] = await style(tab, "box-shadow");
    expect(drawnLayers(shadow)).toEqual([]);
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
