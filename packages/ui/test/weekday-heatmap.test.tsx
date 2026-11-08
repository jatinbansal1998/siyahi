// @vitest-environment happy-dom
import {
  WeekdayHeatmap,
  WeekdayHeatmapBlock,
  WeekdayHeatmapBody,
} from "../src/components/registry/heatmap/weekday-heatmap";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vite-plus/test";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("omits custom blocks outside the displayed hours and weekdays", () => {
  const html = renderToStaticMarkup(
    <WeekdayHeatmap data={[{ weekday: 1, hour: 9, value: 1 }]} hours={[9, 10]} weekdays={[1]}>
      <svg>
        <WeekdayHeatmapBlock activity={{ weekday: 1, hour: 8, value: 1, level: 1 }} />
        <WeekdayHeatmapBlock activity={{ weekday: 0, hour: 9, value: 1, level: 1 }} />
        <WeekdayHeatmapBlock activity={{ weekday: 1, hour: 9, value: 1, level: 1 }} />
      </svg>
    </WeekdayHeatmap>,
  );
  expect(html.match(/data-slot="weekday-heatmap-block"/g)).toHaveLength(1);
  expect(html).toContain('data-hour="9"');
  expect(html).toContain('data-weekday="1"');
});

it("shows the requested market hours and weekdays without relabelling their values", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <WeekdayHeatmap data={[{ weekday: 1, hour: 9, value: 12 }]} hours={[9, 10, 11]} weekdays={[1, 2]}>
          <WeekdayHeatmapBody>{({ activity }) => <WeekdayHeatmapBlock activity={activity} />}</WeekdayHeatmapBody>
        </WeekdayHeatmap>,
      ),
    );
    const cells = [...host.querySelectorAll('[data-slot="weekday-heatmap-block"]')];
    expect(cells).toHaveLength(6);
    expect(cells.map((cell) => cell.getAttribute("data-hour"))).toEqual(["9", "10", "11", "9", "10", "11"]);
    expect(cells[0]?.getAttribute("data-value")).toBe("12");
    expect(cells[0]?.getAttribute("aria-label")).toBe("Mon 09:00: 12");
    expect(cells[0]?.getAttribute("x")).toBe(cells[3]?.getAttribute("x"));
    expect(Number(cells[1]?.getAttribute("x"))).toBeGreaterThan(Number(cells[0]?.getAttribute("x")));
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
