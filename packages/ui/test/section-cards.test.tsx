// @vitest-environment happy-dom
import { Card } from "../src/components/ui/card";
import { SectionCards } from "../src/components/registry/dashboard-01/section-cards";
import { SiyahiProvider, type Surface } from "../src/components/siyahi/siyahi-provider";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

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
  // The theme washes a card by its data-tone; a falling figure alone must not mark it, only the page's tone.
  it("sets tiles 8px apart on a card surface and 16px apart on an open one", async () => {
    const gaps: Record<string, string | undefined> = {};
    for (const pick of ["card", "open"] satisfies Surface[]) {
      root = createRoot(document.body.appendChild(document.createElement("div")));
      await act(async () =>
        root?.render(
          <SiyahiProvider surface={pick}>
            <SectionCards items={[{ label: "Invested", value: "₹40,25,000" }]} />
          </SiyahiProvider>,
        ),
      );
      const grid = document.querySelector('[data-slot="section-card"]')?.parentElement;
      gaps[pick] = grid?.className.split(/\s+/).find((token) => token.startsWith("gap-"));
      await act(async () => root?.unmount());
      document.body.replaceChildren();
    }
    expect(gaps).toEqual({ card: "gap-2", open: "gap-4" });
  });

  it("marks only the tile the page sets a tone on", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <SectionCards
          items={[
            { label: "Cash flow", value: "-₹61,200", tone: "negative" },
            { label: "Costs", value: "₹12,000", badge: "-8%" },
          ]}
        />,
      ),
    );
    const tones = [...document.querySelectorAll('[data-slot="card"]')].map((card) => card.getAttribute("data-tone"));
    expect(tones).toEqual(["negative", null]);
  });

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

  it("will not pick a disabled tile, and fades it", async () => {
    const onSelect = vi.fn<(label: string) => void>();
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <SectionCards
          items={[
            { label: "Equity", value: 164 },
            { label: "Gold bonds", value: 0, disabled: true },
          ]}
          onSelect={onSelect}
        />,
      ),
    );
    await act(async () => button("Gold bonds")?.click());
    await act(async () => button("Equity")?.click());
    expect(onSelect.mock.calls).toEqual([["Equity"]]);
    expect(button("Gold bonds")?.disabled).toBe(true);
    const faded = [...document.querySelectorAll('[data-slot="card"]')].filter((c) =>
      c.classList.contains("opacity-60"),
    );
    expect(faded.map((c) => c.querySelector("button")?.getAttribute("aria-label"))).toEqual(["Gold bonds"]);
  });

  it("puts a trend between the figure and the footer lines", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () =>
      root?.render(
        <SectionCards
          items={[{ label: "Value", value: 1, trend: <svg data-testid="trend" />, detail: "Six months" }]}
        />,
      ),
    );
    const slots = [...(document.querySelector('[data-slot="card"]')?.children ?? [])].map((el) =>
      el.querySelector('[data-testid="trend"]') ? "trend" : el.getAttribute("data-slot"),
    );
    expect(slots).toEqual(["card-header", "trend", "card-footer"]);
  });

  it("lets a long headline wrap instead of clipping it to one line", async () => {
    root = createRoot(document.body.appendChild(document.createElement("div")));
    const headline = "+₹1,48,600 this year across 212 orders from two warehouses";
    await act(async () => root?.render(<SectionCards items={[{ label: "All", value: 212, headline }]} />));
    const line = [...document.querySelectorAll('[data-slot="card-footer"] div')].find(
      (d) => d.textContent === headline,
    );
    expect(line?.className).toBeDefined();
    expect(line?.classList.contains("line-clamp-1")).toBe(false);
  });
});
