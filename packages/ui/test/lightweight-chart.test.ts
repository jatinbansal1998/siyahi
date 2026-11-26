import { TickMarkType, type UTCTimestamp } from "lightweight-charts";
import { describe, expect, it } from "vite-plus/test";
import { timeLabels } from "../src/lib/lightweight-chart";
import { defaultLocale } from "../src/lib/locale";

describe("timeLabels", () => {
  // 03:45 UTC on 26 November 2026 is 09:15 in India, when the exchange opens.
  const open = (Date.UTC(2026, 10, 26, 3, 45) / 1000) as UTCTimestamp;

  it("writes a moment in the locale's zone, on the axis and at the crosshair", () => {
    const labels = timeLabels(defaultLocale, true);
    expect(labels.tick(open, TickMarkType.Time)).toBe("09:15");
    expect(labels.crosshair(open)).toBe("26 Nov 2026, 09:15");
    expect(timeLabels({ ...defaultLocale, timeZone: "UTC" }, true).tick(open, TickMarkType.Time)).toBe("03:45");
  });

  it("writes a day as its own date, whatever the zone", () => {
    const labels = timeLabels({ ...defaultLocale, timeZone: "America/Los_Angeles" }, false);
    expect(labels.crosshair("2026-11-02")).toBe("2 Nov 2026");
    expect(labels.tick("2026-11-02", TickMarkType.DayOfMonth)).toBe("2");
    expect(labels.tick("2026-11-02", TickMarkType.Month)).toBe("Nov");
  });
});
