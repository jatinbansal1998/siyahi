// @vitest-environment happy-dom
import { SectionCards } from "@siyahi/ui";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vite-plus/test";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

describe("SectionCards", () => {
  // dashboard-01 painted its tiles with a gradient and its own shadow through
  // `*:data-[slot=card]:` classes on the grid; a tile is a stock Card instead.
  it("leaves its tiles the stock Card surface", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<SectionCards items={[{ label: "Invested", value: "₹40,25,000" }]} />));
    const grid = document.querySelector('[data-slot="card"]')?.parentElement;
    expect(grid?.className).toBe("grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4");
  });
});
