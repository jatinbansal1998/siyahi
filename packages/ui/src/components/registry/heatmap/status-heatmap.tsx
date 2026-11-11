// Registry: @heatmap/status-heatmap
// Origin: https://shadcn-heatmap.pages.dev/r/status-heatmap.json
// Licence: MIT, Copyright (c) 2026 ChingRu, https://github.com/rutopio/shadcn-heatmap/blob/master/LICENSE
// Copied: 2026-10-20, sha256 9ab8be330eaa760a6e177722e799fc3a10288567eec47885eb65a6fdba666b06
// Siyahi edit: the surrounding card owns padding; the heatmap body owns scrolling.
// Siyahi edit: without a blockAspectRatio the strip spans its width: bars are
// as wide as an equal share allows, and the padding is just room for a focus ring.
// Siyahi edit: legend swatches keep one size however narrow the bars get.
// Siyahi edit: legend entries sit gap-3 apart, so each label stays with its own swatch.
// Siyahi edit: a Block takes `selected`, the page's picked cell, drawn with a
// ring in the text colour and announced as pressed, as a Treemap tile is.
// Siyahi edit: a healthy day is 30% grey (was 40%), so a light degraded day's
// amber reaches 3:1 against it; contrast.mjs checks both status colours on it.
// Siyahi edit: hover, `highlighted` and keyboard focus draw an outline (the
// text colour, or the focus ring's) and never fade the day's colour: a 70%
// hover or 60% highlight dropped a degraded day under 3:1 against the card,
// and the ring a focused SVG cell was given never drew. The picked cell's
// ring is a class too, so focus outranks it.
// Siyahi edit: a degraded day fills only the lower half of its bar, over the
// healthy grey, in the strip and the legend alike, so it differs from a
// critical day in shape as well as hue (amber and red are about 1.4:1 apart).
// The bar keeps its full height, so its tap target does not shrink.
// Siyahi edit: a day with no data is hollow, an outline in the field-edge
// colour (3:1 on the card), unless the page gives it a colour: its old grey
// fill was 1.4:1 from a healthy day and 1.1:1 from the card.
// Siyahi edit: a healthy day's faint grey sits inside a solid field-edge
// outline, 3:1 on the card where the grey alone is 1.5:1, and a no-data day's
// outline is dashed, so the two differ by more than a faint fill. The legend
// wraps, so four states fit a narrow phone.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
// Siyahi edit: bars and legend swatches are square (blockRadius 0, was 2), as every box is.
import type { Locale } from "date-fns";
import { format } from "date-fns";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createContext, Fragment, use, useId, useMemo } from "react";
import { cn } from "@siyahi/ui/lib/utils";
// Siyahi edit: interactive grids share one keyboard entry and spatial arrow navigation.
import { useHeatmapNavigation } from "@siyahi/ui/lib/heatmap-navigation";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

// Status values. 0 is reserved for no-data. Defaults: 1=critical, 2=degraded, 3=healthy.
// Extend by passing `colors` / `labels.statuses` keyed by the numeric value.
export type StatusValue = number;

export type StatusActivity = {
  date: string; // YYYY-MM-DD
  value: StatusValue;
};

type StatusHeatmapContextType = {
  /** The id of the half-filled gradient a degraded day is painted with. */
  degradedId: string;
  data: StatusActivity[];
  dates: string[];
  blockMargin: number;
  blockRadius: number;
  blockSize: number;
  blockAspectRatio: number;
  blockWidth: number;
  fontSize: number;
  labels: StatusHeatmapLabels;
  statusValues: StatusValue[];
  healthyValue: StatusValue;
  width: number;
  height: number;
  dateFormat: string;
  locale?: Locale | undefined;
  colors?: StatusColorConfig | undefined;
};

