// Reads dense tables, form fields, focus and the sidebar in Chromium: they come from the theme's CSS, which happy-dom
// does not apply.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("components/table");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

const style = (locator: Locator, ...names: string[]): Promise<string[]> =>
  locator.evaluate((el, props) => props.map((prop) => getComputedStyle(el).getPropertyValue(prop)), names);

const open = async (route: string): Promise<Locator> => {
  await page.goto(page.url().replace(/#.*/, `#/${route}`));
  const preview = page.locator('[data-slot="example-preview"]').first();
  await preview.waitFor();
  return preview;
};

describe("dense tables, fields, focus and sidebar", { timeout: 60_000 }, () => {
  it("draws a table dense: compact rows, a text-colour rule under the heads, a medium first column, mono figures", async () => {
    const table = await open("components/table");
    expect(await style(table.locator('[data-slot="table-head"]').first(), "height")).toEqual(["28px"]);
    expect(await style(table.locator('[data-slot="table-cell"]').first(), "padding-top")).toEqual(["3.2px"]);
    expect(
      await style(table.locator('[data-slot="table-header"] [data-slot="table-row"]'), "border-bottom-color"),
    ).toEqual([await themeColor(page, "--foreground")]);
    const firstRow = table.locator('[data-slot="table-body"] [data-slot="table-row"]').first();
    expect(await style(firstRow.locator('[data-slot="table-cell"]').first(), "font-weight")).toEqual(["500"]);
    const [font, size] = await style(firstRow.locator('[data-slot="table-cell"]').nth(1), "font-family", "font-size");
    expect([font?.startsWith('"Geist Mono'), size]).toEqual([true, "13px"]);
  });

  it("sets a field's label above it in small muted mono capitals, and washes an invalid field red", async () => {
    const form = await open("inputs/field");
    const label = form.locator('[data-slot="field-label"]', { hasText: "Name" });
    const [font, transform, size, color] = await style(label, "font-family", "text-transform", "font-size", "color");
    expect([font?.startsWith('"Geist Mono'), transform, size, color]).toEqual([
      true,
      "uppercase",
      "11px",
      await themeColor(page, "--muted-foreground"),
    ]);
    const card = await themeColor(page, "--card");
    const [plain] = await style(form.getByLabel("Name"), "background-color");
    const [invalid, edge] = await style(form.getByLabel("Folio number"), "background-color", "border-top-color");
    expect(invalid).not.toBe(plain);
    expect(invalid).not.toBe(card);
    expect(edge).toBe(await themeColor(page, "--destructive"));
  });

  it("focuses a field as a 2px outline in the text colour on its own edge, with no halo", async () => {
    const form = await open("inputs/field");
    const name = form.getByLabel("Name");
    await name.focus();
    const ink = await themeColor(page, "--foreground");
    expect(await themeColor(page, "--ring")).toBe(ink);
    await expect
      .poll(async () =>
        (await style(name, "outline-style", "outline-width", "outline-color", "outline-offset")).join(" "),
      )
      .toBe(`solid 2px ${ink} -1px`);
    const [shadow = ""] = await style(name, "box-shadow");
    expect(
      shadow
        .split(/,(?![^(]*\))/)
        .every((layer) => layer.trim().endsWith("0px 0px 0px 0px") || layer.trim() === "none"),
    ).toBe(true);
  });

  it("focuses a pressed toggle with an outline 2px clear of its black fill, never a halo beside it", async () => {
    const form = await open("inputs/field");
    // Keyboard focus, so :focus-visible applies: Tab from the field before the group, then arrow to the pressed item.
    await form.getByLabel("Folio number").focus();
    await page.keyboard.press("Tab");
    for (let step = 0; step < 3; step++) {
      if ((await page.evaluate(() => document.activeElement?.textContent)) === "Quarterly") break;
      await page.keyboard.press("ArrowRight");
    }
    const pressed = form.getByRole("button", { name: "Quarterly" });
    expect(await pressed.evaluate((el) => el === document.activeElement && el.getAttribute("aria-pressed"))).toBe(
      "true",
    );
    const ink = await themeColor(page, "--foreground");
    await expect
      .poll(async () =>
        (await style(pressed, "outline-style", "outline-width", "outline-color", "outline-offset")).join(" "),
      )
      .toBe(`solid 2px ${ink} 2px`);
    const [shadow = ""] = await style(pressed, "box-shadow");
    expect(
      shadow
        .split(/,(?![^(]*\))/)
        .every((layer) => layer.trim().endsWith("0px 0px 0px 0px") || layer.trim() === "none"),
    ).toBe(true);
  });

  it("sets a label in a FieldContent in mono capitals, and a right-aligned word in the sans", async () => {
    const form = await open("inputs/field");
    const label = await form.locator('[data-slot="field-label"]', { hasText: "Name" }).evaluate((el) => {
      const content = document.createElement("div");
      content.dataset.slot = "field-content";
      el.before(content);
      content.append(el);
      return [getComputedStyle(el).fontFamily.startsWith('"Geist Mono'), getComputedStyle(el).textTransform];
    });
    expect(label).toEqual([true, "uppercase"]);
    const table = await open("components/table");
    const word = await table
      .locator('[data-slot="table-body"] [data-slot="table-cell"]')
      .first()
      .evaluate((el) => {
        const cell = el.cloneNode() as HTMLElement;
        cell.className = "text-right";
        cell.textContent = "On track";
        el.after(cell);
        const family = getComputedStyle(cell).fontFamily;
        cell.remove();
        return family;
      });
    expect(word.startsWith('"Geist Mono')).toBe(false);
  });

  it("keeps the text-colour rule under a data table's sticky header", async () => {
    const data = await open("data/data-table");
    const rule = await data
      .locator('[data-slot="table-header"]')
      .first()
      .evaluate((el) => {
        // The sticky header draws its rule as an ::after line, which stays when the rows scroll under it.
        el.classList.add(
          "after:absolute",
          "after:bottom-0",
          "after:left-0",
          "after:right-0",
          "after:h-px",
          "after:bg-border",
        );
        return getComputedStyle(el, "::after").backgroundColor;
      });
    expect(rule).toBe(await themeColor(page, "--foreground"));
  });

  it("parts a non-collapsible sidebar from the page with a hairline, its group label in mono capitals and its rows compact", async () => {
    await open("components/table");
    // A collapsible sidebar is edged by shadcn; a non-collapsible one, in the page's flow, by the theme.
    const edge = await page.evaluate(() => {
      const sidebar = document.body.appendChild(document.createElement("div"));
      sidebar.dataset.slot = "sidebar";
      const width = getComputedStyle(sidebar).borderRightWidth;
      sidebar.remove();
      return width;
    });
    expect(edge).toBe("1px");
    const [font, transform] = await style(
      page.locator('[data-slot="sidebar-group-label"]').first(),
      "font-family",
      "text-transform",
    );
    expect([font?.startsWith('"Geist Mono'), transform]).toEqual([true, "uppercase"]);
    // A row that opens a group: it renders as the group's collapsible trigger.
    const row = page.locator('[data-sidebar="menu-button"]:not([data-size="lg"])', { hasText: "Foundations" });
    expect(await style(row, "height")).toEqual(["28px"]);
  });
});
