// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DataTableRoot } from "../src/components/registry/niko-table/core/data-table-root";
import type { DataTableColumnDef, ExtendedColumnFilter } from "../src/components/registry/niko-table/types";
import { DataTableActiveFilters } from "../src/components/siyahi/data-table-active-filters";
import { DataTableRowCount } from "../src/components/siyahi/data-table-row-count";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

interface Order {
  order: string;
  status: string;
}
const data: Order[] = [
  { order: "ORD-1", status: "Packed" },
  { order: "ORD-2", status: "Out for delivery" },
  { order: "ORD-3", status: "Delivered" },
];
const columns: DataTableColumnDef<Order>[] = [
  { accessorKey: "order", meta: { label: "Order" } },
  { accessorKey: "status", meta: { label: "Status" } },
];
const inTransit: ExtendedColumnFilter<Order> = {
  id: "status",
  value: ["Packed", "Out for delivery"],
  variant: "multiSelect",
  operator: "in",
  filterId: "faceted-status",
  joinOperator: "and",
};

let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

async function render() {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () =>
    root?.render(
      <DataTableRoot
        data={data}
        columns={columns}
        // No filter control is on the page to switch filtering on by itself.
        config={{ enableFilters: true }}
        initialState={{ columnFilters: [{ id: "status", value: inTransit }], globalFilter: "ORD" }}
      >
        <DataTableRowCount unit="orders" />
        <DataTableActiveFilters />
      </DataTableRoot>,
    ),
  );
}
const chips = () => [...document.querySelectorAll("button")].map((button) => button.textContent);
const count = () => document.querySelector('[data-slot="data-table-row-count"]')?.textContent;
const click = (name: string) =>
  act(async () => [...document.querySelectorAll("button")].find((b) => b.textContent === name)?.click());

describe("DataTableActiveFilters", () => {
  it("names each value set, as its column's label and the option, and removing one keeps the others", async () => {
    await render();
    expect(chips()).toEqual(["Search: ORD", "Status: Packed", "Status: Out for delivery", "Reset filters"]);
    expect(count()).toBe("2 of 3");
    await click("Status: Packed");
    expect(chips()).toEqual(["Search: ORD", "Status: Out for delivery", "Reset filters"]);
    expect(count()).toBe("1 of 3");
  });

  it("resets the search and every filter at once, and then shows nothing", async () => {
    await render();
    await click("Reset filters");
    expect(chips()).toEqual([]);
    expect(count()).toBe("3 orders");
  });
});
