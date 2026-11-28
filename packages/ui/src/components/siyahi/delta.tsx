import { cn } from "cn";
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { signOf, signed, useFormat } from "@siyahi/ui/lib/format";

export interface DeltaProps {
  /** The signed change. For `pct`, a fraction: 0.025 is 2.5%. */
  value: number;
  format?: "pct" | "money" | undefined;
  /** Whether a rise is good news, the default, or bad, as for costs, debt or a fear gauge: "bad" swaps the colours. */
  rise?: "good" | "bad" | undefined;
  className?: string | undefined;
}

/**
 * A signed change: the figure in the surrounding text colour with its sign, and a trend icon in --positive or
 * --negative for good or bad news. The sign and the icon's shape carry the direction, so colour is never the only cue, and a column of
 * changes reads as figures rather than a wall of red and green.
 */
export function Delta({ value, format = "pct", rise = "good", className }: DeltaProps) {
  const f = useFormat();
  const write = format === "money" ? f.money : f.pct;
  const sign = signOf(value, write);
  const direction = sign > 0 ? "up" : sign < 0 ? "down" : "none";
  const Icon = direction === "up" ? TrendingUpIcon : direction === "down" ? TrendingDownIcon : MinusIcon;
  const good = rise === "good" ? "up" : "down";
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
          direction === "none" ? "text-muted-foreground" : direction === good ? "text-positive" : "text-negative",
        )}
      />
      {signed(value, write)}
    </span>
  );
}
