// @vitest-environment happy-dom
import {
  DataTable,
  DataTableBody,
  DataTableColumnActions,
  DataTableColumnHeader,
  DataTableColumnSortMenu,
  DataTableColumnSortOptions,
  DataTableColumnTitle,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  type DataTableColumnDef,
} from "@siyahi/ui";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import DataTableExample from "../src/examples/data-table";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

/** Renders the table and clicks the menu button in the header titled `title`. */
async function openColumnMenu(table: ReactNode, title: string): Promise<HTMLElement> {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root?.render(table));
  return reopenColumnMenu(title);
}

/** Clicks the menu button in the header titled `title` of the table already rendered. */
async function reopenColumnMenu(title: string): Promise<HTMLElement> {
  const header = [...document.querySelectorAll("th")].find((th) => th.textContent?.includes(title));
  const trigger = header?.querySelector<HTMLElement>('[data-slot="dropdown-menu-trigger"]');
  if (!trigger) throw new Error(`no column menu on ${title}`);
  await act(async () => trigger.click());
  const menu = document.querySelector<HTMLElement>('[role="menu"]');
  if (!menu) throw new Error("the column menu did not open");
  return menu;
}

async function pick(menu: HTMLElement, label: string): Promise<void> {
  const item = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((el) => el.textContent === label);
  if (!item) throw new Error(`no menu item ${label}`);
  await act(async () => item.click());
}

// The example's six products, under one header row.
const productsShown = 6;

const firstColumn = () =>
  [...document.querySelectorAll("tbody tr")].map((row) => row.querySelector("td")?.textContent?.trim());

describe("data table surfaces", () => {
  beforeEach(async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<DataTableExample />));
  });

  it("paints the pinned column in the colour under the table, so it shows no stripe", () => {
    const pinned = [...document.querySelectorAll<HTMLElement>('[data-col-id="product"]')];
    expect(pinned.length).toBe(productsShown + 1);
    for (const cell of pinned) expect(cell.style.backgroundColor).toBe("var(--table-fill)");
  });

  it("paints the sticky header in the colour under the table", () => {
    expect(document.querySelector("thead")?.classList.contains("bg-(--table-fill)")).toBe(true);
  });

  it("rules the pinned column with a hairline at the row lines' weight", () => {
    const pinned = document.querySelector<HTMLElement>('td[data-col-id="product"]');
    expect(pinned?.getAttribute("style")).toContain("box-shadow: inset -1px 0 0 0 var(--border);");
  });

  it("marks only the row the page tones, and flags its pinned cell for the theme's wash", () => {
    const tones = [...document.querySelectorAll("tbody tr")].map((row) => row.getAttribute("data-tone"));
    // The example tones the one product selling under 50 units, the bookshelf.
    expect(tones).toEqual([null, null, "warning", null, null, null]);
    expect(document.querySelector("tbody tr[data-tone] > td[data-pinned]")?.textContent).toBe("Bookshelf");
  });

  // happy-dom paints nothing, so this checks that the pinned cells and the
  // sticky header sit inside an `isolate` box; the stacking itself was checked
  // in Chromium against the catalogue.
  it("keeps its z-indexes in its own stacking context, under a page's sticky header", () => {
    const pinned = document.querySelector('td[data-col-id="product"]');
    expect(pinned?.closest(".isolate")).not.toBeNull();
    expect(pinned?.closest(".isolate")?.contains(document.querySelector("thead"))).toBe(true);
  });
});

// The example's products by revenue, each column with the full column menu.
const menuHeader = (title: string) => () => (
  <DataTableColumnHeader>
    <DataTableColumnTitle title={title} />
    <DataTableColumnActions>
      <DataTableColumnSortOptions />
    </DataTableColumnActions>
  </DataTableColumnHeader>
);
const menuTable = (
  <DataTableRoot
    data={[
      { product: "Standing desk", revenue: 224400 },
      { product: "Office chair", revenue: 262500 },
      { product: "Bookshelf", revenue: 166000 },
      { product: "Dinner set", revenue: 276000 },
      { product: "Kids chair", revenue: 258000 },
      { product: "Desk lamp", revenue: 255600 },
    ]}
    columns={[
      { accessorKey: "product", header: menuHeader("Product") },
      { accessorKey: "revenue", header: menuHeader("Revenue"), meta: { variant: "number" } },
    ]}
  >
    <DataTable>
      <DataTableHeader />
      <DataTableBody />
    </DataTable>
  </DataTableRoot>
);

