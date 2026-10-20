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
import { afterEach, describe, expect, it } from "vite-plus/test";
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

const firstColumn = () =>
  [...document.querySelectorAll("tbody tr")].map((row) => row.querySelector("td")?.textContent?.trim());

describe("data table column menus", () => {
  it("DataTableColumnActions opens with its labels and sorts the column", async () => {
    const menu = await openColumnMenu(<DataTableExample />, "Value");
    expect(menu.textContent).toContain("Column Actions");
    expect(menu.textContent).toContain("Column Sort");
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
