import { useEffect, useRef } from "react";
import { AreaSeries, ColorType, createChart, LineStyle, type LineData, type Rgba, type Time } from "lightweight-charts";

export interface PriceChartProps {
  data: LineData<Time>[];
  /** Fixed height in pixels. */
  height: number;
  /** TradingView's licence asks for a credit on the page; turn it off on the second chart. */
  credit?: boolean;
}

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

/** A TradingView Lightweight Charts price chart in the theme's colours, redrawn when the scheme changes. */
export function PriceChart({ data, height, credit = true }: PriceChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const chart = createChart(element, {
      autoSize: true,
      layout: {
        attributionLogo: credit,
        colorParsers: [toRgba],
        background: { type: ColorType.Solid, color: "transparent" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const series = chart.addSeries(AreaSeries, { priceLineVisible: false });
    series.setData(data);
    chart.timeScale().fitContent();
    const paint = () => {
      const style = getComputedStyle(element);
      const token = (name: string) => style.getPropertyValue(name).trim();
      const line = token("--chart-1");
      chart.applyOptions({
        layout: {
          textColor: token("--muted-foreground"),
          fontFamily: style.fontFamily,
          fontSize: parseFloat(style.fontSize),
        },
        grid: { vertLines: { visible: false }, horzLines: { color: token("--border"), style: LineStyle.Dashed } },
      });
      series.applyOptions({
        lineColor: line,
        topColor: `color-mix(in oklch, ${line} 30%, transparent)`,
        bottomColor: "transparent",
      });
    };
    paint();
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", paint);
    return () => {
      scheme.removeEventListener("change", paint);
      chart.remove();
    };
  }, [data, credit]);
  return <div ref={ref} data-slot="price-chart" className="w-full font-mono text-xs" style={{ height }} />;
}
