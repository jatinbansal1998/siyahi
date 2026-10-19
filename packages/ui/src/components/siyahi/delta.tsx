import { cn } from "cn";
import { useFormat } from "@siyahi/ui/lib/format";

export interface DeltaProps {
  /** The signed change. For `pct`, a fraction: 0.025 is 2.5%. */
  value: number;
  format?: "pct" | "money";
  className?: string;
}

/** A signed figure: ▲ in --positive, ▼ in --negative, so colour is never the only cue. */
export function Delta({ value, format = "pct", className }: DeltaProps) {
  const f = useFormat();
  const size = format === "money" ? f.money(Math.abs(value)) : f.pct(Math.abs(value));
  const direction = value > 0 ? "up" : value < 0 ? "down" : null;
  return (
    <span
      data-slot="delta"
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        direction === "up" && "text-positive",
        direction === "down" && "text-negative",
        direction === null && "text-muted-foreground",
        className,
      )}
    >
      {direction && <span aria-hidden="true">{direction === "up" ? "▲" : "▼"}</span>}
      {direction && <span className="sr-only">{direction}</span>}
      {size}
    </span>
  );
}