export type StatusHeatmapLabels = {
  statuses?: Record<number, string> & {
    noData?: string | undefined;
    critical?: string | undefined;
    degraded?: string | undefined;
    healthy?: string | undefined;
  } | undefined;
  stat?: string | undefined; // Stat text template. Placeholder: {{value}}
  cellLabel?: string | undefined; // aria-label template. Placeholders: {{date}}, {{status}}
  heatmapLabel?: string | undefined; // aria-label for the heatmap SVG
  legendLabel?: string | undefined; // aria-label for the legend fieldset
};

export type StatusColorConfig = Record<number, string> & {
  noData?: string | undefined;
  critical?: string | undefined;
  degraded?: string | undefined;
  healthy?: string | undefined;
};

// Siyahi edit: the defaults name the theme's colours instead of fixed Tailwind
// values. Green and red mean gain and loss, so health is not green: a healthy
// day is a quiet grey, degraded is the warning colour, critical the error one.
// Siyahi edit: a focused cell shows the theme's focus outline, a square clear
// of it, instead of a stroke in the ring colour, which matched a picked
// cell's stroke once focus took the text colour.
const DEFAULT_COLORS: Record<number, string> = {
  0: "var(--color-secondary)",
  1: "var(--destructive)", // critical
  2: "var(--warning)", // degraded
  3: "color-mix(in oklab, var(--muted-foreground) 30%, transparent)", // healthy
};

const SEMANTIC_KEYS: Record<
  number,
  "noData" | "critical" | "degraded" | "healthy"
> = {
  0: "noData",
  1: "critical",
  2: "degraded",
  3: "healthy",
};

const resolveColor = (
  value: StatusValue,
  colors?: StatusColorConfig,
): string => {
  const semanticKey = SEMANTIC_KEYS[value];
  if (colors) {
    const numeric = colors[value];
    if (typeof numeric === "string") return numeric;
    if (semanticKey) {
      const semantic = colors[semanticKey];
      if (typeof semantic === "string") return semantic;
    }
  }
  return DEFAULT_COLORS[value] ?? DEFAULT_COLORS[0];
};

const resolveStatusLabel = (
  value: StatusValue,
  labels?: StatusHeatmapLabels["statuses"],
): string => {
  if (labels) {
    const numeric = labels[value];
    if (typeof numeric === "string") return numeric;
    const semanticKey = SEMANTIC_KEYS[value];
    if (semanticKey) {
      const semantic = labels[semanticKey];
      if (typeof semantic === "string") return semantic;
    }
  }
  switch (value) {
    case 0:
      return "No Data";
    case 1:
      return "Critical";
    case 2:
      return "Degraded";
    case 3:
      return "Healthy";
    default:
      return `Status ${value}`;
  }
};


const DEGRADED = 2;

/** A degraded day's paint: amber in the lower half of the bar, the healthy grey above it. */
const DegradedGradient = ({
  id,
  colors,
  healthyValue,
}: {
  id: string;
  colors?: StatusColorConfig | undefined;
  healthyValue: StatusValue;
}) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.5" style={{ stopColor: resolveColor(healthyValue, colors) }} />
      <stop offset="0.5" style={{ stopColor: resolveColor(DEGRADED, colors) }} />
    </linearGradient>
  </defs>
);

const NO_DATA = 0;

/** A no-data day is drawn hollow unless the page gave that state a colour of its own. */
const isHollow = (value: StatusValue, colors?: StatusColorConfig) =>
  value === NO_DATA && colors?.[NO_DATA] === undefined && colors?.noData === undefined;

/** The outline a day carries in the field-edge colour: solid round a healthy day, dashed round a day with no data. */
const edgeOf = (value: StatusValue, healthyValue: StatusValue, colors?: StatusColorConfig) =>
  isHollow(value, colors) ? "dashed" : value === healthyValue ? "solid" : null;

const blockPaint = (value: StatusValue, degradedId: string, colors?: StatusColorConfig): CSSProperties =>
  value === DEGRADED
    ? { fill: `url(#${degradedId})` }
    : { fill: isHollow(value, colors) ? "transparent" : resolveColor(value, colors) };

