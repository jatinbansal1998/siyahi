import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

/** Height of a group's label row, above its tiles. */
const GROUP_LABEL = 18;

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

/** Squarified layout: items without a group are tiles of their own, the rest sit together under their group's label. */
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
    .paddingInner(2)
    .paddingTop(({ data }) => (data.group === undefined ? 0 : GROUP_LABEL))
    .tile(treemapSquarify)(hierarchy(nested).sum(({ item }) => area(item?.weight)));
  return {
    groups: (root.children ?? []).flatMap((node) =>
      node.data.group === undefined || !node.value
        ? []
        : [{ ...box(node), height: GROUP_LABEL, group: node.data.group }],
    ),
    tiles: root
      .leaves()
      .flatMap((node) => (node.data.item === undefined || !node.value ? [] : [{ ...box(node), item: node.data.item }])),
  };
}

// Five equal steps across ±range: 12% to 60% of --positive or --negative mixed
// into the card. oklab, not oklch: the card is achromatic, and an oklch mix
// would swing green through orange on its way to it. A range that is not a
// positive number falls back to the default rather than painting every tile
// at one end of the scale.
export function heat(change: number | null, range = 0.05): string {
  if (!change) return "var(--muted)";
  const scale = Number.isFinite(range) && range > 0 ? range : 0.05;
  const mix = Math.min(5, Math.ceil((Math.abs(change) / scale) * 5)) * 12;
  return `color-mix(in oklab, var(${change > 0 ? "--positive" : "--negative"}) ${mix}%, var(--card))`;
}
