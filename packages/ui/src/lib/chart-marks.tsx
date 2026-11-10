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

// A name starts 24px right of the plot, past its leader and colour square, in 11px Geist.
const NAME_START = 24;
const NAME_FONT = '500 11px "Geist Variable", "Geist Fallback", ui-sans-serif, sans-serif';
// Without a canvas to measure on (a test's DOM), a wide guess per character.
const NAME_WIDTH_GUESS = 7.5;
// Names whose lines end close together are spread to this many pixels apart.
const NAME_GAP = 14;

let measure: CanvasRenderingContext2D | null | undefined;

/** A name's width as the browser draws it, measured on a canvas; a wide guess where there is none. */
function nameWidth(name: string): number {
  if (measure === undefined) {
    measure = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  }
  if (!measure) return name.length * NAME_WIDTH_GUESS;
  measure.font = NAME_FONT;
  return measure.measureText(name).width;
}

/** The names the line ends carry: each named series, and one for the quiet ones. */
export function endNames<T>(series: ChartSeries<T>, othersLabel: string): string[] {
  const quiet = series.filter(({ color }) => color === QUIET).length;
  const names = series.filter(({ color }) => color !== QUIET).map(({ label }) => label);
  if (quiet > 0) names.push(othersName(quiet, othersLabel));
  return names;
}

/** Room the names need right of the plot: the widest name as drawn, after its leader and colour square. */
export function endLabelRoom(names: readonly string[]): number {
  return Math.ceil(NAME_START + Math.max(0, ...names.map(nameWidth)) + 8);
}

// Below this width (a phone) the names would take too much of the plot, so a legend goes under it instead.
const END_LABELS_MIN_WIDTH = 400;

/**
 * Whether the names fit at the line ends: a card at least 400px wide, names taking at most 30% of it, and a plot
 * tall enough to hold them all 14px apart. Otherwise the chart keeps its legend below.
 */
export function endLabelsFit(names: readonly string[], width: number, plotHeight: number): boolean {
  return (
    width >= END_LABELS_MIN_WIDTH &&
    endLabelRoom(names) <= width * 0.3 &&
    (names.length - 1) * NAME_GAP + 12 <= plotHeight
  );
}

/** A series' line end, in pixels, and the name it carries there. */
export interface LineEnd {
  name: string;
  color: string;
  x: number;
  y: number;
  /** One of the quiet series' shared name: muted, with no colour square. */
  quiet: boolean;
}

/** A name placed in the gutter right of the plot. */
export interface PlacedEnd extends LineEnd {
  /** The level it sits at, after names that would collide are spread apart. */
  at: number;
  /** The plot's right edge, where every name starts, whichever point its line ends on. */
  gutter: number;
  /** A leader joins the name to its line's end: moved off the end's level, or the line ends short of the edge. */
  leader: boolean;
}

/** The part of the chart the series are drawn in, as Recharts' usePlotArea gives it. */
export interface PlotBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where each name goes: the quiet series folded into one name at the middle one's level, then every name spread
 * to 14px apart, top to bottom, pushed back up from the plot's foot and never above its top. A point that maps to
 * no number (a scale being replaced) is left out.
 */
export function placeEnds(lines: readonly LineEnd[], plot: PlotBox, othersLabel: string): PlacedEnd[] {
  const finite = lines.filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));
  const quiet = finite.filter((end) => end.quiet).toSorted((a, b) => a.y - b.y);
  const gutter = plot.x + plot.width;
  const ends: PlacedEnd[] = [];
  for (const end of finite) if (!end.quiet) ends.push({ ...end, at: end.y, gutter, leader: false });
  const middle = quiet[Math.floor(quiet.length / 2)];
  if (middle) {
    ends.push({
      ...middle,
      name: othersName(quiet.length, othersLabel),
      color: QUIET,
      at: middle.y,
      gutter,
      leader: false,
    });
  }
  ends.sort((a, b) => a.y - b.y);
  let previous = -Infinity;
  for (const end of ends) {
    end.at = Math.max(end.y, previous + NAME_GAP);
    previous = end.at;
  }
  let limit = plot.y + plot.height;
  for (const end of ends.toReversed()) {
    end.at = Math.min(end.at, limit);
    limit = end.at - NAME_GAP;
  }
  for (const end of ends) {
    // A short plot cannot hold every name 14px apart (the frame shows a legend then); none goes above it.
    end.at = Math.max(end.at, plot.y + 4);
    end.leader = Math.abs(end.at - end.y) > 3 || end.x < gutter - 1;
  }
  return ends;
}

interface EndLabelsProps<T extends object, K extends keyof T> {
  data: readonly T[];
  xKey: K;
  series: ChartSeries<T>;
  othersLabel: string;
}

/**
 * Each series' name in the gutter right of the plot, in the text colour beside a square of the line's colour, in
 * place of a legend the reader has to match colours against. A leader joins each name to its line's end where the
 * name was moved off the end's level or the line ends short of the plot's edge. Quiet (muted) series share one
 * muted name, such as "6 other funds".
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
  const lines: LineEnd[] = [];
  for (const { key, label, color } of series) {
    const row = data.findLast((candidate) => Number.isFinite(candidate[key as keyof T]));
    const x = row && xScale(row[xKey]);
    const y = row && yScale(row[key as keyof T]);
    if (x !== undefined && y !== undefined) lines.push({ name: label, color, x, y, quiet: color === QUIET });
  }
  return (
    <g data-slot="end-labels">
      {placeEnds(lines, plot, othersLabel).map(({ gutter, ...end }) => (
        <g key={end.name}>
          {end.leader && (
            <polyline
              points={`${end.x + 4},${end.y} ${Math.max(end.x + 4, gutter) + 6},${end.at}`}
              fill="none"
              stroke={end.color}
              strokeOpacity={0.55}
            />
          )}
          {!end.quiet && <rect x={gutter + 13} y={end.at - 3.5} width={7} height={7} fill={end.color} />}
          <text
            x={gutter + (end.quiet ? 13 : NAME_START)}
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

// A label over the hatched band sits on a card-coloured halo, so its stripes never run under the letters.
const MARK_LABEL = "stroke-card font-mono text-2xs uppercase";
const HALO = { paintOrder: "stroke", strokeWidth: 3, strokeLinejoin: "round" } as const;

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
            className={`${MARK_LABEL} fill-muted-foreground`}
            style={HALO}
          >
            Forecast
          </text>
        </>
      )}
      {now !== undefined && (
        <>
          <line x1={now} x2={now} y1={top} y2={bottom} stroke="var(--link)" />
          <text x={now - 5} y={top + 12} textAnchor="end" className={`${MARK_LABEL} fill-link`} style={HALO}>
            Today
          </text>
        </>
      )}
    </g>
  );
}
