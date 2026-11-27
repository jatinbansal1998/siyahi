import { describe, expect, it } from "vite-plus/test";
import type { DataTableColumnDef } from "../src/components/registry/niko-table/types";
import { DETAILS_COLUMN_ID, fitColumns } from "../src/lib/compact-columns";

interface Row {
  symbol: string;
  sector: string;
  quantity: number;
  value: number;
  change: number;
}

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "symbol", size: 140, meta: { compact: true } },
  { accessorKey: "sector", size: 120 },
  { accessorKey: "quantity", size: 100 },
  { accessorKey: "value", size: 140, meta: { compact: true } },
  { accessorKey: "change", size: 110 },
];
const order = ["symbol", "sector", "quantity", "value", "change"];

describe("fitColumns", () => {
  it("hides the rightmost columns that are not key columns until the rest fit", () => {
    const fitted = fitColumns(columns, order, {}, 400);
    expect([...(fitted?.hidden ?? [])]).toEqual(["change", "quantity"]);
    expect(fitted?.visibility).toEqual({ change: false, quantity: false });
  });

  it("hides nothing when every column fits", () => {
    expect(fitColumns(columns, order, {}, 610)?.hidden.size).toBe(0);
  });

  it("never hides a key column, even when the key columns alone overflow", () => {
    expect([...(fitColumns(columns, order, {}, 200)?.hidden ?? [])].toSorted()).toEqual([
      "change",
      "quantity",
      "sector",
    ]);
  });

  it("counts only the columns the caller shows, in the caller's order", () => {
    const fitted = fitColumns(columns, ["symbol", "value", "change", "sector", "quantity"], { quantity: false }, 400);
    expect([...(fitted?.hidden ?? [])]).toEqual(["sector"]);
  });

  it("leaves a table without key columns alone", () => {
    const plain = columns.map(({ meta: _meta, ...column }) => column);
    expect(fitColumns(plain, order, {}, 100)).toBeNull();
  });

  it("shows the details column only once a column is hidden, and makes room for it", () => {
    const withDetails = [{ id: DETAILS_COLUMN_ID, size: 36 }, ...columns];
    const all = [DETAILS_COLUMN_ID, ...order];
    expect(fitColumns(withDetails, all, {}, 610)?.visibility).toEqual({ [DETAILS_COLUMN_ID]: false });
    // Without it, hiding change and quantity leaves 400; its 36 more push sector out too.
    const fitted = fitColumns(withDetails, all, {}, 400);
    expect([...(fitted?.hidden ?? [])]).toEqual(["change", "quantity", "sector"]);
    expect(fitted?.visibility[DETAILS_COLUMN_ID]).toBeUndefined();
  });

  it("gives back every column but the details one once the reader asks for all", () => {
    const withDetails = [{ id: DETAILS_COLUMN_ID, size: 36 }, ...columns];
    const fitted = fitColumns(withDetails, [DETAILS_COLUMN_ID, ...order], {}, 400, false);
    expect(fitted?.visibility).toEqual({ [DETAILS_COLUMN_ID]: false });
    expect(fitted?.hidden.size).toBe(3);
  });
});
