import { cn } from "cn";
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useFormat } from "@siyahi/ui/lib/format";

export interface DeltaProps {
  /** The signed change. For `pct`, a fraction: 0.025 is 2.5%. */
  value: number;
  format?: "pct" | "money";
  className?: string;
}

const MINUS = "−";

/**
 * A signed change: the figure in the surrounding text colour with its sign, and a trend icon in --positive or
 * --negative. The sign and the icon's shape carry the direction, so colour is never the only cue, and a column of
 * changes reads as figures rather than a wall of red and green.
 */
export function Delta({ value, format = "pct", className }: DeltaProps) {
  const f = useFormat();
  const size = format === "money" ? f.money(Math.abs(value)) : f.pct(Math.abs(value));
  const direction = value > 0 ? "up" : value < 0 ? "down" : "none";
  const Icon = direction === "up" ? TrendingUpIcon : direction === "down" ? TrendingDownIcon : MinusIcon;
  return (
    <span
      data-slot="delta"
      data-direction={direction}
      // Baseline, so the figure sits on the line with the text around it; centred,
      // the icon's bottom edge would become the line's baseline and lift the row.
      className={cn("inline-flex items-baseline gap-1 whitespace-nowrap", className)}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 self-center",
          direction === "up" && "text-positive",
          direction === "down" && "text-negative",
          direction === "none" && "text-muted-foreground",
        )}
      />
      {direction === "up" ? "+" : direction === "down" ? MINUS : ""}
      {size}
    </span>
  );
}
