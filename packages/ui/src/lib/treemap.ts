import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

/** Height of a group's header, above its tiles. */
const GROUP_LABEL = 20;
// A group's frame shows this much around its tiles, and groups stand further apart than the tiles in one, so a
// group reads as one block.
const GROUP_FRAME = 2;
const GROUP_GAP = 6;
const TILE_GAP = 2;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout<T> {
  groups: (Box & { group: string })[];
  tiles: (Box & { item: T })[];
}

interface Node<T> {
  item?: T;
  group?: string;
  children?: Node<T>[];
}

const box = ({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }): Box => ({
  x: x0,
  y: y0,
  width: x1 - x0,
  height: y1 - y0,
});

// d3 sums negative weights as they are, which pushes tiles out of the box,
// and an infinite one turns every position into NaN.
const area = (weight: number | undefined): number =>
  weight !== undefined && Number.isFinite(weight) && weight > 0 ? weight : 0;

/** Squarified layout: items without a group are tiles of their own, the rest sit together in their group's frame, under its header. */
export function layout<T extends { weight: number; group?: string }>(
  items: T[],
  width: number,
  height: number,
): Layout<T> {
  const nested: Node<T> = {
    children: [...Map.groupBy(items, (item) => item.group)].flatMap(([group, members]): Node<T>[] => {
      const tiles = members.map((item) => ({ item }));
      return group === undefined ? tiles : [{ group, children: tiles }];
    }),
  };
  const root = treemap<Node<T>>()
    .size([width, height])
    .paddingInner(({ depth }) => (depth === 0 ? GROUP_GAP : TILE_GAP))
    .paddingTop(({ data }) => (data.group === undefined ? 0 : GROUP_LABEL))
    .paddingRight(({ data }) => (data.group === undefined ? 0 : GROUP_FRAME))
    .paddingBottom(({ data }) => (data.group === undefined ? 0 : GROUP_FRAME))
    .paddingLeft(({ data }) => (data.group === undefined ? 0 : GROUP_FRAME))
    .tile(treemapSquarify)(hierarchy(nested).sum(({ item }) => area(item?.weight)));
  return {
    groups: (root.children ?? []).flatMap((node) =>
      node.data.group === undefined || !node.value ? [] : [{ ...box(node), group: node.data.group }],
    ),
    tiles: root
      .leaves()
      .flatMap((node) => (node.data.item === undefined || !node.value ? [] : [{ ...box(node), item: node.data.item }])),
  };
}

const DEFAULT_RANGE = 0.05;
export const HEAT_STEPS = 5;

/** The range the heat scale uses: one that is not a positive number falls back to ±5%. */
export const heatRange = (range = DEFAULT_RANGE): number =>
  Number.isFinite(range) && range > 0 ? range : DEFAULT_RANGE;

// Step 1 to 5, as the share of --positive or --negative mixed into the card. Light runs 14% to 70%, dark text
// readable on all five. Dark cannot: the colour is lighter than its card, so steps 1 to 3 (22% to 46%) carry the
// light text and steps 4 and 5 (78%, the colour itself) switch to the colour's own dark foreground, which makes the
// biggest moves the brightest tiles. Step 1 starts above a faint tint, which reads as the card itself.
// oklab, not oklch: the card is achromatic, and an oklch mix would swing green through orange on its way to it.
const LIGHT = [14, 28, 42, 56, 70];
const DARK = [22, 34, 46, 78, 100];
const BRIGHT_FROM = 4;
export const heatFill = (side: "positive" | "negative", step: number): string => {
  const mix = (share: number) => `color-mix(in oklab, var(--${side}) ${share}%, var(--card))`;
  return `light-dark(${mix(LIGHT[step - 1] ?? 0)}, ${mix(DARK[step - 1] ?? 0)})`;
};

const heatStep = (change: number, range?: number): number =>
  Math.min(HEAT_STEPS, Math.ceil((Math.abs(change) / heatRange(range)) * HEAT_STEPS));

// Five equal steps across ±range. A range that is not a positive number falls
// back to the default rather than painting every tile at one end of the scale.
export function heat(change: number | null, range?: number): string {
  if (!change) return "var(--muted)";
  return heatFill(change > 0 ? "positive" : "negative", heatStep(change, range));
}

/** The text colour that reads on heat(change, range): the foreground, or in dark mode on the brightest steps the colour's own foreground. */
export function heatText(change: number | null, range?: number): string {
  if (!change || heatStep(change, range) < BRIGHT_FROM) return "var(--foreground)";
  return `light-dark(var(--foreground), var(--${change > 0 ? "positive" : "negative"}-foreground))`;
}
