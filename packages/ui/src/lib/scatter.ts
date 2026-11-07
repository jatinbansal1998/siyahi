/**
 * Ticks for a log axis at 1, 2 and 5 times a power of ten, from the largest at or under min to the smallest at or
 * over max, so the axis ends on a tick and every label reads as a round number.
 */
export function logTicks(min: number, max: number): number[] {
  if (!(min > 0) || !Number.isFinite(max) || !(max >= min)) return [];
  const ticks: number[] = [];
  for (let decade = Math.floor(Math.log10(min)); ; decade++) {
    for (const step of [1, 2, 5]) {
      // toPrecision keeps 0.1 × 3 from coming out as 0.30000000000000004.
      const tick = Number((step * 10 ** decade).toPrecision(12));
      const next = Number(((step === 5 ? 10 : step === 2 ? 5 : 2) * 10 ** decade).toPrecision(12));
      if (next <= min) continue;
      ticks.push(tick);
      if (tick >= max) return ticks;
    }
  }
}

// Twelve significant digits: enough for any axis label, and it strips the float noise of i × step. `|| 0` turns −0
// into 0, which a formatter would otherwise write as "−0".
const clean = (value: number) => Number(value.toPrecision(12)) || 0;

/**
 * Ticks for a linear axis that just covers min to max, about `count` of them, a step of 1, 2, 2.5 or 5 times a power
 * of ten: −50% to +75% by 25s, never −50% to +150% because the step had to be 50. Values that differ only by float
 * noise, such as 0.3 and 0.30000000000000004, count as one value and get that value as their only tick.
 */
export function linearTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return [];
  if (max - min <= Math.max(Math.abs(min), Math.abs(max)) * 1e-9) return [clean(min)];
  const rough = (max - min) / (count - 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * power >= rough * (1 - 1e-9)) ?? 10) * power;
  // Counting whole steps, with a little slack for float noise, so 0.3 to 0.4 by 0.025 starts at 0.3, not 0.275.
  const first = Math.floor(min / step + 1e-9);
  const last = Math.ceil(max / step - 1e-9);
  return Array.from({ length: last - first + 1 }, (_, i) => clean((first + i) * step));
}

interface Box {
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
 * below and the four corners, and takes the first spot inside the plot that covers no other label and no other dot.
 * A name that finds no spot is left to the tooltip, so labels never sit on top of each other.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  plot: Box,
  limit: number,
  radius: number,
  { size, measure }: LabelType,
): PlacedLabel[] {
  const line = (size * 4) / 3;
  const dots = candidates.map(({ key, cx, cy }) => ({
    key,
    box: { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 },
  }));
  const taken: Box[] = [];
  const placed: PlacedLabel[] = [];
  for (const { key, text, cx, cy } of candidates) {
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
