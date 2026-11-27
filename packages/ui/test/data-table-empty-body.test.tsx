// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DataTable } from "../src/components/registry/niko-table/core/data-table";
import { DataTableRoot } from "../src/components/registry/niko-table/core/data-table-root";
import { DataTableBody, DataTableEmptyBody } from "../src/components/registry/niko-table/core/data-table-structure";
import type { DataTableColumnDef } from "../src/components/registry/niko-table/types";
import { BlockState } from "../src/components/siyahi/block-state";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

interface Order {
  order: string;
}
const columns: DataTableColumnDef<Order>[] = [{ accessorKey: "order", meta: { label: "Order" } }];

let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

async function render(data: Order[], search: string, body: ReactNode = <DataTableBody />) {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () =>
    root?.render(
      <DataTableRoot
        data={data}
        columns={columns}
        // No search box is on the page to switch filtering on by itself.
        config={{ enableFilters: true }}
        initialState={{ globalFilter: search }}
      >
        <DataTable aria-label="Orders">{body}</DataTable>
      </DataTableRoot>,
    ),
  );
}
const body = () => document.querySelector("tbody")?.textContent;

describe("DataTableBody with no rows to show", () => {
  it("says the search matches no row, and Reset filters brings the rows back", async () => {
    await render([{ order: "ORD-1" }], "zzzz");
    expect(body()).toBe("No row matches the searchReset filters");
    await act(async () => document.querySelector("button")?.click());
    expect(body()).toBe("ORD-1");
  });

  it("says there are no rows when the table has no data", async () => {
    await render([], "");
    expect(body()).toBe("No rows to show");
  });

  it("shows the page's own empty body in place of the default", async () => {
    await render(
      [],
      "",
      <DataTableBody>
        <DataTableEmptyBody>
          <BlockState title="No order is waiting to ship" />
        </DataTableEmptyBody>
      </DataTableBody>,
    );
    expect(body()).toBe("No order is waiting to ship");
  });
});
