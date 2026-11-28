// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
  CalendarHeatmapLegend,
} from "../src/components/registry/heatmap/calendar-heatmap";
import { heat, heatFill } from "../src/lib/heat";

const render = (data: { date: string; value: number }[], range?: number) =>
  renderToStaticMarkup(
    <CalendarHeatmap data={data} signed range={range}>
      <CalendarHeatmapBody>
        {({ activity, dayIndex, weekIndex }) => (
          <CalendarHeatmapBlock activity={activity} dayIndex={dayIndex} weekIndex={weekIndex} />
        )}
      </CalendarHeatmapBody>
      <CalendarHeatmapLegend valueFormatter={(value) => `₹${value}`} />
    </CalendarHeatmap>,
  );

/** The day with this date, as rendered. */
const day = (html: string, date: string) => new RegExp(`<rect[^>]*data-date="${date}"[^>]*>`).exec(html)?.[0] ?? "";

/** The fill of the day with this date. */
const fill = (html: string, date: string) =>
  new RegExp(`<rect[^>]*data-date="${date}"[^>]*style="fill:([^;"]*)`).exec(html)?.[1];

const days = [
  { date: "2026-05-04", value: 9000 },
  { date: "2026-05-05", value: -2500 },
  { date: "2026-05-06", value: 0 },
];

describe("CalendarHeatmap signed", () => {
  it("colours a day by its sign and its size against the largest day", () => {
    const html = render(days);
    expect(fill(html, "2026-05-04")).toBe(heatFill("positive", 5));
    // 2,500 of 9,000 is in the second of five steps.
    expect(fill(html, "2026-05-05")).toBe(heatFill("negative", 2));
    expect(fill(html, "2026-05-06")).toBe(heat(0));
  });

  it("takes the deepest step at a given range instead of the largest day", () => {
    expect(fill(render(days, 18_000), "2026-05-04")).toBe(heatFill("positive", 3));
  });

  it("marks a day's sign by its shape and edge as well as its colour: a loss round, a gain square", () => {
    const html = render(days);
    const [gain, loss, none] = ["2026-05-04", "2026-05-05", "2026-05-06"].map((date) => day(html, date));
    expect(gain).toContain('stroke="var(--positive)"');
    expect(loss).toContain('stroke="var(--negative)"');
    expect(none).toContain('stroke="var(--input)"');
    expect(Number(/ rx="([\d.]+)"/.exec(loss)?.[1])).toBeGreaterThan(Number(/ rx="([\d.]+)"/.exec(gain)?.[1]));
  });

  it("treats an infinite day as no figure, never the deepest gain or loss", () => {
    const html = render([...days, { date: "2026-05-07", value: Number.POSITIVE_INFINITY }]);
    expect(fill(html, "2026-05-07")).toBe(heat(null));
    expect(fill(html, "2026-05-04")).toBe(heatFill("positive", 5));
  });

  it("says in the legend where the deepest step sits, in the page's format", () => {
    expect(render(days)).toContain("Deepest at ±₹9000. Round days lost, square days gained; grey days had no change.");
  });

  it("shows the loss steps deepest first, no change, then the gain steps in the legend", () => {
    const legend = /data-slot="calendar-heatmap-legend".*<\/fieldset>/.exec(render(days))?.[0] ?? "";
    const fills = [...legend.matchAll(/style="fill:([^"]*)"/g)].map(([, value]) => value);
    expect(fills).toEqual([
      ...[5, 4, 3, 2, 1].map((step) => heatFill("negative", step)),
      heat(null),
      ...[1, 2, 3, 4, 5].map((step) => heatFill("positive", step)),
    ]);
  });
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Renders into the document, runs `check` on the host, and unmounts. */
async function mounted(element: ReactNode, check: (host: HTMLElement) => Promise<void> | void) {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  try {
    await act(async () => root.render(element));
    await check(host);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
}

/** Every day from the first date to the last, each worth 1. */
const span = (from: string, to: string) => {
  const every: { date: string; value: number }[] = [];
  for (let at = Date.parse(from); at <= Date.parse(to); at += 86_400_000) {
    every.push({ date: new Date(at).toISOString().slice(0, 10), value: 1 });
  }
  return every;
};

describe("CalendarHeatmap month ticks", () => {
  it("leaves out a tick the scrolled strip cuts at its left edge, and names the year on the first in view", async () => {
    await mounted(
      <CalendarHeatmap data={span("2026-04-01", "2026-11-27")} weekStart={1} blockSize={10}>
        <CalendarHeatmapBody>
          {({ activity, dayIndex, weekIndex }) => (
            <CalendarHeatmapBlock activity={activity} dayIndex={dayIndex} weekIndex={weekIndex} />
          )}
        </CalendarHeatmapBody>
      </CalendarHeatmap>,
      async (host) => {
        const ticks = () => [...host.querySelectorAll("text[dominant-baseline=hanging]")].map((t) => t.textContent);
        expect(ticks().slice(0, 2)).toEqual(["Apr 2026", "May"]);
        // As at 1280px on the portfolio page: scrolled 85px to the latest weeks, past the April tick's start (43px).
        const body = host.querySelector<HTMLElement>('[data-slot="calendar-heatmap-body"]');
        await act(async () => {
          if (body) body.scrollLeft = 85;
          body?.dispatchEvent(new Event("scroll"));
        });
        expect(ticks().slice(0, 2)).toEqual(["May 2026", "Jun"]);
      },
    );
  });
});