describe("data table column menus", () => {
  it("DataTableColumnActions opens with its labels and sorts the column", async () => {
    const menu = await openColumnMenu(menuTable, "Revenue");
    expect(menu.textContent).toContain("Column Actions");
    expect(menu.textContent).toContain("Column Sort");
    await pick(menu, "High to Low");
    expect(firstColumn().slice(0, 3)).toEqual(["Dinner set", "Office chair", "Kids chair"]);
  });

  it("DataTableColumnActions opens again after Escape closes it, with both labels", async () => {
    let menu = await openColumnMenu(menuTable, "Revenue");
    for (let round = 0; round < 2; round++) {
      await act(async () => menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(document.querySelector('[role="menu"]')).toBeNull();
      menu = await reopenColumnMenu("Revenue");
    }
    const groups = [...menu.querySelectorAll('[role="group"]')];
    expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby") ?? "")?.textContent)).toEqual([
      "Column Actions",
      "Column Sort",
    ]);
    await pick(menu, "High to Low");
    expect(firstColumn().slice(0, 3)).toEqual(["Dinner set", "Office chair", "Kids chair"]);
  });

  it("DataTableColumnSortMenu opens on its own and sorts the column", async () => {
    const columns: DataTableColumnDef<{ product: string }>[] = [
      {
        accessorKey: "product",
        meta: { label: "Product" },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Product" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
      },
    ];
    const table = (
      <DataTableRoot
        data={[{ product: "Bookshelf" }, { product: "Dinner set" }, { product: "Standing desk" }]}
        columns={columns}
      >
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>
    );
    const menu = await openColumnMenu(table, "Product");
    expect(menu.textContent).toContain("Column Sort");
    await pick(menu, "Desc");
    expect(firstColumn()).toEqual(["Standing desk", "Dinner set", "Bookshelf"]);
  });
});

const sortButton = (title: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("th button")].find((b) => b.textContent?.startsWith(title));
const rowCount = () => document.querySelector('[data-slot="data-table-row-count"]')?.textContent;

describe("data table toolbar and sort header", () => {
  beforeEach(async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<DataTableExample />));
  });

  it("DataTableSortHeader sorts largest first on one click, then smallest", async () => {
    expect(sortButton("Revenue")?.textContent).toBe("Revenue");
    await act(async () => sortButton("Revenue")?.click());
    expect(firstColumn().slice(0, 3)).toEqual(["Dinner set", "Office chair", "Kids chair"]);
    expect(sortButton("Revenue")?.textContent).toBe("Revenue, sorted descending");
    await act(async () => sortButton("Revenue")?.click());
    expect(firstColumn().slice(0, 3)).toEqual(["Bookshelf", "Standing desk", "Desk lamp"]);
    expect(sortButton("Revenue")?.textContent).toBe("Revenue, sorted ascending");
  });

  it("DataTableRowCount counts the rows the search leaves, named by the search's label", async () => {
    expect(rowCount()).toBe("6 products");
    const search = document.querySelector<HTMLInputElement>('input[aria-label="Filter products"]');
    if (!search) throw new Error("no search field labelled Filter products");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(search, "chair");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(firstColumn()).toEqual(["Office chair", "Kids chair"]);
    expect(rowCount()).toBe("2 of 6");
  });
});

const sortHeader = () => <DataTableSortHeader />;

describe("data table sort state", () => {
  it("marks only the primary sort column's head with aria-sort when a second column breaks its ties", async () => {
    const columns: DataTableColumnDef<{ team: string; points: number }>[] = [
      { accessorKey: "team", header: sortHeader, meta: { label: "Team" } },
      { accessorKey: "points", header: sortHeader, meta: { label: "Points", variant: "number" } },
    ];
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <DataTableRoot
          data={[
            { team: "Kestrels", points: 9 },
            { team: "Herons", points: 12 },
          ]}
          columns={columns}
          initialState={{
            sorting: [
              { id: "points", desc: true },
              { id: "team", desc: false },
            ],
          }}
        >
          <DataTable>
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>,
      ),
    );
    const sorted = [...document.querySelectorAll("th[aria-sort]")];
    expect(sorted.map((th) => [th.getAttribute("data-col-id"), th.getAttribute("aria-sort")])).toEqual([
      ["points", "descending"],
    ]);
  });
});
