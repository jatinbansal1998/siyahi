import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import {
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
  StatusHeatmapLegend,
} from "../src/components/registry/heatmap/status-heatmap";

const data = [
  { date: "2026-10-01", value: 3 },
  { date: "2026-10-02", value: 2 },
  { date: "2026-10-03", value: 1 },
];

const html = renderToStaticMarkup(
  <StatusHeatmap data={data} statusValues={[3, 2, 1]}>
    <StatusHeatmapBody>
      {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} />}
    </StatusHeatmapBody>
    <StatusHeatmapLegend />
  </StatusHeatmap>,
);

/** The fill of the first day drawn with this status value. */
const fill = (value: number) =>
  new RegExp(`<rect[^>]*data-slot="status-heatmap-block"[^>]*data-value="${value}"[^>]*style="fill:([^;"]*)`).exec(
    html,
  )?.[1];

describe("StatusHeatmap", () => {
  it("fills a degraded day's lower half amber over the healthy grey, and a critical day solid red", () => {
    const [, id] = /url\(#([^)]+)\)/.exec(fill(2) ?? "") ?? [];
    expect(id).toBeTruthy();
    const gradient = new RegExp(`<linearGradient id="${id}"[^>]*>(.*?)</linearGradient>`).exec(html)?.[1] ?? "";
    expect(
      [...gradient.matchAll(/offset="([^"]*)" style="stop-color:([^"]*)"/g)].map(([, at, color]) => [at, color]),
    ).toEqual([
      ["0.5", "color-mix(in oklab, var(--muted-foreground) 30%, transparent)"],
      ["0.5", "var(--warning)"],
    ]);
    expect(fill(1)).toBe("var(--destructive)");
  });

  it("draws the legend's degraded swatch half-filled too", () => {
    const swatches = [...html.matchAll(/<svg aria-hidden="true"[^>]*>(.*?)<\/svg>/g)].map(([, inner]) => inner ?? "");
    const degraded = swatches.find((inner) => inner.includes('data-value="2"')) ?? "";
    expect(degraded).toMatch(/<linearGradient id="([^"]+)".*fill:url\(#\1\)/);
  });

  it("outlines a highlighted day and keeps its full colour", () => {
    const highlighted = renderToStaticMarkup(
      <StatusHeatmap data={[{ date: "2026-10-01", value: 1 }]}>
        <StatusHeatmapBody>
          {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} highlighted />}
        </StatusHeatmapBody>
      </StatusHeatmap>,
    );
    const block = /<rect[^>]*data-slot="status-heatmap-block"[^>]*>/.exec(highlighted)?.[0] ?? "";
    expect(block).toMatch(/class="[^"]*\bstroke-foreground stroke-1\b/);
    expect(block).toContain('style="fill:var(--destructive)"');
  });

  it("draws a day with no data hollow, in a dashed field-edge outline", () => {
    const empty = renderToStaticMarkup(
      <StatusHeatmap data={[{ date: "2026-10-01", value: 0 }]}>
        <StatusHeatmapBody>
          {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} />}
        </StatusHeatmapBody>
      </StatusHeatmap>,
    );
    const block = /<rect[^>]*data-slot="status-heatmap-block"[^>]*>/.exec(empty)?.[0] ?? "";
    expect(block).toMatch(/class="[^"]*\bstroke-input stroke-1\b/);
    expect(block).toContain('stroke-dasharray="2 2"');
    expect(block).toContain('style="fill:transparent"');
  });

  it("outlines a healthy day in the field-edge colour, solid, around its faint grey", () => {
    const healthy = renderToStaticMarkup(
      <StatusHeatmap data={[{ date: "2026-10-01", value: 3 }]}>
        <StatusHeatmapBody>
          {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} />}
        </StatusHeatmapBody>
      </StatusHeatmap>,
    );
    const block = /<rect[^>]*data-slot="status-heatmap-block"[^>]*>/.exec(healthy)?.[0] ?? "";
    expect(block).toMatch(/class="[^"]*\bstroke-input stroke-1\b/);
    expect(block).not.toContain("stroke-dasharray");
  });
});
