// @vitest-environment happy-dom
import { DistributionBar, type DistributionSegment } from "@siyahi/ui";
import { act } from "react";
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

async function render(element: React.ReactElement): Promise<void> {
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root?.render(element));
}

const segments = () => [...document.querySelectorAll<HTMLElement>('[data-slot="distribution-segment"]')];
const placed = () => segments().map((s) => [s.style.left, s.style.width]);
const legend = () => [...document.querySelectorAll("li")].map((li) => li.textContent);

describe("DistributionBar", () => {
  it("splits the bar by share of the total when it has no max, as upstream does", async () => {
    await render(
      <DistributionBar
        segments={[
          { name: "Winners", value: 30 },
          { name: "Losers", value: 10 },
        ]}
      />,
    );
    expect(placed()).toEqual([
      ["0%", "75%"],
      ["75%", "25%"],
    ]);
    expect(legend()).toEqual(["Winners75.0%", "Losers25.0%"]);
  });

  it("draws on a fixed scale with max, leaving the rest of the track empty, and gives values in the legend", async () => {
    await render(
      <DistributionBar
        max={10}
        valueFormatter={(v) => `${v} GiB`}
        segments={[
          { name: "Under High", value: 3 },
          { name: "Over High", value: 2 },
        ]}
      />,
    );
    expect(placed()).toEqual([
      ["0%", "30%"],
      ["30%", "20%"],
    ]);
    expect(legend()).toEqual(["Under High3 GiB", "Over High2 GiB"]);
  });

  it("stacks a negative segment leftward from zero on a scale that runs below it", async () => {
    await render(
      <DistributionBar
        min={-10}
        max={10}
        showLegend={false}
        segments={[
          { name: "INFY", value: 4 },
          { name: "ITC", value: -3 },
          { name: "TCS", value: 2 },
          { name: "WIPRO", value: -1 },
        ]}
      />,
    );
    expect(placed()).toEqual([
      ["50%", "20%"],
      ["35%", "15%"],
      ["70%", "10%"],
      ["30%", "5%"],
    ]);
  });

  it("draws each marker as a labelled line at its value", async () => {
    await render(
      <DistributionBar max={10} markers={[{ at: 8, label: "Max" }]} segments={[{ name: "Used", value: 5 }]} />,
    );
    const line = document.querySelector<HTMLElement>('[data-slot="distribution-marker"]');
    const label = [...document.querySelectorAll<HTMLElement>("span")].find((s) => s.textContent === "Max");
    expect(line?.style.left).toBe("80%");
    expect(label?.style.left).toBe("80%");
  });

  it("fades every segment but the highlighted one, and reports the segment under the pointer", async () => {
    const onHover = vi.fn<(segment: DistributionSegment | null) => void>();
    await render(
      <DistributionBar
        showLegend={false}
        highlighted="itc-dhan"
        onHover={onHover}
        segments={[
          { name: "ITC", key: "itc-kite", value: 3 },
          { name: "ITC", key: "itc-dhan", value: 2 },
        ]}
      />,
    );
    expect(segments().map((s) => s.style.opacity)).toEqual(["0.35", "1"]);
    await act(async () => {
      segments()[1]?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body }));
      segments()[1]?.parentElement?.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
      );
    });
    expect(onHover.mock.calls.map(([s]) => s?.key ?? null)).toEqual(["itc-dhan", null]);
  });

  it("fits a negative segment on the bar when no min is given, instead of clipping it off the left", async () => {
    await render(
      <DistributionBar
        showLegend={false}
        segments={[
          { name: "Gains", value: 6 },
          { name: "Losses", value: -2 },
        ]}
      />,
    );
    // The scale runs from the losses' total to the gains': -2 to 6.
    expect(placed()).toEqual([
      ["25%", "75%"],
      ["0%", "25%"],
    ]);
  });

  it("draws two markers at one value, and none outside the scale", async () => {
    const error = vi.spyOn(console, "error");
    await render(
      <DistributionBar
        max={10}
        showLegend={false}
        markers={[
          { at: 8, label: "High" },
          { at: 8, label: "Max" },
          { at: 14, label: "Past the end" },
        ]}
        segments={[{ name: "Used", value: 5 }]}
      />,
    );
    const lines = [...document.querySelectorAll<HTMLElement>('[data-slot="distribution-marker"]')];
    expect(lines.map((line) => line.style.left)).toEqual(["80%", "80%"]);
    expect(document.body.textContent).not.toContain("Past the end");
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("takes the page's aria-label for the bar, when given one", async () => {
    await render(
      <DistributionBar
        aria-label="3 winning positions worth ₹1,16,000 against 3 losing ones worth ₹46,000"
        showLegend={false}
        segments={[{ name: "INFY", value: 4 }]}
      />,
    );
    expect(document.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "3 winning positions worth ₹1,16,000 against 3 losing ones worth ₹46,000",
    );
  });

  it("aligns a marker label at either end of the bar to that end, so it stays inside the bar's width", async () => {
    await render(
      <DistributionBar
        max={12}
        showLegend={false}
        markers={[
          { at: 0, label: "Empty" },
          { at: 6, label: "High" },
          { at: 12, label: "Full" },
        ]}
        segments={[{ name: "Used", value: 5 }]}
      />,
    );
    const label = (text: string) =>
      [...document.querySelectorAll<HTMLElement>("span")].find((s) => s.textContent === text);
    expect(label("Empty")?.className).toContain("translate-x-0");
    expect(label("High")?.className).toContain("-translate-x-1/2");
    expect(label("Full")?.className).toContain("-translate-x-full");
  });
});
