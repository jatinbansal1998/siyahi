import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useFormat } from "@siyahi/ui/lib/format";
import { cn } from "cn";
import { HEAT_STEPS, heat, heatFill, heatRange, heatText, layout } from "@siyahi/ui/lib/treemap";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

export interface TreemapItem {
  name: string;
  /** Tile area, such as a city's sales. Zero, negative and non-finite weights draw no tile. */
  weight: number;
  /** Signed change as a fraction; sets the heat. `null` when unknown: a muted tile marked "—". */
  change: number | null;
  /** Unique key when names repeat, such as one city sold to online and in stores. Defaults to `name`. */
  key?: string;
  /** Tiles of one group, such as a region, sit together in a frame under the group's name, even a group of one. */
  group?: string;
  /** A third line on a tile with room for it, such as the change in money. */
  detail?: string | undefined;
}

export interface TreemapProps<T extends TreemapItem> {
  items: T[];
  height: number;
  /** ±range: the change, as a fraction, that takes the deepest heat step. Default 0.05 (±5%); a range that is not a positive number uses the default. */
  range?: number;
  /**
   * Gets the item under a mouse, and null when it moves onto a group's name or leaves the map. A tap fires no hover:
   * on a touch screen it selects, so the page shows the tile in place rather than in a card at the finger.
   */
  onHover?: (item: T | null) => void;
  /** The selected item, matched by key, whose tile carries a ring. Pass back what onSelect gave. */
  selected?: T | null;
  /**
   * Gets the item whose tile is tapped or clicked, and null when the selected
   * tile is tapped again or a tap lands anywhere else. On a touch screen, which
   * has no hover, this is how a reader gets a tile's figures.
   */
  onSelect?: (item: T | null) => void;
}

