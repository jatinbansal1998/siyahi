// @vitest-environment happy-dom
import {
  DataTable,
  DataTableBody,
  DataTableColumnHeader,
  DataTableColumnSortMenu,
  DataTableColumnTitle,
  DataTableHeader,
  DataTableRoot,
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

// The example's six holdings, under one header row.
const holdingsShown = 6;

const firstColumn = () =>
  [...document.querySelectorAll("tbody tr")].map((row) => row.querySelector("td")?.textContent?.trim());

describe("data table surfaces", () => {
  beforeEach(async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<DataTableExample />));
  });

  it("paints the pinned column in the card's colour, so it shows no stripe inside a card", () => {
    const pinned = [...document.querySelectorAll<HTMLElement>('[data-col-id="symbol"]')];
    expect(pinned.length).toBe(holdingsShown + 1);
    for (const cell of pinned) expect(cell.style.backgroundColor).toBe("var(--card)");
  });

  it("paints the sticky header in the card's colour", () => {
    expect(document.querySelector("thead")?.classList.contains("bg-card")).toBe(true);
  });
});

describe("data table column menus", () => {
  it("DataTableColumnActions opens with its labels and sorts the column", async () => {
    const menu = await openColumnMenu(<DataTableExample />, "Value");
    expect(menu.textContent).toContain("Column Actions");
    expect(menu.textContent).toContain("Column Sort");
    await pick(menu, "High to Low");
    expect(firstColumn().slice(0, 3)).toEqual(["ITC", "HDFCBANK", "ICICIBANK"]);
  });

  it("DataTableColumnActions opens again after Escape closes it, with both labels", async () => {
    let menu = await openColumnMenu(<DataTableExample />, "Value");
    for (let round = 0; round < 2; round++) {
      await act(async () => menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(document.querySelector('[role="menu"]')).toBeNull();
      menu = await reopenColumnMenu("Value");
    }
    const groups = [...menu.querySelectorAll('[role="group"]')];
    expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby") ?? "")?.textContent)).toEqual([
      "Column Actions",
      "Column Sort",
    ]);
    await pick(menu, "High to Low");
    expect(firstColumn().slice(0, 3)).toEqual(["ITC", "HDFCBANK", "ICICIBANK"]);
  });

  it("DataTableColumnSortMenu opens on its own and sorts the column", async () => {
    const columns: DataTableColumnDef<{ symbol: string }>[] = [
      {
        accessorKey: "symbol",
        meta: { label: "Symbol" },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Symbol" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
      },
    ];
    const table = (
      <DataTableRoot data={[{ symbol: "INFY" }, { symbol: "ITC" }, { symbol: "TCS" }]} columns={columns}>
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>
    );
    const menu = await openColumnMenu(table, "Symbol");
    expect(menu.textContent).toContain("Column Sort");
    await pick(menu, "Desc");
    expect(firstColumn()).toEqual(["TCS", "ITC", "INFY"]);
  });
});