const EMPTY_STYLE: CSSProperties = {};
const PADDING = 3;
const LEGEND_SWATCH = 10;
const MIN_FITTED_BAR = 2;
const DEFAULT_ASPECT_RATIO = 0.2;

const StatusHeatmapContext = createContext<StatusHeatmapContextType | null>(
  null,
);

const useStatusHeatmap = () => {
  const context = use(StatusHeatmapContext);

  if (!context) {
    throw new Error(
      "StatusHeatmap components must be used within a StatusHeatmap",
    );
  }

  return context;
};

export type StatusHeatmapProps = HTMLAttributes<HTMLDivElement> & {
  data: StatusActivity[];
  dateFormat?: string | undefined;
  blockSize?: number | undefined;
  blockMargin?: number | undefined;
  blockRadius?: number | undefined;
  blockAspectRatio?: number | undefined;
  colors?: StatusColorConfig | undefined;
  locale?: Locale | undefined;
  labels?: StatusHeatmapLabels | undefined;
  fontSize?: number | undefined;
  emptyState?: ReactNode;
  statusValues?: StatusValue[] | undefined; // Legend order. Defaults to [0, 1, 2, 3]
  healthyValue?: StatusValue | undefined; // Value counted by the default StatusHeatmapStat compute. Default: 3
  style?: CSSProperties | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Status Heatmap
 *
 * A timeline indicator showing daily status over a period (e.g., 90 days).
 * Similar to Atlassian Statuspage - each day is represented by a vertical bar.
 * Supports 4 status values: 0=no-data, 1=critical, 2=degraded, 3=healthy
 *
 * @example
 * ```tsx
 * <StatusHeatmap data={data} blockAspectRatio={0.2}>
 *   <StatusHeatmapBody>
 *     {({ activity, dayIndex }) => (
 *       <StatusHeatmapBlock
 *         activity={activity}
 *         dayIndex={dayIndex}
 *       />
 *     )}
 *   </StatusHeatmapBody>
 *   <StatusHeatmapFooter>
 *     <StatusHeatmapStat />
 *     <StatusHeatmapLegend />
 *   </StatusHeatmapFooter>
 * </StatusHeatmap>
 * ```
 *
 * @param data - Array of activities with date (YYYY-MM-DD) and status value (0-3)
 * @param dateFormat - Date format string for tooltips. Default: "MMM d"
 * @param blockAspectRatio - Width/height ratio of blocks. Default: bars share the full width
 * @param colors - Custom colors for critical, degraded, and healthy states
 */
export const StatusHeatmap = ({
  data,
  dateFormat = "MMM d",
  blockSize = 40,
  blockMargin = 2,
  blockRadius = 0,
  blockAspectRatio: blockAspectRatioProp,
  colors,
  locale,
  labels: labelsProp,
  fontSize = 14,
  emptyState,
  statusValues = [0, 1, 2, 3],
  healthyValue = 3,
  style = EMPTY_STYLE,
  className,
  children,
  ...props
}: StatusHeatmapProps) => {
  const [rootRef, rootWidth] = useElementWidth<HTMLDivElement>();
  // React's ids carry characters a url(#…) reference would have to escape.
  const degradedId = `status-degraded-${useId().replace(/[^\w-]/g, "")}`;
  const labels = useMemo<StatusHeatmapLabels>(
    () => ({
      statuses: {
        noData: "No Data",
        critical: "Critical",
        degraded: "Degraded",
        healthy: "Healthy",
      },
      cellLabel: "{{date}}: {{status}}",
      heatmapLabel: "Status heatmap",
      legendLabel: "Status legend",
      ...labelsProp,
    }),
    [labelsProp],
  );

  const dates = useMemo(() => {
    const uniqueDates = new Set<string>();
    data.forEach((activity) => {
      uniqueDates.add(activity.date);
    });
    return Array.from(uniqueDates).sort();
  }, [data]);

  const fits = blockAspectRatioProp === undefined;
  const fitted =
    (rootWidth - PADDING * 2 + blockMargin) / Math.max(dates.length, 1) -
    blockMargin;
  const blockWidth =
    fits && rootWidth > 0
      ? Math.max(MIN_FITTED_BAR, fitted)
      : blockSize * (blockAspectRatioProp ?? DEFAULT_ASPECT_RATIO);
  const blockAspectRatio = blockWidth / blockSize;
  const width = dates.length * (blockWidth + blockMargin) - blockMargin;
  const height = blockSize;

  const contextValue = useMemo<StatusHeatmapContextType>(
    () => ({
      degradedId,
      data,
      dates,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      statusValues,
      healthyValue,
      width,
      height,
      dateFormat,
      locale,
      colors,
    }),
    [
      degradedId,
      data,
      dates,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      statusValues,
      healthyValue,
      width,
      height,
      dateFormat,
      locale,
      colors,
    ],
  );

  if (data.length === 0 || dates.length === 0) {
    return emptyState ? emptyState : null;
  }

  return (
    <StatusHeatmapContext value={contextValue}>
      <div
        ref={rootRef}
        data-slot="status-heatmap"
        className={cn(
          "flex flex-col gap-2",
          fits ? "w-full" : "w-max max-w-full",
          className,
        )}
        style={{ fontSize, ...style }}
        {...props}
      >
        {children}
      </div>
    </StatusHeatmapContext>
  );
};

export type StatusHeatmapBlockProps = HTMLAttributes<SVGRectElement> & {
  /** The cell the page has picked: drawn with a ring and announced as pressed. */
  selected?: boolean | undefined;
  activity: StatusActivity;
  dayIndex: number;
  highlighted?: boolean | undefined;
  onCellClick?: ((activity: StatusActivity) => void) | undefined;
  onCellHover?: ((activity: StatusActivity | null) => void) | undefined;
  className?: string | undefined;
};

export const StatusHeatmapBlock = ({
  ref,
  activity,
  dayIndex,
  highlighted = false,
  selected = false,
  onCellClick,
  onCellHover,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  className,
  style: styleProp,
  ...props
}: StatusHeatmapBlockProps & {
  ref?: React.RefObject<SVGRectElement | null> | undefined;
}) => {
  const { blockSize, blockWidth, blockMargin, blockRadius, labels, colors, degradedId, healthyValue } =
    useStatusHeatmap();
  const edge = edgeOf(activity.value, healthyValue, colors);

  const statusText = resolveStatusLabel(activity.value, labels.statuses);

  const ariaLabel = (labels.cellLabel ?? "{{date}}: {{status}}")
    .replace("{{date}}", activity.date)
    .replace("{{status}}", statusText);

  const xPosition = (blockWidth + blockMargin) * dayIndex;

  return (
    <rect
      ref={ref}
      data-slot="status-heatmap-block"
      role={onCellClick ? "button" : "img"}
      aria-pressed={onCellClick ? selected : undefined}
      tabIndex={onCellClick ? 0 : -1}
      aria-label={ariaLabel}
      className={cn(
        edge && "stroke-input stroke-1",
        "hover:stroke-foreground hover:stroke-1",
        highlighted && "stroke-foreground stroke-1",
        // The picked cell carries a ring in the text colour, as a Treemap tile does; the fill keeps its level. A class,
        // not an inline style, so keyboard focus on the picked cell still draws its own ring over it.
        selected && "stroke-foreground stroke-2 hover:stroke-2",
        onCellClick &&
          "cursor-pointer",
        className,
      )}
      data-value={activity.value}
      data-date={activity.date}
      data-highlighted={highlighted || undefined}
      data-selected={selected || undefined}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockWidth}
      // An attribute, not a class, so hover and focus outlines restyle the line but keep its dashes off.
      strokeDasharray={edge === "dashed" ? "2 2" : undefined}
      x={xPosition}
      y={0}
      style={{
        ...blockPaint(activity.value, degradedId, colors),
        ...styleProp,
      }}
      onClick={(event) => {
        onCellClick?.(activity);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (onCellClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onCellClick(activity);
        }
        onKeyDown?.(event);
      }}
      onMouseEnter={(event) => {
        onCellHover?.(activity);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        onCellHover?.(null);
        onMouseLeave?.(event);
      }}
      {...props}
    />
  );
};
StatusHeatmapBlock.displayName = "StatusHeatmapBlock";

