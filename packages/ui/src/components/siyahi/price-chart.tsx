import { useEffect, useRef } from "react";
import { AreaSeries, type LineData, type Time } from "lightweight-charts";
import { createThemedChart } from "@siyahi/ui/lib/lightweight-chart";

export interface PriceChartProps {
  data: LineData<Time>[];
  /** Fixed height in pixels. */
  height: number;
  /** TradingView's licence asks for a credit on the page; turn it off on the second chart. */
  credit?: boolean | undefined;
}

/** A TradingView Lightweight Charts price chart in the theme's colours, redrawn when the scheme changes. */
export function PriceChart({ data, height, credit = true }: PriceChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return createThemedChart(element, credit, (chart) => {
      const series = chart.addSeries(AreaSeries, { priceLineVisible: false });
      series.setData(data);
      chart.timeScale().fitContent();
      return (color) => {
        const line = color("--chart-1");
        series.applyOptions({
          lineColor: line,
          topColor: `color-mix(in oklch, ${line} 30%, transparent)`,
          bottomColor: "transparent",
        });
      };
    });
  }, [data, credit]);
  return <div ref={ref} data-slot="price-chart" className="w-full font-mono text-xs" style={{ height }} />;
}