/** Heat map of parts of a whole: area by weight, colour by signed change, optionally grouped; hand-drawn SVG. */
export function Treemap<T extends TreemapItem>({ items, height, range, onHover, selected, onSelect }: TreemapProps<T>) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const selectedKey = selected ? (selected.key ?? selected.name) : null;
  const { pct } = useFormat();
  // A tap on a tile is handled by the tile's own click; any other tap clears.
  const clearOutside = useEffectEvent((event: PointerEvent) => {
    const tile = event.target instanceof Element ? event.target.closest('[data-slot="treemap-tile"]') : null;
    if (!ref.current?.contains(tile)) onSelect?.(null);
  });
  useEffect(() => {
    if (selectedKey === null) return;
    const onPointerDown = (event: PointerEvent) => clearOutside(event);
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedKey]);
  const { groups, tiles } = useMemo(() => layout(items, width, height), [items, width, height]);
  const focusKey = tiles.some(({ item }) => (item.key ?? item.name) === focusedKey)
    ? focusedKey
    : (tiles[0]?.item.key ?? tiles[0]?.item.name);
  const change = (value: number | null) =>
    value === null ? "—" : `${value > 0 ? "+" : value < 0 ? "\u2212" : ""}${pct(Math.abs(value))}`;
  // Each label sits in a nested <svg>, which clips it to its tile or group row.
  return (
    <div ref={ref} data-slot="treemap" style={{ height }}>
      <svg
        width={width}
        height={height}
        role={onSelect ? "group" : "img"}
        aria-label="Treemap by weight and change"
        className="text-xs"
        onPointerLeave={(event) => event.pointerType === "mouse" && onHover?.(null)}
      >
        {groups.map(({ group, ...box }) => (
          <svg
            key={group}
            {...box}
            data-slot="treemap-group"
            onPointerEnter={(event) => event.pointerType === "mouse" && onHover?.(null)}
          >
            <rect width="100%" height="100%" rx={6} className="fill-muted" />
            <title>{group}</title>
            {/* A name cut to "Co…" reads as a different word; a group too narrow for its name drops it to the tooltip. */}
            {textWidth(group) <= box.width - 12 && (
              <text x={6} y={14} className="fill-foreground font-medium">
                {group}
              </text>
            )}
          </svg>
        ))}
        {tiles.map(({ item, ...box }, index) => {
          const key = item.key ?? item.name;
          return (
            <svg
              key={key}
              {...box}
              data-slot="treemap-tile"
              data-selected={key === selectedKey || undefined}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? (key === focusKey ? 0 : -1) : undefined}
              aria-label={`${item.name}${item.group ? `, ${item.group}` : ""}, ${change(item.change)}`}
              aria-pressed={onSelect ? key === selectedKey : undefined}
              onFocus={() => setFocusedKey(key)}
              onKeyDown={(event) => {
                if (!onSelect) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(key === selectedKey ? null : item);
                } else if (event.key === "Escape") {
                  onSelect(null);
                } else {
                  let next: number;
                  switch (event.key) {
                    case "Home":
                      next = 0;
                      break;
                    case "End":
                      next = tiles.length - 1;
                      break;
                    case "ArrowRight":
                    case "ArrowDown":
                      next = (index + 1) % tiles.length;
                      break;
                    case "ArrowLeft":
                    case "ArrowUp":
                      next = (index + tiles.length - 1) % tiles.length;
                      break;
                    default:
                      return;
                  }
                  event.preventDefault();
                  const target = tiles[next]?.item;
                  if (target) setFocusedKey(target.key ?? target.name);
                  ref.current?.querySelectorAll<SVGSVGElement>('[data-slot="treemap-tile"]')[next]?.focus();
                }
              }}
              // Hover is a mouse's: a tap fires pointerenter too, which opened a page's hover card wherever the finger
              // landed. A tap selects, and the page shows the selection in place.
              onPointerEnter={(event) => event.pointerType === "mouse" && onHover?.(item)}
              onClick={() => onSelect?.(key === selectedKey ? null : item)}
            >
              <rect width="100%" height="100%" rx={4} style={{ fill: heat(item.change, range) }} />
              {key === selectedKey && (
                <rect
                  x={1}
                  y={1}
                  width={box.width - 2}
                  height={box.height - 2}
                  rx={3}
                  fill="none"
                  strokeWidth={2}
                  className="stroke-foreground"
                />
              )}
              <TileLabel
                width={box.width}
                height={box.height}
                lines={[item.name, change(item.change), item.detail]}
                fill={heatText(item.change, range)}
              />
            </svg>
          );
        })}
      </svg>
    </div>
  );
}

// Geist averages about 0.55em a character, and a semibold symbol in capitals about 0.7em; a name longer than its
// box ends in an ellipsis instead of being cut mid-letter by the box's clip.
const CHAR_EM = 0.55;
const CAPS_EM = 0.7;
const textWidth = (text: string): number => text.length * 12 * CHAR_EM;
function fit(text: string, width: number, size: number): string {
  const room = Math.floor(width / (size * CAPS_EM));
  return text.length <= room ? text : `${text.slice(0, Math.max(room - 1, 1)).trimEnd()}…`;
}
// Below these a tile's text is a few clipped letters; its figures stay in the hover and the aria-label.
const MIN_LABEL_WIDTH = 56;
const MIN_LABEL_HEIGHT = 28;
// The name grows with its tile, up to MAX_TEXT, so a large position is read from across the room; the lines under
// it run at SUB_TEXT of its size, smaller where the tile is narrow, never below MIN_TEXT.
const MIN_TEXT = 11;
const MAX_TEXT = 28;
const SUB_TEXT = 0.7;
const PAD = 8;

/**
 * A tile's name, change and detail, centred and sized to the tile. A figure is never cut short, since "₹43,…" reads
 * as a different number: a line that does not fit at MIN_TEXT, or below the lines above it, is left off with every
 * line after it.
 */
