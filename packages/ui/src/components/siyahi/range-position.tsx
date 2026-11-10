import type { ReactNode } from "react";
import { cn } from "cn";
import { useFormat } from "@siyahi/ui/lib/format";

export interface RangePositionProps {
  low: number;
  high: number;
  value: number;
  /** Names the low end: "52-week low". */
  lowLabel?: string;
  highLabel?: string;
  /** Follows the percentage in the full variant: "of the way up the 52-week range". */
  caption?: ReactNode;
  /** Writes low, high and value; useFormat().money by default. */
  valueFormatter?: (value: number) => string;
  /** compact fits a table cell: the ends' figures either side of the track, nothing above it. */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * How far a value sits between a low and a high, such as a price in its 52-week range: a track filled to the value
 * with a hollow thumb on it, the ends labelled, and in the full variant the share written large with the value over
 * the thumb.
 */
export function RangePosition({
  low,
  high,
  value,
  lowLabel = "Low",
  highLabel = "High",
  caption = "of the way up the range",
  valueFormatter,
  variant = "full",
  className,
}: RangePositionProps) {
  const f = useFormat();
  const write = valueFormatter ?? f.money;
  const share = high > low ? Math.min(1, Math.max(0, (value - low) / (high - low))) : 0;
  const at = `${(share * 100).toFixed(2)}%`;
  const track = (
    <div
      role="meter"
      aria-label={`${lowLabel} to ${highLabel}`}
      aria-valuemin={low}
      aria-valuemax={high}
      aria-valuenow={value}
      aria-valuetext={`${write(value)}, ${f.pct(share, 0)} of the way from ${write(low)} to ${write(high)}`}
      className="relative h-1.5 min-w-12 flex-1 bg-muted"
    >
      <div data-slot="range-fill" className="absolute inset-y-0 left-0 bg-foreground" style={{ width: at }} />
      <div
        data-slot="range-thumb"
        className={cn(
          "absolute top-1/2 -translate-1/2 rounded-full border-2 border-foreground bg-card",
          variant === "full" ? "size-3.5" : "size-2.5",
        )}
        style={{ left: at }}
      />
    </div>
  );

  if (variant === "compact") {
    return (
      <div
        data-slot="range-position"
        className={cn("flex items-center gap-2 text-xs text-muted-foreground tabular-nums", className)}
      >
        <span className="min-w-12 text-right">{write(low)}</span>
        {track}
        <span className="min-w-12">{write(high)}</span>
      </div>
    );
  }

  return (
    <div data-slot="range-position" className={cn("grid gap-3", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">{f.pct(share, 0)}</span>
        <span className="text-sm text-muted-foreground">{caption}</span>
      </p>
      <div className="grid gap-1.5">
        {/* Shifting the label by its own share keeps it inside the track: left-aligned at the low, right-aligned at the high. */}
        <div className="relative h-5">
          <span
            data-slot="range-value"
            className="absolute text-sm font-semibold whitespace-nowrap tabular-nums"
            style={{ left: at, transform: `translateX(-${at})` }}
          >
            {write(value)}
          </span>
        </div>
        <div className="flex">{track}</div>
        <div className="mt-1 flex justify-between gap-4 text-xs text-muted-foreground">
          <span>
            {lowLabel} <span className="text-foreground tabular-nums">{write(low)}</span>
          </span>
          <span className="text-right">
            {highLabel} <span className="text-foreground tabular-nums">{write(high)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
