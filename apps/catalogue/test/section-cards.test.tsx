// @vitest-environment happy-dom
import { Card, SectionCards } from "@siyahi/ui";
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

/** The background and shadow utilities in a className, variants included (`dark:*:…:bg-card`). */
const surface = (className: string | undefined): string[] =>
  (className ?? "").split(/\s+/).filter((token) => /^(bg-|from-|to-|via-|shadow-)/.test(token.split(":").at(-1) ?? ""));

describe("SectionCards", () => {
  // dashboard-01 painted its tiles with a gradient and its own shadow through
  // `*:data-[slot=card]:` classes on the grid; a tile is a stock Card instead.
  it("leaves its tiles the stock Card surface", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <>
          <SectionCards items={[{ label: "Invested", value: "₹40,25,000" }]} />
          <Card data-testid="plain" />
        </>,
      ),
    );
    const plain = document.querySelector('[data-testid="plain"]');
    const tile = document.querySelector('[data-slot="card"]:not([data-testid])');
    expect(surface(tile?.parentElement?.className)).toEqual([]);
    expect(surface(tile?.className)).toEqual(surface(plain?.className));
  });
});
