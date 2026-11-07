import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import {
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
} from "../src/components/registry/heatmap/status-heatmap";

describe("StatusHeatmap", () => {
  it("outlines a highlighted day and keeps its full colour", () => {
    const html = renderToStaticMarkup(
      <StatusHeatmap data={[{ date: "2026-10-01", value: 2 }]}>
        <StatusHeatmapBody>
          {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} highlighted />}
        </StatusHeatmapBody>
      </StatusHeatmap>,
    );
    const block = /<rect[^>]*data-slot="status-heatmap-block"[^>]*>/.exec(html)?.[0] ?? "";
    expect(block).toMatch(/class="[^"]*\bstroke-foreground stroke-1\b/);
    expect(block).toContain('style="fill:var(--warning)"');
  });
});