export type StatusHeatmapBodyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideDateLabels?: boolean | undefined;
  labelInterval?: number | undefined; // Show label every N days
  className?: string | undefined;
  labelClassName?: string | undefined;
  children: (props: {
    activity: StatusActivity;
    dayIndex: number;
  }) => ReactNode;
};

export const StatusHeatmapBody = ({
  hideDateLabels = false,
  labelInterval = 30,
  className,
  labelClassName,
  children,
  ...props
}: StatusHeatmapBodyProps) => {
  const navigation = useHeatmapNavigation();
  const {
    data,
    dates,
    width,
    height,
    blockWidth,
    blockMargin,
    fontSize,
    dateFormat,
    locale,
    labels,
    colors,
    degradedId,
    healthyValue,
  } = useStatusHeatmap();

  const activityMap = useMemo(() => {
    const map = new Map<string, StatusActivity>();
    data.forEach((activity) => {
      map.set(activity.date, activity);
    });
    return map;
  }, [data]);

  const allActivities = useMemo(() => {
    return dates.map((date) => {
      const existing = activityMap.get(date);
      return (
        existing || {
          date,
          value: 0 as StatusValue,
        }
      );
    });
  }, [dates, activityMap]);

  const labelFontSize = fontSize * 0.75;
  const labelHeight = hideDateLabels ? 0 : labelFontSize * 2;

  return (
    <div
      data-slot="status-heatmap-body"
      ref={navigation.ref}
      className={cn("max-w-full overflow-x-auto overflow-y-hidden", className)}
      {...props}
      onKeyDown={(event) => { props.onKeyDown?.(event); if (!event.defaultPrevented) navigation.onKeyDown(event); }}
    >
      <svg
        role="img"
        aria-label={labels.heatmapLabel ?? "Status heatmap"}
        className="block overflow-visible rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        height={height + labelHeight + PADDING * 2}
        viewBox={`${-PADDING} ${-PADDING} ${width + PADDING * 2} ${height + labelHeight + PADDING * 2}`}
        width={width + PADDING * 2}
      >
        <DegradedGradient id={degradedId} colors={colors} healthyValue={healthyValue} />
        {!hideDateLabels && (
          <g className={cn("fill-current font-mono", labelClassName)}>
            {dates.map((date, dayIndex) => {
              const isFirst = dayIndex === 0;
              const isLast = dayIndex === dates.length - 1;
              if (dayIndex % labelInterval !== 0 && !isLast) return null;

              const blockLeft = (blockWidth + blockMargin) * dayIndex;
              const xPosition = isFirst
                ? blockLeft
                : isLast
                  ? blockLeft + blockWidth
                  : blockLeft + blockWidth / 2;
              const anchor = isFirst ? "start" : isLast ? "end" : "middle";

              return (
                <text
                  key={`date-${date}`}
                  x={xPosition}
                  y={height + labelFontSize}
                  dominantBaseline="hanging"
                  textAnchor={anchor}
                  style={{ fontSize: `${labelFontSize}px` }}
                >
                  {format(new Date(date), dateFormat, { locale })}
                </text>
              );
            })}
          </g>
        )}

        {allActivities.map((activity, dayIndex) => {
          const key = activity.date;
          return (
            <Fragment key={key}>{children({ activity, dayIndex })}</Fragment>
          );
        })}
      </svg>
    </div>
  );
};

