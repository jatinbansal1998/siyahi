// @vitest-environment happy-dom
import { Card, SectionCards } from "@siyahi/ui";
import { act, useState } from "react";
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

function Picker() {
  const [scope, setScope] = useState("All");
  return (
    <SectionCards
      items={[
        { label: "All", value: "₹1,48,600" },
        { label: "Equity", value: "₹1,71,400" },
      ]}
      selected={scope}
      onSelect={setScope}
    />
  );
}

const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

describe("SectionCards as a picker", () => {
  it("presses the tile picked and rings it alone", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root?.render(<Picker />));
    await act(async () => button("Equity")?.click());
    expect(button("Equity")?.getAttribute("aria-pressed")).toBe("true");
    expect(button("All")?.getAttribute("aria-pressed")).toBe("false");
    const ringed = [...document.querySelectorAll('[data-slot="card"]')].filter((c) =>
      c.classList.contains("ring-primary!"),
    );
    expect(ringed.map((c) => c.querySelector("button")?.getAttribute("aria-label"))).toEqual(["Equity"]);
  });
});
