import type { ReactNode } from "react";
import { cn } from "cn";
import { useFormat } from "@siyahi/ui/lib/format";

/** Where a row stands against its target. A warning is for a real problem, not merely a miss. */
export interface TargetStatus {
  kind: "met" | "missed" | "warning";
  /** A few words: "On target", "2.1 pts under", "Rebalance". */
  label: string;
}

export interface TargetRow {
  label: ReactNode;
  /** A muted line under the label, such as the asset class. */
  detail?: ReactNode;
  value: number;
  target: number;
  /** Qualitative ranges behind the bar as [from, to]; each later band draws a grey step darker, so nest them. */
  bands?: [number, number][] | undefined;
  status?: TargetStatus | undefined;
  /** Tells rows apart when labels are not plain unique text. */
  key?: string | undefined;
}

export interface TargetRowsProps {
  rows: TargetRow[];
  /** The scale every row shares; by default 0 to the largest value, target or band edge. */
  domain?: [number, number] | undefined;
  /** Writes the value and the target; useFormat().count by default. */
  valueFormatter?: ((value: number) => string) | undefined;
  className?: string | undefined;
}

const GLYPH = { met: "✓", missed: "—", warning: "⚠" } as const;
// Neutral steps from the track's grey toward the text colour: a band's meaning is its depth, never a hue.
const BAND_DEPTH = [14, 26, 38];

/**
 * Bullet rows: each row's label, value and status beside a track where the value is a solid bar, the target a tall
 * tick and the qualitative ranges grey bands. On a narrow card the label and value stack above the track.
 */
export function TargetRows({ rows, domain, valueFormatter, className }: TargetRowsProps) {
  const f = useFormat();
  const write = valueFormatter ?? f.count;
  const [low, high] = domain ?? [
    0,
    Math.max(...rows.flatMap((row) => [row.value, row.target, ...(row.bands?.flat() ?? [])])),
  ];
  const at = (value: number) => `${(Math.min(1, Math.max(0, (value - low) / (high - low || 1))) * 100).toFixed(2)}%`;
  return (
    <ul data-slot="target-rows" className={cn("@container/target divide-y", className)}>
      {rows.map((row, index) => (
        <li
          key={row.key ?? (typeof row.label === "string" ? row.label : index)}
          data-slot="target-row"
          className="flex flex-col gap-3 py-3 @lg/target:flex-row @lg/target:items-center @lg/target:gap-6"
        >
          <div className="flex min-w-0 flex-col text-sm @lg/target:w-64 @lg/target:shrink-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{row.label}</span>
              <span className="shrink-0 text-base font-semibold tabular-nums">{write(row.value)}</span>
            </div>
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>{row.detail}</span>
              <span className="shrink-0 tabular-nums">Target {write(row.target)}</span>
            </div>
            {row.status && (
              <span data-slot="target-status" data-kind={row.status.kind} className="mt-1 flex gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-4 text-center",
                    row.status.kind === "warning" && "text-warning",
                    row.status.kind === "missed" && "text-muted-foreground",
                  )}
                >
                  {GLYPH[row.status.kind]}
                </span>
                {row.status.label}
              </span>
            )}
          </div>
          <div aria-hidden="true" className="relative h-5 rounded-sm bg-muted @lg/target:flex-1">
            {row.bands?.map(([from, to], step) => (
              <div
                key={`${from}:${to}`}
                data-slot="target-band"
                className="absolute inset-y-0"
                style={{
                  left: at(Math.min(from, to)),
                  right: `calc(100% - ${at(Math.max(from, to))})`,
                  background: `color-mix(in oklab, var(--foreground) ${BAND_DEPTH[Math.min(step, BAND_DEPTH.length - 1)]}%, var(--muted))`,
                }}
              />
            ))}
            <div
              data-slot="target-value"
              className="absolute inset-y-1.5 left-0 bg-foreground"
              style={{ width: at(row.value) }}
            />
            <div
              data-slot="target-tick"
              className="absolute -inset-y-1 w-0.5 -translate-x-1/2 bg-foreground ring-1 ring-card"
              style={{ left: at(row.target) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
