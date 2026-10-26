import type { ReactNode } from "react";
import { cn } from "cn";

export interface DataBarProps {
  value: number;
  /** The value a full bar stands for, usually the column's largest: Math.max(...rows.map((row) => row.value)). */
  max: number;
  /** "sign" draws a gain in --positive and a loss in --negative; by default every bar is --chart-1. */
  tone?: "chart" | "sign";
  /** The figure, as the page formats it. */
  children: ReactNode;
  className?: string;
}

/**
 * A table cell's figure behind a short bar whose length is the figure's share of max, so a column reads as a chart.
 * The bar has a fixed width, so every row draws to the same scale, and sits on the figure's line, so the row
 * keeps its height.
 */
export function DataBar({ value, max, tone = "chart", children, className }: DataBarProps) {
  const share = max > 0 ? Math.min(1, Math.abs(value) / max) : 0;
  const fill = tone === "chart" ? "bg-chart-1" : value < 0 ? "bg-negative" : "bg-positive";
  return (
    <div data-slot="data-bar" className={cn("flex items-center gap-2", className)}>
      <div aria-hidden="true" className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${share * 100}%` }} />
      </div>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}
