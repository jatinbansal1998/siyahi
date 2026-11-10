import { usePlotArea, useXAxisScale, useYAxisScale } from "recharts";
import type { ChartSeries } from "@siyahi/ui/lib/chart-series";

/** The colour a series takes when it is one of many drawn quietly behind the few a page names in colour. */
export const QUIET = "var(--muted-foreground)";

/** Quiet series first, so the named ones draw over them; otherwise the page's order. */
export function drawOrder<T>(series: ChartSeries<T>): ChartSeries<T> {
  return [...series.filter(({ color }) => color === QUIET), ...series.filter(({ color }) => color !== QUIET)];
}

/** The quiet series' one shared name: "6 other funds". */
export function othersName(count: number, othersLabel: string): string {
  return `${count} ${othersLabel}`;
}

// A name is 11px Geist, about 6.1px a character; it starts 24px after its line's end, past the leader and the square.
const NAME_START = 24;
const NAME_WIDTH = 6.1;
// Names whose lines end close together are spread to this many pixels apart.
const NAME_GAP = 14;

/** Room the names need right of the plot: the longest name, after its leader and colour square. */
export function endLabelRoom<T>(series: ChartSeries<T>, othersLabel: string): number {
  const quiet = series.filter(({ color }) => color === QUIET).length;
  const names = series.filter(({ color }) => color !== QUIET).map(({ label }) => label);
  if (quiet > 0) names.push(othersName(quiet, othersLabel));
  return Math.ceil(NAME_START + Math.max(0, ...names.map((name) => name.length * NAME_WIDTH)) + 8);
}

interface End {
  name: string;
  color: string;
  x: number;
  y: number;
  quiet: boolean;
  /** Where the name sits, after names that would collide are spread apart. */
  at: number;
}

interface EndLabelsProps<T extends object, K extends keyof T> {
  data: readonly T[];
  xKey: K;
  series: ChartSeries<T>;
  othersLabel: string;
}

/**
 * Each series' name at its line's end, in the text colour beside a square of the line's colour, in place of a legend
 * the reader has to match colours against. Where ends crowd, names are spread to 14px apart and a short leader joins
 * each to its line. Quiet (muted) series share one muted name, such as "6 other funds".
 */
export function EndLabels<T extends object, K extends keyof T>({
  data,
  xKey,
  series,
  othersLabel,
}: EndLabelsProps<T, K>) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const ends: End[] = [];
  const quiet: End[] = [];
  for (const { key, label, color } of series) {
    const row = data.findLast((candidate) => Number.isFinite(candidate[key as keyof T]));
    if (!row) continue;
    const x = xScale(row[xKey]);
    const y = yScale(row[key as keyof T]);
    if (x === undefined || y === undefined) continue;
    const end = { name: label, color, x, y, quiet: color === QUIET, at: y };
    (end.quiet ? quiet : ends).push(end);
  }
  if (quiet.length > 0) {
    quiet.sort((a, b) => a.y - b.y);
    const middle = quiet[Math.floor(quiet.length / 2)] as End;
    ends.push({ ...middle, name: othersName(quiet.length, othersLabel), color: QUIET, at: middle.y });
  }
  ends.sort((a, b) => a.y - b.y);
  let previous = -Infinity;
  for (const end of ends) {
    end.at = Math.max(end.y, previous + NAME_GAP);
    previous = end.at;
  }
  // A spread that ran past the plot's foot is pushed back up, keeping the gaps.
  let limit = plot.y + plot.height;
  for (const end of ends.toReversed()) {
    end.at = Math.min(end.at, limit);
    limit = end.at - NAME_GAP;
  }
  return (
    <g data-slot="end-labels">
      {ends.map((end) => (
        <g key={end.name}>
          {Math.abs(end.at - end.y) > 3 && (
            <polyline
              points={`${end.x + 4},${end.y} ${end.x + 10},${end.at}`}
              fill="none"
              stroke={end.color}
              strokeOpacity={0.55}
            />
          )}
          {!end.quiet && <rect x={end.x + 13} y={end.at - 3.5} width={7} height={7} fill={end.color} />}
          <text
            x={end.x + (end.quiet ? 13 : NAME_START)}
            y={end.at + 4}
            className={end.quiet ? "fill-muted-foreground text-2xs" : "fill-foreground text-2xs font-medium"}
          >
            {end.name}
          </text>
        </g>
      ))}
    </g>
  );
}

interface TimeMarksProps<T extends object, K extends keyof T> {
  data: readonly T[];
  xKey: K;
  /** The x value from which the data is a forecast. */
  forecastFrom?: T[K];
  /** The x value of today. */
  today?: T[K];
  /** Prefix of the clip paths the series' actual and forecast copies use (`<id>-actual`, `<id>-forecast`). */
  clipId: string;
}

/**
 * A forecast stretch, from forecastFrom to the last point: a faint hatched band labelled FORECAST behind the lines,
 * and the clip paths that keep each line solid before it and dashed after. And a "today" rule: 1px in the link
 * colour with a small mono capital label.
 */
export function TimeMarks<T extends object, K extends keyof T>({
  data,
  xKey,
  forecastFrom,
  today,
  clipId,
}: TimeMarksProps<T, K>) {
  const xScale = useXAxisScale();
  const plot = usePlotArea();
  if (!xScale || !plot) return null;
  const top = plot.y;
  const bottom = plot.y + plot.height;
  const cut = forecastFrom === undefined ? undefined : xScale(forecastFrom);
  const last = data.at(-1);
  const end = (last && xScale(last[xKey])) ?? plot.x + plot.width;
  const now = today === undefined ? undefined : xScale(today);
  return (
    <g data-slot="time-marks">
      {cut !== undefined && (
        <>
          <defs>
            <clipPath id={`${clipId}-actual`}>
              <rect x={-1e4} y={-1e4} width={cut + 1e4} height={2e4} />
            </clipPath>
            <clipPath id={`${clipId}-forecast`}>
              <rect x={cut} y={-1e4} width={2e4} height={2e4} />
            </clipPath>
            <pattern
              id={`${clipId}-hatch`}
              width={7}
              height={7}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1={0} y1={0} x2={0} y2={7} stroke="var(--foreground)" strokeOpacity={0.16} />
            </pattern>
          </defs>
          <rect x={cut} y={top} width={Math.max(0, end - cut)} height={plot.height} fill={`url(#${clipId}-hatch)`} />
          <text
            x={end - 4}
            y={top + 12}
            textAnchor="end"
            className="fill-muted-foreground font-mono text-2xs uppercase"
          >
            Forecast
          </text>
        </>
      )}
      {now !== undefined && (
        <>
          <line x1={now} x2={now} y1={top} y2={bottom} stroke="var(--link)" />
          <text x={now - 5} y={top + 12} textAnchor="end" className="fill-link font-mono text-2xs uppercase">
            Today
          </text>
        </>
      )}
    </g>
  );
}
