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
      <CalendarHeatmapLegend />
    </CalendarHeatmap>,
  );

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
