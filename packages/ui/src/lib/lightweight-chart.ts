import {
  ColorType,
  createChart,
  isBusinessDay,
  LineStyle,
  TickMarkType,
  type IChartApi,
  type Rgba,
  type Time,
} from "lightweight-charts";
import type { SiyahiLocale } from "@siyahi/ui/lib/locale";

/** A theme colour as the chart's element resolves it now, by token name or as a series names it: "var(--chart-1)". */
export type ThemeColor = (token: string) => string;

// Lightweight Charts parses colours through getComputedStyle, which keeps
// oklch() as oklch(); a 1px canvas turns any CSS colour into bytes.
function toRgba(color: string): Rgba | null {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255] as Rgba;
}

export interface ThemedChart {
  chart: IChartApi;
  /** Reads the theme and colours the chart and its series; call it after adding or changing series. */
  paint: () => void;
  remove: () => void;
}

/**
 * A Lightweight Charts chart in `element`, in the theme's colours. `paintSeries` colours the caller's series; it
 * runs on every `paint` and whenever the scheme changes, from the device or a host's data-theme.
 */
export function createThemedChart(
  element: HTMLElement,
  credit: boolean,
  paintSeries: (color: ThemeColor) => void,
): ThemedChart {
  const chart = createChart(element, {
    autoSize: true,
    layout: {
      attributionLogo: credit,
      colorParsers: [toRgba],
      background: { type: ColorType.Solid, color: "transparent" },
      panes: { enableResize: false },
    },
    // A tick at a pane's edge would be cut in half by the pane above or below.
    rightPriceScale: { borderVisible: false, entireTextOnly: true },
    // A card that resizes keeps the dates it showed, rather than the same bar width over other dates.
    timeScale: { borderVisible: false, lockVisibleTimeRangeOnResize: true },
    // A vertical swipe scrolls the page; a sideways one pans the chart.
    handleScroll: { vertTouchDrag: false },
    handleScale: { mouseWheel: false },
  });
  // The wheel scrolls the page past a chart until the reader clicks into it; then it zooms, until the pointer leaves.
  const wheelZooms = (mouseWheel: boolean) => () => chart.applyOptions({ handleScale: { mouseWheel } });
  const wheelOn = wheelZooms(true);
  const wheelOff = wheelZooms(false);
  element.addEventListener("pointerdown", wheelOn);
  element.addEventListener("pointerleave", wheelOff);
  const paint = () => {
    const style = getComputedStyle(element);
    const color: ThemeColor = (token) => style.getPropertyValue(token.replace(/^var\((.+)\)$/, "$1")).trim();
    const border = color("--border");
    const muted = color("--muted-foreground");
    const crosshairLine = { color: muted, labelBackgroundColor: color("--foreground") };
    chart.applyOptions({
      layout: {
        textColor: muted,
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        panes: { separatorColor: border, separatorHoverColor: border },
      },
      // Gridlines are solid hairlines (DESIGN.md), so a dashed level reads apart from them.
      grid: { vertLines: { visible: false }, horzLines: { color: border, style: LineStyle.Solid } },
      crosshair: { vertLine: crosshairLine, horzLine: crosshairLine },
    });
    paintSeries(color);
  };
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", paint);
  // A canvas keeps the fallback face it was drawn in; the page's own may load after the chart's first draw.
  let removed = false;
  void document.fonts.ready.then(() => removed || paint());
  const themeAttribute = new MutationObserver(paint);
  themeAttribute.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return {
    chart,
    paint,
    remove: () => {
      removed = true;
      element.removeEventListener("pointerdown", wheelOn);
      element.removeEventListener("pointerleave", wheelOff);
      scheme.removeEventListener("change", paint);
      themeAttribute.disconnect();
      chart.remove();
    },
  };
}

/** A chart time as seconds since 1970: a day ("2026-11-02", or the library's { year, month, day }) at its UTC midnight. */
export function timeSeconds(time: Time): number {
  if (typeof time === "number") return time;
  if (isBusinessDay(time)) return Date.UTC(time.year, time.month - 1, time.day) / 1000;
  return Date.parse(time) / 1000;
}

/**
 * How the time axis and the crosshair write a time. Days are written as dates; times given in seconds are moments,
 * written with their hour and minute in the locale's zone, as the library itself only knows UTC.
 */
export function timeLabels(locale: SiyahiLocale, intraday: boolean) {
  const timeZone = intraday ? locale.timeZone : "UTC";
  const format = (options: Intl.DateTimeFormatOptions) => {
    const formatter = new Intl.DateTimeFormat(locale.numberLocale, { ...options, timeZone, hourCycle: "h23" });
    return (time: Time) => formatter.format(timeSeconds(time) * 1000);
  };
  const day: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const clock: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const ticks = {
    [TickMarkType.Year]: format({ year: "numeric" }),
    [TickMarkType.Month]: format({ month: "short" }),
    [TickMarkType.DayOfMonth]: format({ day: "numeric" }),
    [TickMarkType.Time]: format(clock),
    [TickMarkType.TimeWithSeconds]: format({ ...clock, second: "2-digit" }),
  };
  return {
    crosshair: format(intraday ? { ...day, ...clock } : day),
    tick: (time: Time, type: TickMarkType) => ticks[type](time),
  };
}
