// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DataTablePagination } from "../src/components/registry/niko-table/components/data-table-pagination";
import { useDataTable } from "../src/components/registry/niko-table/core/data-table-context";
import { DataTableRoot } from "../src/components/registry/niko-table/core/data-table-root";
import type { DataTableColumnDef } from "../src/components/registry/niko-table/types";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

interface Invoice {
  invoice: string;
}
const data: Invoice[] = Array.from({ length: 1240 }, (_, i) => ({ invoice: `INV-${i + 1}` }));
const columns: DataTableColumnDef<Invoice>[] = [{ accessorKey: "invoice", meta: { label: "Invoice" } }];

function Rows() {
  const { table } = useDataTable<Invoice>();
  return (
    <>
      <button type="button" onClick={() => table.setGlobalFilter("INV-12")}>
        Search
      </button>
      <ol>
        {table.getRowModel().rows.map((row) => (
          <li key={row.id}>{row.original.invoice}</li>
        ))}
      </ol>
    </>
  );
}

let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

async function render() {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () =>
    root?.render(
      <DataTableRoot data={data} columns={columns} config={{ enableFilters: true }}>
        <Rows />
        <DataTablePagination pageSizeOptions={[10]} />
      </DataTableRoot>,
    ),
  );
}
const status = () => document.querySelector('[role="status"]')?.textContent;
const next = () =>
  act(async () => document.querySelector<HTMLButtonElement>('button[title="Go to next page"]')?.click());

describe("DataTablePagination", () => {
  it("shows one page of rows and says which, grouped by the locale with an en dash", async () => {
    await render();
    expect(document.querySelectorAll("li")).toHaveLength(10);
    expect(status()).toBe("1–10 of 1,240 rows");
    await next();
    expect(document.querySelector("li")?.textContent).toBe("INV-11");
    expect(status()).toBe("11–20 of 1,240 rows");
  });

  it("goes back to the first page when the search changes, so the rows left are in view", async () => {
    await render();
    await next();
    await next();
    await act(async () => document.querySelector<HTMLButtonElement>("button")?.click());
    // INV-12, INV-120 to INV-129 and INV-1200 to INV-1240.
    expect(status()).toBe("1–10 of 52 rows");
  });
});