function TileLabel({
  width,
  height,
  lines: [name, ...rest],
  fill,
}: {
  width: number;
  height: number;
  lines: [string, string, string | undefined];
  fill: string;
}) {
  if (width < MIN_LABEL_WIDTH || height < MIN_LABEL_HEIGHT) return null;
  // Whole pixels: a size that fits the name exactly would otherwise round to one character short in fit().
  const size = Math.floor(
    Math.max(MIN_TEXT, Math.min(MAX_TEXT, (width - 2 * PAD) / (name.length * CAPS_EM), height * 0.3)),
  );
  const sub = Math.max(MIN_TEXT, size * SUB_TEXT);
  // Each line takes 1.25 of its size; a line is drawn only when it and every line above it fit.
  const room = width - 2 * PAD;
  const shown: { line: number; text: string; size: number }[] = [{ line: 0, text: fit(name, room, size), size }];
  let used = size * 1.25;
  for (const [i, text] of rest.entries()) {
    if (text === undefined) break;
    const lineSize = Math.floor(Math.min(sub, room / (text.length * CHAR_EM)));
    if (lineSize < MIN_TEXT || used + lineSize * 1.25 > height - PAD) break;
    shown.push({ line: i + 1, text, size: lineSize });
    used += lineSize * 1.25;
  }
  let y = (height - used) / 2;
  return (
    <text x={width / 2} textAnchor="middle" style={{ fill }} className="tabular-nums">
      {shown.map((line) => {
        y += line.size * 1.25;
        return (
          <tspan
            key={line.line}
            x={width / 2}
            y={y - line.size * 0.3}
            fontSize={line.size}
            className={line.line === 0 ? "font-semibold" : undefined}
          >
            {line.text}
          </tspan>
        );
      })}
    </text>
  );
}

function Swatch({ label, fill }: { label: string; fill: string }) {
  return (
    <svg data-slot="treemap-legend-swatch" className="h-3 flex-1">
      <title>{label}</title>
      <rect width="100%" height="100%" rx={2} style={{ fill }} />
    </svg>
  );
}

export interface TreemapLegendProps {
  /** The Treemap's own range, so each swatch matches its tiles. */
  range?: number;
  className?: string;
}

/** The Treemap's colour scale under the map: five steps of loss, no change, five steps of gain, deepest at the ends. */
export function TreemapLegend({ range, className }: TreemapLegendProps) {
  const { pct } = useFormat();
  const step = heatRange(range) / HEAT_STEPS;
  // Whole percentages print without a decimal; a step such as 1.2% keeps one.
  const digits = Number.isInteger(Math.round(step * 1e6) / 1e4) ? 0 : 1;
  const over = pct(step * (HEAT_STEPS - 1), digits);
  const swatch = (side: "positive" | "negative", n: number) => {
    const word = side === "positive" ? "up" : "down";
    const label =
      n === HEAT_STEPS ? `${word} over ${over}` : `${word} ${pct(step * (n - 1), digits)}–${pct(step * n, digits)}`;
    return <Swatch key={`${side}-${n}`} label={label} fill={heatFill(side, n)} />;
  };
  const steps = Array.from({ length: HEAT_STEPS }, (_, i) => i + 1);
  return (
    <div
      data-slot="treemap-legend"
      className={cn("flex w-full max-w-xs flex-col gap-1 text-xs text-muted-foreground", className)}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {steps.toReversed().map((n) => swatch("negative", n))}
        <Swatch label="no change, or unknown" fill={heat(null)} />
        {steps.map((n) => swatch("positive", n))}
      </div>
      <div className="flex justify-between gap-2 tabular-nums">
        <span>down over {over}</span>
        <span>{pct(step, digits)} a step</span>
        <span>up over {over}</span>
      </div>
      <p className="sr-only">
        Tile colours run in {HEAT_STEPS} steps of {pct(step, digits)} each way, deepest over {over}; a muted tile is no
        change or unknown.
      </p>
    </div>
  );
}
