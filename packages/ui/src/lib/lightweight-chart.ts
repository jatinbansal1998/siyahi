import { ColorType, createChart, LineStyle, type IChartApi, type Rgba } from "lightweight-charts";

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

/**
 * A Lightweight Charts chart in `element`, in the theme's colours. `build` adds the series and returns how to colour
 * them; that runs now and again whenever the scheme changes, from the device or a host's data-theme. Returns the
 * cleanup, which removes the chart.
 */
export function createThemedChart(
  element: HTMLElement,
  credit: boolean,
  build: (chart: IChartApi) => (color: ThemeColor) => void,
): () => void {
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
    timeScale: { borderVisible: false },
  });
  const paintSeries = build(chart);
  const paint = () => {
    const style = getComputedStyle(element);
    const color: ThemeColor = (token) => style.getPropertyValue(token.replace(/^var\((.+)\)$/, "$1")).trim();
    const border = color("--border");
    chart.applyOptions({
      layout: {
        textColor: color("--muted-foreground"),
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        panes: { separatorColor: border, separatorHoverColor: border },
      },
      // Gridlines are solid hairlines (DESIGN.md), so a dashed level reads apart from them.
      grid: { vertLines: { visible: false }, horzLines: { color: border, style: LineStyle.Solid } },
    });
    paintSeries(color);
  };
  paint();
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", paint);
  const themeAttribute = new MutationObserver(paint);
  themeAttribute.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => {
    scheme.removeEventListener("change", paint);
    themeAttribute.disconnect();
    chart.remove();
  };
}