export type StatusHeatmapFooterProps = HTMLAttributes<HTMLDivElement>;

export const StatusHeatmapFooter = ({
  className,
  ...props
}: StatusHeatmapFooterProps) => (
  <div
    data-slot="status-heatmap-footer"
    className={cn(
      "flex flex-wrap gap-1 whitespace-nowrap sm:gap-x-4",
      className,
    )}
    {...props}
  />
);

export type StatusHeatmapStatProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  compute?: ((data: StatusActivity[]) => number | string) | undefined;
  label?: string | undefined; // Template overriding labels.stat. Placeholder: {{value}}
  children?: ((result: {
    value: number | string;
    data: StatusActivity[];
  }) => ReactNode) | undefined;
};

export const StatusHeatmapStat = ({
  compute,
  label,
  className,
  children,
  ...props
}: StatusHeatmapStatProps) => {
  const { data, healthyValue, labels } = useStatusHeatmap();

  const value = compute
    ? compute(data)
    : data.filter((a) => a.value === healthyValue).length;

  if (children) {
    return <>{children({ value, data })}</>;
  }

  const template = label ?? labels.stat ?? "{{value}} days healthy";

  return (
    <div
      data-slot="status-heatmap-stat"
      className={cn("text-muted-foreground tabular-nums", className)}
      {...props}
    >
      {template.replace("{{value}}", String(value))}
    </div>
  );
};

