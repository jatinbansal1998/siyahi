import type { AxisScale } from "@siyahi/ui/lib/ticks";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelCandidate {
  key: string;
  text: string;
  /** The dot's centre, in pixels. */
  cx: number;
  cy: number;
  /** The dot's radius, its edge included: a sized dot keeps names off all of itself. */
  r: number;
}

export interface PlacedLabel {
  key: string;
  text: string;
  /** Where the text starts and its baseline, with textAnchor="start". */
  x: number;
  y: number;
}

/** How labels are set: their type size in pixels and a name's width in that type. */
export interface LabelType {
  size: number;
  measure: (text: string) => number;
}

// Chromium lays a line of Geist in a box 4/3 of its size, from the size above the baseline to a third of it below.
// A label's box is that line, a little wider than its text for the halo around it.
const HALO = 2;
const GAP = 4;

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Names beside dots, in the candidates' order, up to `limit`: each tries the right of its dot, then the left, above,
 * below and the four corners, and takes the first spot inside the plot that covers no other label, no other dot and
 * nothing `reserved` (such as a quadrant's name). A name that finds no spot is left to the tooltip, so labels never sit
 * on top of each other.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  plot: Box,
  limit: number,
  { size, measure }: LabelType,
  reserved: readonly Box[] = [],
): PlacedLabel[] {
  const line = (size * 4) / 3;
  const dots = candidates.map(({ key, cx, cy, r }) => ({
    key,
    box: { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
  }));
  const taken: Box[] = [...reserved];
  const placed: PlacedLabel[] = [];
  for (const { key, text, cx, cy, r: radius } of candidates) {
    if (placed.length >= limit) break;
    const width = measure(text) + HALO * 2;
    const spots: Box[] = [
      { x: cx + radius + GAP, y: cy - line / 2, width, height: line },
      { x: cx - radius - GAP - width, y: cy - line / 2, width, height: line },
      { x: cx - width / 2, y: cy - radius - GAP - line, width, height: line },
      { x: cx - width / 2, y: cy + radius + GAP, width, height: line },
      { x: cx + radius, y: cy - radius - line, width, height: line },
      { x: cx - radius - width, y: cy - radius - line, width, height: line },
      { x: cx + radius, y: cy + radius, width, height: line },
      { x: cx - radius - width, y: cy + radius, width, height: line },
    ];
    const spot = spots.find(
      (box) =>
        box.x >= plot.x &&
        box.y >= plot.y &&
        box.x + box.width <= plot.x + plot.width &&
        box.y + box.height <= plot.y + plot.height &&
        !taken.some((other) => overlaps(box, other)) &&
        !dots.some((dot) => dot.key !== key && overlaps(box, dot.box)),
    );
    if (!spot) continue;
    taken.push(spot);
    placed.push({ key, text, x: spot.x + HALO, y: spot.y + size });
  }
  return placed;
}

/**
 * Splits the plot into four at a value on each axis, such as zero, with an optional name in each corner. On a log
 * axis that value must be above zero, or no split is drawn. A name that does not fit its quadrant in two lines is left out.
 */
export interface ScatterQuadrants {
  x: number;
  y: number;
  labels?:
    | {
        topLeft?: string | undefined;
        topRight?: string | undefined;
        bottomLeft?: string | undefined;
        bottomRight?: string | undefined;
      }
    | undefined;
}

export type QuadrantLabels = ScatterQuadrants["labels"];

const fits = (scale: AxisScale, at: number) => scale === "linear" || at > 0;

/** A split a log axis cannot place, at or below zero, or one that is not a number, is no split at all. */
export function quadrantSplit(
  quadrants: ScatterQuadrants | undefined,
  xScale: AxisScale,
  yScale: AxisScale,
): ScatterQuadrants | undefined {
  if (!quadrants || !Number.isFinite(quadrants.x) || !Number.isFinite(quadrants.y)) return undefined;
  return fits(xScale, quadrants.x) && fits(yScale, quadrants.y) ? quadrants : undefined;
}

/** The largest sized dot; the smallest stays big enough to see and to tap. */
export const MAX_RADIUS = 20;
const MIN_RADIUS = 3;

/** A size that is not a positive number (NaN, Infinity, a negative) weighs nothing. */
const weight = (p: { size?: number | undefined }) =>
  p.size !== undefined && Number.isFinite(p.size) && p.size > 0 ? p.size : 0;

/**
 * Each dot's radius. Area, not radius, follows size, so a holding twice as large has twice the ink. A size that weighs
 * nothing draws the smallest dot, so it cannot shrink or hide the others. Points without sizes all take `plain`.
 */
export function dotSizes(points: readonly { size?: number | undefined }[], plain: number) {
  const largest = points.reduce((most, p) => Math.max(most, weight(p)), 0);
  const sized = points.some((p) => p.size !== undefined);
  const radiusOf = (p: { size?: number | undefined }) => {
    if (!sized || p.size === undefined) return plain;
    // Every size bad leaves nothing to scale against: each dot is the smallest.
    return largest > 0 ? Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(weight(p) / largest)) : MIN_RADIUS;
  };
  return { radiusOf, sized };
}

/** Words broken into lines no wider than `width`; a word wider than that keeps a line of its own. */
function wrap(text: string, width: number, measure: LabelType["measure"]): string[] {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`) <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/**
 * Each corner's name in the plot's corner, in the band the y axis keeps clear above or below the data, wrapped to its
 * own quadrant's width so two names on one edge never meet: where its lines are drawn, and the box they take.
 */
export function corners(plot: Box, names: QuadrantLabels, split: { x: number; y: number } | null, type: LabelType) {
  if (!names || !split) return [];
  const line = (type.size * 4) / 3;
  const inset = 6;
  const spots = [
    [names.topLeft, "left", "top"],
    [names.topRight, "right", "top"],
    [names.bottomLeft, "left", "bottom"],
    [names.bottomRight, "right", "bottom"],
  ] as const;
  return spots.flatMap(([text, side, edge]) => {
    if (!text) return [];
    const room = (side === "left" ? split.x - plot.x : plot.x + plot.width - split.x) - inset * 2;
    const lines = wrap(text, Math.max(room, 0), type.measure);
    const width = Math.max(...lines.map(type.measure));
    // A name that would need a third line, or overrun its quadrant, is left out rather than drawn over its neighbour.
    if (lines.length > 2 || width > room) return [];
    const height = lines.length * line;
    const x = side === "left" ? plot.x + inset : plot.x + plot.width - inset - width;
    const top = edge === "top" ? plot.y + inset : plot.y + plot.height - inset - height;
    return [{ key: `${side}-${edge}`, lines, x, y: top + type.size, line, box: { x, y: top, width, height } }];
  });
}
