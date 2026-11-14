// @vitest-environment happy-dom
import { MetricStrip } from "../src/components/registry/dashboardcn/kpi-row-card";
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

async function render(node: React.ReactNode): Promise<void> {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root?.render(node));
}

const figures = () => [...document.querySelectorAll('[data-slot="metric-strip-item"]')];
const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

describe("MetricStrip", () => {
  // The theme washes a figure by its data-tone; a falling figure alone must not mark it, only the page's tone.
  it("marks only the figure the page sets a tone on", async () => {
    await render(
      <MetricStrip
        items={[
          { label: "Cash flow", value: "-₹61,200", tone: "negative" },
          { label: "Costs", value: "₹12,000", change: -0.08 },
        ]}
      />,
    );
    expect(figures().map((figure) => figure.getAttribute("data-tone"))).toEqual(["negative", null]);
  });

  it("marks a stale figure and says since when", async () => {
    await render(
      <MetricStrip
        items={[
          { label: "Revenue", value: "₹45,12,300" },
          { label: "Gift cards", value: "₹38,400", stale: "3 Nov" },
        ]}
      />,
    );
    expect(figures().map((figure) => figure.hasAttribute("data-stale"))).toEqual([false, true]);
    expect(figures()[1]?.querySelector('[data-slot="stale-note"]')?.textContent).toBe("Stale · 3 Nov");
  });

  it("draws the sparkline under the figure, last in it", async () => {
    await render(<MetricStrip items={[{ label: "Revenue", value: "₹45,12,300", change: 0.03, trend: [1, 2, 3] }]} />);
    expect(figures()[0]?.lastElementChild?.getAttribute("data-slot")).toBe("sparkline");
  });
});

function Picker() {
  const [scope, setScope] = useState("All");
  return (
    <MetricStrip
      items={[
        { label: "All", value: "₹1,48,600" },
        { label: "Equity", value: "₹1,71,400" },
      ]}
      selected={scope}
      onSelect={setScope}
    />
  );
}

describe("MetricStrip as a picker", () => {
  it("presses the figure picked and outlines it alone", async () => {
    await render(<Picker />);
    await act(async () => button("Equity")?.click());
    expect(button("Equity")?.getAttribute("aria-pressed")).toBe("true");
    expect(button("All")?.getAttribute("aria-pressed")).toBe("false");
    const picked = figures().filter((figure) => figure.hasAttribute("data-picked"));
    expect(picked.map((figure) => figure.querySelector("button")?.getAttribute("aria-label"))).toEqual(["Equity"]);
  });

  it("will not pick a disabled figure, and fades it", async () => {
    const onSelect = vi.fn<(label: string) => void>();
    await render(
      <MetricStrip
        items={[
          { label: "Equity", value: 164 },
          { label: "Gold bonds", value: 0, disabled: true },
        ]}
        onSelect={onSelect}
      />,
    );
    await act(async () => button("Gold bonds")?.click());
    await act(async () => button("Equity")?.click());
    expect(onSelect.mock.calls).toEqual([["Equity"]]);
    expect(button("Gold bonds")?.disabled).toBe(true);
    const faded = figures().filter((figure) => figure.classList.contains("opacity-60"));
    expect(faded.map((figure) => figure.querySelector("button")?.getAttribute("aria-label"))).toEqual(["Gold bonds"]);
  });

  it("sets a headline's figures on blocks with no sparkline and no tone", async () => {
    await render(
      <MetricStrip
        variant="blocks"
        items={[
          { label: "Net worth", value: "₹41.9L", trend: [1, 2, 3] },
          { label: "Cash flow", value: "−₹61k", tone: "negative" },
        ]}
      />,
    );
    expect(document.querySelector('[data-slot="metric-strip"]')?.getAttribute("data-variant")).toBe("blocks");
    expect(document.querySelectorAll('[data-slot="sparkline"]')).toHaveLength(0);
    expect(figures().map((figure) => figure.getAttribute("data-tone"))).toEqual([null, null]);
  });
});