export type StatusHeatmapLegendProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  "children"
> & {
  labels?: StatusHeatmapLabels["statuses"] | undefined;
  children?: ((props: { value: StatusValue; label: string }) => ReactNode) | undefined;
};

export const StatusHeatmapLegend = ({
  labels: labelsProp,
  className,
  children,
  ...props
}: StatusHeatmapLegendProps) => {
  const { labels, statusValues, blockRadius, colors, degradedId, healthyValue } = useStatusHeatmap();

  const statuses = statusValues.map((value) => ({
    value,
    label: resolveStatusLabel(value, labelsProp ?? labels.statuses),
  }));

  return (
    <fieldset
      data-slot="status-heatmap-legend"
      aria-label={labels.legendLabel ?? "Status legend"}
      className={cn("ml-auto flex flex-wrap items-center gap-x-3 gap-y-1", className)}
      {...props}
    >
      {statuses.map((status) =>
        children ? (
          <Fragment key={`status-${status.value}`}>
            {children({ value: status.value, label: status.label })}
          </Fragment>
        ) : (
          <div
            key={`status-${status.value}`}
            className="flex items-center gap-1"
          >
            <svg aria-hidden="true" height={LEGEND_SWATCH} width={LEGEND_SWATCH}>
              {status.value === DEGRADED && (
                <DegradedGradient id={`${degradedId}-legend`} colors={colors} healthyValue={healthyValue} />
              )}
              <rect
                data-value={status.value}
                // An outlined swatch sits half a pixel in, so its whole outline draws inside the swatch.
                {...(edgeOf(status.value, healthyValue, colors)
                  ? {
                      x: 0.5,
                      y: 0.5,
                      height: LEGEND_SWATCH - 1,
                      width: LEGEND_SWATCH - 1,
                      className: "stroke-input",
                      strokeDasharray: edgeOf(status.value, healthyValue, colors) === "dashed" ? "2 1" : undefined,
                    }
                  : { height: LEGEND_SWATCH, width: LEGEND_SWATCH })}
                rx={blockRadius}
                ry={blockRadius}
                style={blockPaint(status.value, `${degradedId}-legend`, colors)}
              />
            </svg>
            <span className="font-medium text-muted-foreground text-xs">
              {status.label}
            </span>
          </div>
        ),
      )}
    </fieldset>
  );
};
