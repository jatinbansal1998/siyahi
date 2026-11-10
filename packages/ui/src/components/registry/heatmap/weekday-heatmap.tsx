// Registry: @heatmap/weekday-heatmap
// Origin: https://shadcn-heatmap.pages.dev/r/weekday-heatmap.json
// Licence: MIT, Copyright (c) 2026 ChingRu, https://github.com/rutopio/shadcn-heatmap/blob/master/LICENSE
// Copied: 2026-10-20, sha256 b7af6139e3764e1479880fb232988e758edb27ce4e4280d9e0349cbdf9b3d30c
// Siyahi edit: explicit hours and weekdays crop the displayed domain without
// renumbering source data; the surrounding card owns padding.
// Siyahi edit: custom blocks outside that domain must not paint over the axis labels.
// Siyahi edit: without a blockSize, cells are sized from the heatmap's width
// so the grid fills its column, scrolling only below a readable cell; the
// padding around the grid is just room for the end hour label.
// Siyahi edit: legend swatches keep one size however large the cells grow.
// Siyahi edit: a Block takes `selected`, the page's picked cell, drawn with a
// ring in the text colour and announced as pressed, as a Treemap tile is.
// Siyahi edit: hover, `highlighted` and keyboard focus draw an outline (the
// text colour, or the focus ring's) and never fade the cell's colour, as
// CalendarHeatmap and StatusHeatmap do; the ring a focused SVG cell was given
// never drew. The picked cell's ring is a class, so focus outranks it.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
import type { Locale, Day as WeekDay } from "date-fns";
import { format } from "date-fns";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createContext, Fragment, use, useMemo } from "react";
import { cn } from "@siyahi/ui/lib/utils";
// Siyahi edit: interactive grids share one keyboard entry and spatial arrow navigation.
// Siyahi edit: a focused cell shows the theme's focus outline, a square clear
// of it, instead of a stroke in the ring colour, which matched a picked
// cell's stroke once focus took the text colour.
import { useHeatmapNavigation } from "@siyahi/ui/lib/heatmap-navigation";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekdayHour =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;

export type WeekdayHourlyActivity = {
  weekday: number; // 0–6 (Sun–Sat)
  hour: number; // 0–23
  value: number;
};

type WeekdayHourlyActivityWithLevel = WeekdayHourlyActivity & {
  level: number;
};

export type WeekdayExtraRowSpec = {
  label: ReactNode;
  compute: (data: WeekdayHourlyActivity[]) => number[]; // length 24
};

export type WeekdayExtraColumnSpec = {
  label: ReactNode;
  compute: (data: WeekdayHourlyActivity[]) => number[]; // length 7, indexed by weekday 0–6
};

type ResolvedExtraRow = {
  label: ReactNode;
  values: { hour: number; value: number; level: number }[];
};

type ResolvedExtraColumn = {
  label: ReactNode;
  values: { weekday: number; value: number; level: number }[];
};

type WeekdayHeatmapContextType = {
  data: WeekdayHourlyActivityWithLevel[];
  extraRow: ResolvedExtraRow | null;
  extraColumn: ResolvedExtraColumn | null;
  blockMargin: number;
  blockRadius: number;
  blockSize: number;
  blockAspectRatio: number;
  blockWidth: number;
  fontSize: number;
  labels: WeekdayHeatmapLabels;
  labelWidth: number;
  labelHeight: number;
  levels: number;
  isNormalized: boolean;
  totalCount: number;
  width: number;
  height: number;
  weekStart: WeekDay;
  hours: readonly number[];
  weekdays: readonly number[];
  colors?: ColorConfig | undefined;
};

export type WeekdayHeatmapLabels = {
  hours?: string[] | undefined;
  endHour?: string | null | undefined;
  weekdays?: string[] | undefined;
  stat?: string | undefined; // Stat text template. Placeholder: {{value}}
  cellLabel?: string | undefined; // aria-label template. Placeholders: {{weekday}}, {{hour}}, {{value}}
  heatmapLabel?: string | undefined; // aria-label for the heatmap SVG
  legendLabel?: string | undefined; // aria-label for the legend fieldset
  legendLevelLabel?: string | undefined; // aria-label template for legend swatches. Placeholder: {{level}}
};

export type ColorConfig = {
  empty?: string | undefined;
  scale?: string | undefined;
};

// Non-normalized: 1 empty + (levels-1) colored steps. Normalized: levels colored steps, no empty.
const colorStepCount = (levels: number, isNormalized: boolean) =>
  Math.max(1, isNormalized ? levels : levels - 1);

const calculateLevel = (
  value: number,
  minValue: number,
  maxValue: number,
  levels: number,
  isNormalized: boolean,
): number => {
  const steps = colorStepCount(levels, isNormalized);
  if (!Number.isFinite(value)) return isNormalized ? 1 : 0;
  if (isNormalized) {
    if (maxValue <= minValue) return 1;
    const percentage = (value - minValue) / (maxValue - minValue);
    return Math.max(1, Math.min(steps, Math.ceil(percentage * steps)));
  }
  if (value <= 0 || maxValue <= 0) return 0;
  const percentage = value / maxValue;
  return Math.max(1, Math.min(steps, Math.ceil(percentage * steps)));
};

const getLevelFill = (
  level: number,
  levels: number,
  isNormalized: boolean,
  colors?: ColorConfig,
): string => {
  const emptyColor = colors?.empty ?? "var(--color-secondary)";
  const scaleColor = colors?.scale ?? "var(--color-chart-1)";

  if (level === 0) return emptyColor;
  const steps = colorStepCount(levels, isNormalized);
  const opacity =
    steps === 1 ? 100 : Math.round(20 + ((level - 1) * 80) / (steps - 1));
  return `color-mix(in oklch, ${scaleColor} ${opacity}%, transparent)`;
};

const DEFAULT_HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const TWELVE_HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "AM";
  if (i < 12) return String(i);
  if (i === 12) return "PM";
  return String(i - 12);
});

const HOURS = Array.from({ length: 24 }, (_, i) => i as WeekdayHour);

const DEFAULT_WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const generateWeekdayLabels = (locale: Locale): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2000, 0, 2 + i); // Jan 2, 2000 is Sunday
    return format(date, "EEE", { locale });
  });

const EMPTY_STYLE: CSSProperties = {};
const LABEL_MARGIN = 8;
const PADDING = 12;
const LEGEND_SWATCH = 12;
// A fitted cell stays between these: smaller is unreadable (the body scrolls
// instead), larger turns a week into a wall of tiles.
const MIN_FITTED_BLOCK = 14;
const MAX_FITTED_BLOCK = 44;
const DEFAULT_BLOCK = 24;

const WeekdayHeatmapContext = createContext<WeekdayHeatmapContextType | null>(
  null,
);

const useWeekdayHeatmap = () => {
  const context = use(WeekdayHeatmapContext);

  if (!context) {
    throw new Error(
      "WeekdayHeatmap components must be used within a WeekdayHeatmap",
    );
  }

  return context;
};

export type WeekdayHeatmapProps = HTMLAttributes<HTMLDivElement> & {
  data: WeekdayHourlyActivity[];
  weekStart?: WeekDay | undefined;
  /** Displayed hours, in order; defaults to the full day. */
  hours?: readonly WeekdayHour[] | undefined;
  /** Displayed days, in order; defaults to the full week from weekStart. */
  weekdays?: readonly WeekdayIndex[] | undefined;
  use12Hour?: boolean | undefined;
  blockSize?: number | undefined;
  blockMargin?: number | undefined;
  blockRadius?: number | undefined;
  blockAspectRatio?: number | undefined;
  levels?: number | undefined;
  isNormalized?: boolean | undefined;
  colors?: ColorConfig | undefined;
  locale?: Locale | undefined;
  labels?: WeekdayHeatmapLabels | undefined;
  fontSize?: number | undefined;
  emptyState?: ReactNode;
  totalCount?: number | undefined;
  extraRow?: WeekdayExtraRowSpec | undefined;
  extraColumn?: WeekdayExtraColumnSpec | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Weekday Heatmap
 *
 * A GitHub punch card style heatmap showing activity distribution by weekday (rows) and hour (columns).
 * Renders a 7 × 24 grid with optional extra row (aggregated per hour) and extra column (aggregated per weekday).
 *
 * @example
 * ```tsx
 * <WeekdayHeatmap data={data} weekStart={1} use12Hour>
 *   <WeekdayHeatmapBody>
 *     {({ activity }) => (
 *       <WeekdayHeatmapBlock activity={activity} />
 *     )}
 *   </WeekdayHeatmapBody>
 *   <WeekdayHeatmapFooter>
 *     <WeekdayHeatmapStat />
 *     <WeekdayHeatmapLegend />
 *   </WeekdayHeatmapFooter>
 * </WeekdayHeatmap>
 * ```
 *
 * @param data - Array of activities with weekday (0-6 for Sun-Sat), hour (0-23), and numeric value
 * @param weekStart - First day of week (0=Sunday, 1=Monday). Default: 0
 * @param use12Hour - Use 12-hour format for hour labels. Default: false
 * @param blockSize - Block height in pixels. Default: 24
 * @param blockAspectRatio - Block width/height ratio. Default: 1 (square)
 * @param levels - Total number of legend cells (including empty when not normalized). Default: 5
 * @param isNormalized - When true, uses min-max normalization across the dataset (suitable for signed values like temperature). When false (default), treats 0 as empty and scales from 0 to max.
 * @param extraRow - Appends an aggregated row below the grid. `compute` receives all activities and must return 24 values (one per hour). Rendered through `renderExtraRow` on the body, or falls back to `children`.
 * @param extraColumn - Appends an aggregated column to the right of the grid. `compute` receives all activities and must return 7 values indexed by weekday 0–6. Rendered through `renderExtraColumn` on the body, or falls back to `children`.
 */
export const WeekdayHeatmap = ({
  data,
  weekStart = 0,
  hours = HOURS,
  weekdays: displayedWeekdays,
  use12Hour = false,
  blockSize: blockSizeProp,
  blockMargin = 4,
  blockRadius = 2,
  blockAspectRatio = 1,
  levels: levelsProp = 5,
  isNormalized = false,
  colors,
  locale,
  labels: labelsProp,
  fontSize = 14,
  emptyState,
  totalCount: totalCountProp,
  extraRow,
  extraColumn,
  style = EMPTY_STYLE,
  className,
  children,
  ...props
}: WeekdayHeatmapProps) => {
  const levels = Math.max(1, levelsProp);
  const [rootRef, rootWidth] = useElementWidth<HTMLDivElement>();
  const weekdays = useMemo(() => displayedWeekdays ?? Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7), [displayedWeekdays, weekStart]);

  const dataWithLevels = useMemo((): WeekdayHourlyActivityWithLevel[] => {
    if (data.length === 0) return [];

    const maxRegular = data.reduce((m, d) => Math.max(m, d.value), 1);
    const minRegular = isNormalized
      ? data.reduce((m, d) => Math.min(m, d.value), Infinity)
      : 0;

    return data.map((activity) => ({
      ...activity,
      level: calculateLevel(
        activity.value,
        minRegular,
        maxRegular,
        levels,
        isNormalized,
      ),
    }));
  }, [data, levels, isNormalized]);

  const resolvedExtraRow = useMemo<ResolvedExtraRow | null>(() => {
    if (!extraRow) return null;
    const values = extraRow.compute(data);
    const maxVal = values.reduce((m, v) => Math.max(m, v), 1);
    const minVal = isNormalized
      ? values.reduce((m, v) => Math.min(m, v), Infinity)
      : 0;
    return {
      label: extraRow.label,
      values: values.map((value, hour) => ({
        hour,
        value,
        level: calculateLevel(value, minVal, maxVal, levels, isNormalized),
      })),
    };
  }, [extraRow, data, levels, isNormalized]);

  const resolvedExtraColumn = useMemo<ResolvedExtraColumn | null>(() => {
    if (!extraColumn) return null;
    const values = extraColumn.compute(data);
    const maxVal = values.reduce((m, v) => Math.max(m, v), 1);
    const minVal = isNormalized
      ? values.reduce((m, v) => Math.min(m, v), Infinity)
      : 0;
    return {
      label: extraColumn.label,
      values: values.map((value, weekday) => ({
        weekday,
        value,
        level: calculateLevel(value, minVal, maxVal, levels, isNormalized),
      })),
    };
  }, [extraColumn, data, levels, isNormalized]);

  const labels = useMemo<WeekdayHeatmapLabels>(() => {
    const weekdayLabels = locale
      ? generateWeekdayLabels(locale)
      : DEFAULT_WEEKDAY_LABELS;

    return {
      hours: use12Hour ? TWELVE_HOUR_LABELS : DEFAULT_HOUR_LABELS,
      endHour: hours.at(-1) === 23 ? (use12Hour ? "12" : "00") : (use12Hour ? TWELVE_HOUR_LABELS : DEFAULT_HOUR_LABELS)[(hours.at(-1) ?? -1) + 1],
      weekdays: weekdayLabels,
      cellLabel: "{{weekday}} {{hour}}: {{value}}",
      heatmapLabel: "Activity heatmap by weekday and hour",
      legendLabel: "Activity intensity legend",
      legendLevelLabel: "{{level}} contributions",
      ...labelsProp,
    };
  }, [locale, use12Hour, labelsProp, hours]);

  const labelWidth = fontSize * 3.5 + LABEL_MARGIN;

  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : dataWithLevels.reduce((sum, a) => sum + a.value, 0);

  const hasExtraColumn = resolvedExtraColumn !== null;
  // Solves the body's width for the cell width: n cells and their gaps, plus
  // two more and half a cell for an extra column.
  const columns = hours.length + (hasExtraColumn ? 2 : 0);
  const room =
    rootWidth -
    PADDING * 2 -
    labelWidth -
    columns * blockMargin +
    (hasExtraColumn ? 0 : blockMargin);
  const fitted =
    room / (columns + (hasExtraColumn ? 1 / (2 * blockAspectRatio) : 0));
  const blockSize =
    blockSizeProp ??
    (rootWidth > 0
      ? Math.min(MAX_FITTED_BLOCK, Math.max(MIN_FITTED_BLOCK, fitted)) /
        blockAspectRatio
      : DEFAULT_BLOCK);
  const blockWidth = blockSize * blockAspectRatio;
  const labelHeight = fontSize + LABEL_MARGIN;
  const hasExtraRow = resolvedExtraRow !== null;
  const width =
    hours.length * (blockWidth + blockMargin) +
    (hasExtraColumn ? blockSize / 2 + (blockWidth + blockMargin) * 2 : 0) -
    blockMargin +
    labelWidth;
  const rowCount = weekdays.length + (hasExtraRow ? 1 : 0);
  const extraRowGap = hasExtraRow ? blockSize + blockMargin : 0;
  const height =
    rowCount * (blockSize + blockMargin) +
    extraRowGap -
    blockMargin +
    labelHeight;

  const contextValue = useMemo<WeekdayHeatmapContextType>(
    () => ({
      data: dataWithLevels,
      extraRow: resolvedExtraRow,
      extraColumn: resolvedExtraColumn,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      labelWidth,
      labelHeight,
      levels,
      isNormalized,
      totalCount,
      width,
      height,
      weekStart,
      hours,
      weekdays,
      colors,
    }),
    [
      dataWithLevels,
      resolvedExtraRow,
      resolvedExtraColumn,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      labelWidth,
      labelHeight,
      levels,
      isNormalized,
      totalCount,
      width,
      height,
      weekStart,
      hours,
      weekdays,
      colors,
    ],
  );

  if (data.length === 0) {
    return emptyState ? emptyState : null;
  }

  return (
    <WeekdayHeatmapContext value={contextValue}>
      <div
        ref={rootRef}
        data-slot="weekday-heatmap"
        className={cn(
          "flex flex-col gap-2",
          blockSizeProp === undefined ? "w-full" : "w-max max-w-full",
          className,
        )}
        style={{ fontSize, ...style }}
        {...props}
      >
        {children}
      </div>
    </WeekdayHeatmapContext>
  );
};

export type WeekdayHeatmapBlockProps = HTMLAttributes<SVGRectElement> & {
  /** The cell the page has picked: drawn with a ring and announced as pressed. */
  selected?: boolean | undefined;
  activity: WeekdayHourlyActivityWithLevel;
  extra?: "row" | "column" | undefined;
  highlighted?: boolean | undefined;
  onCellClick?: ((activity: WeekdayHourlyActivityWithLevel) => void) | undefined;
  onCellHover?: ((activity: WeekdayHourlyActivityWithLevel | null) => void) | undefined;
  className?: string | undefined;
};

export const WeekdayHeatmapBlock = ({
  ref,
  activity,
  extra,
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
}: WeekdayHeatmapBlockProps & {
  ref?: React.RefObject<SVGRectElement | null> | undefined;
}) => {
  const {
    blockSize,
    blockWidth,
    blockMargin,
    blockRadius,
    labelWidth,
    labelHeight,
    levels,
    isNormalized,
    hours,
    weekdays,
    labels,
    colors,
  } = useWeekdayHeatmap();

  const level = Math.max(
    0,
    Math.min(colorStepCount(levels, isNormalized), activity.level),
  );

  const isExtraRow = extra === "row";
  const isExtraColumn = extra === "column";

  const rowIndex = isExtraRow ? weekdays.length : weekdays.findIndex(day => day === activity.weekday);
  const hourIndex = isExtraColumn ? hours.length : hours.findIndex(hour => hour === activity.hour);
  if (rowIndex < 0 || hourIndex < 0) return null;
  const extraRowGap = isExtraRow ? blockSize + blockMargin : 0;
  const yPosition =
    labelHeight + (blockSize + blockMargin) * rowIndex + extraRowGap;

  const extraColumnGap = isExtraColumn ? blockWidth + blockMargin : 0;
  const xPosition = isExtraColumn
    ? labelWidth +
      hours.length * (blockWidth + blockMargin) +
      blockSize / 2 +
      extraColumnGap
    : labelWidth + (blockWidth + blockMargin) * hourIndex;

  const weekdayToken = isExtraRow
    ? "extra"
    : (labels.weekdays?.[activity.weekday] ?? String(activity.weekday));
  const hourToken = isExtraColumn
    ? "extra"
    : `${String(activity.hour).padStart(2, "0")}:00`;
  const ariaLabel = (labels.cellLabel ?? "{{weekday}} {{hour}}: {{value}}")
    .replace("{{weekday}}", weekdayToken)
    .replace("{{hour}}", hourToken)
    .replace("{{value}}", String(activity.value));

  return (
    <rect
      ref={ref}
      data-slot="weekday-heatmap-block"
      role={onCellClick ? "button" : "img"}
      aria-pressed={onCellClick ? selected : undefined}
      tabIndex={onCellClick ? 0 : -1}
      aria-label={ariaLabel}
      className={cn(
        "hover:stroke-foreground hover:stroke-1",
        highlighted && "stroke-foreground stroke-1",
        // The picked cell carries a ring in the text colour, as a Treemap tile does; the fill keeps its level.
        selected && "stroke-foreground stroke-2 hover:stroke-2",
        onCellClick &&
          "cursor-pointer",
        className,
      )}
      data-value={activity.value}
      data-weekday={isExtraRow ? "extra" : activity.weekday}
      data-hour={isExtraColumn ? "extra" : activity.hour}
      data-level={level}
      data-highlighted={highlighted || undefined}
      data-selected={selected || undefined}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockWidth}
      x={xPosition}
      y={yPosition}
      style={{
        fill: getLevelFill(level, levels, isNormalized, colors),
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
WeekdayHeatmapBlock.displayName = "WeekdayHeatmapBlock";

export type WeekdayHeatmapBodyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideHourLabels?: boolean | undefined;
  hideWeekdayLabels?: boolean | undefined;
  className?: string | undefined;
  labelClassName?: string | undefined;
  children: (props: {
    activity: WeekdayHourlyActivityWithLevel;
    weekdayIndex: number;
  }) => ReactNode;
  renderExtraRow?: ((props: {
    activity: WeekdayHourlyActivityWithLevel;
    weekdayIndex: number;
  }) => ReactNode) | undefined;
  renderExtraColumn?: ((props: {
    activity: WeekdayHourlyActivityWithLevel;
    weekdayIndex: number;
  }) => ReactNode) | undefined;
};

export const WeekdayHeatmapBody = ({
  hideHourLabels = false,
  hideWeekdayLabels = false,
  className,
  labelClassName,
  children,
  renderExtraRow,
  renderExtraColumn,
  ...props
}: WeekdayHeatmapBodyProps) => {
  const navigation = useHeatmapNavigation();
  const {
    data,
    extraRow,
    extraColumn,
    blockSize,
    blockWidth,
    blockMargin,
    labels,
    labelWidth,
    labelHeight,
    fontSize,
    hours,
    weekdays,
  } = useWeekdayHeatmap();

  const hasExtraRow = extraRow !== null;
  const hasExtraColumn = extraColumn !== null;

  const activityMap = useMemo(() => {
    const map = new Map<string, WeekdayHourlyActivityWithLevel>();
    data.forEach((activity) => {
      map.set(`${activity.weekday}-${activity.hour}`, activity);
    });
    return map;
  }, [data]);

  const extraColumnMap = useMemo(() => {
    if (!extraColumn) return null;
    const map = new Map<
      number,
      { weekday: number; value: number; level: number }
    >();
    extraColumn.values.forEach((v) => {
      map.set(v.weekday, v);
    });
    return map;
  }, [extraColumn]);

  const regularActivities = useMemo(() => {
    const activities: {
      activity: WeekdayHourlyActivityWithLevel;
      weekdayIndex: number;
    }[] = [];
    for (const [di, weekday] of weekdays.entries()) {
      for (const hour of hours) {
        activities.push({
          activity: activityMap.get(`${weekday}-${hour}`) ?? {
            weekday,
            hour,
            value: 0,
            level: 0,
          },
          weekdayIndex: di,
        });
      }
    }
    return activities;
  }, [activityMap, weekdays, hours]);

  const extraColumnActivities = useMemo(() => {
    if (!extraColumnMap) return [];
    return weekdays.map((weekday, di) => {
      const entry = extraColumnMap.get(weekday);
      return entry
        ? {
            activity: {
              weekday,
              hour: 0,
              value: entry.value,
              level: entry.level,
            },
            weekdayIndex: di,
          }
        : null;
    }).filter(
      (
        a,
      ): a is {
        activity: WeekdayHourlyActivityWithLevel;
        weekdayIndex: number;
      } => a !== null,
    );
  }, [extraColumnMap, weekdays]);

  const extraRowActivities = useMemo(() => {
    if (!extraRow) return [];
    return extraRow.values.filter(({ hour }) => hours.includes(hour)).map(({ hour, value, level }) => ({
      activity: { weekday: 0, hour, value, level },
      weekdayIndex: weekdays.length,
    }));
  }, [extraRow, hours, weekdays.length]);

  const rowCount = weekdays.length + (hasExtraRow ? 1 : 0);
  const extraRowGap = hasExtraRow ? blockSize + blockMargin : 0;
  const svgHeight =
    rowCount * (blockSize + blockMargin) +
    extraRowGap -
    blockMargin +
    labelHeight;
  const extraColumnGap = hasExtraColumn ? blockWidth + blockMargin : 0;
  const svgWidth = hasExtraColumn
    ? labelWidth +
      hours.length * (blockWidth + blockMargin) +
      blockSize / 2 +
      (blockWidth + blockMargin) +
      extraColumnGap
    : labelWidth + hours.length * (blockWidth + blockMargin) - blockMargin;

  const orderedWeekdayIndices = weekdays;

  return (
    <div
      data-slot="weekday-heatmap-body"
      ref={navigation.ref}
      className={cn("max-w-full overflow-x-auto overflow-y-hidden", className)}
      {...props}
      onKeyDown={(event) => { props.onKeyDown?.(event); if (!event.defaultPrevented) navigation.onKeyDown(event); }}
    >
      <svg
        role="img"
        aria-label={
          labels.heatmapLabel ?? "Activity heatmap by weekday and hour"
        }
        className="block overflow-visible rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        height={svgHeight + PADDING * 2}
        viewBox={`${-PADDING} ${-PADDING} ${svgWidth + PADDING * 2} ${svgHeight + PADDING * 2}`}
        width={svgWidth + PADDING * 2}
      >
        {!hideHourLabels && (
          <g className={cn("fill-current font-mono", labelClassName)}>
            {hours.map((hour, index) => {
              const label = labels.hours?.[hour] ?? "";
              return (
                <text
                  key={`hour-${hour}`}
                  x={labelWidth + (blockWidth + blockMargin) * index}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  style={{ fontSize: `${fontSize * 0.75}px` }}
                >
                  {label}
                </text>
              );
            })}
            {labels.endHour != null && (
              <text
                key="hour-end"
                x={labelWidth + (blockWidth + blockMargin) * hours.length}
                y={0}
                textAnchor="middle"
                dominantBaseline="hanging"
                style={{ fontSize: `${fontSize * 0.75}px` }}
              >
                {labels.endHour}
              </text>
            )}
            {hasExtraColumn && (
              <text
                key="extra-col-label"
                x={
                  labelWidth +
                  hours.length * (blockWidth + blockMargin) +
                  blockSize / 2 +
                  (blockWidth + blockMargin) +
                  blockWidth / 2
                }
                y={0}
                textAnchor="middle"
                dominantBaseline="hanging"
                style={{ fontSize: `${fontSize * 0.75}px` }}
              >
                {extraColumn?.label}
              </text>
            )}
          </g>
        )}

        {!hideWeekdayLabels && (
          <g className={cn("fill-current font-mono", labelClassName)}>
            {orderedWeekdayIndices.map((weekday, displayIndex) => {
              const label = labels.weekdays?.[weekday] ?? "";
              const yPosition =
                labelHeight +
                (blockSize + blockMargin) * displayIndex +
                blockSize / 2;
              return (
                <text
                  key={`weekday-${weekday}`}
                  x={labelWidth - 8}
                  y={yPosition}
                  dominantBaseline="middle"
                  textAnchor="end"
                  style={{ fontSize: `${fontSize * 0.75}px` }}
                >
                  {label}
                </text>
              );
            })}
            {hasExtraRow && (
              <text
                key="weekday-extra"
                x={labelWidth - 8}
                y={
                  labelHeight +
                  (blockSize + blockMargin) * weekdays.length +
                  (blockSize + blockMargin) +
                  blockSize / 2
                }
                dominantBaseline="middle"
                textAnchor="end"
                style={{ fontSize: `${fontSize * 0.75}px` }}
              >
                {extraRow?.label}
              </text>
            )}
          </g>
        )}

        {regularActivities.map(({ activity, weekdayIndex }) => (
          <Fragment key={`${activity.weekday}-${activity.hour}`}>
            {children({ activity, weekdayIndex })}
          </Fragment>
        ))}
        {extraColumnActivities.map(({ activity, weekdayIndex }) => (
          <Fragment key={`extra-column-${activity.weekday}`}>
            {(renderExtraColumn ?? children)({ activity, weekdayIndex })}
          </Fragment>
        ))}
        {extraRowActivities.map(({ activity, weekdayIndex }) => (
          <Fragment key={`extra-row-${activity.hour}`}>
            {(renderExtraRow ?? children)({ activity, weekdayIndex })}
          </Fragment>
        ))}
      </svg>
    </div>
  );
};

export type WeekdayHeatmapFooterProps = HTMLAttributes<HTMLDivElement>;

export const WeekdayHeatmapFooter = ({
  className,
  ...props
}: WeekdayHeatmapFooterProps) => (
  <div
    data-slot="weekday-heatmap-footer"
    className={cn(
      "flex flex-wrap gap-1 whitespace-nowrap sm:gap-x-4",
      className,
    )}
    {...props}
  />
);

export type WeekdayHeatmapStatProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  compute?: ((data: WeekdayHourlyActivityWithLevel[]) => number | string) | undefined;
  label?: string | undefined; // Template overriding labels.stat. Placeholder: {{value}}
  children?: ((result: {
    value: number | string;
    data: WeekdayHourlyActivityWithLevel[];
  }) => ReactNode) | undefined;
};

export const WeekdayHeatmapStat = ({
  compute,
  label,
  className,
  children,
  ...props
}: WeekdayHeatmapStatProps) => {
  const { data, totalCount, labels } = useWeekdayHeatmap();

  const value = compute ? compute(data) : totalCount;

  if (children) {
    return <>{children({ value, data })}</>;
  }

  const template = label ?? labels.stat ?? "{{value}} contributions";

  return (
    <div
      data-slot="weekday-heatmap-stat"
      className={cn("text-muted-foreground tabular-nums", className)}
      {...props}
    >
      {template.replace("{{value}}", String(value))}
    </div>
  );
};

export type WeekdayHeatmapLegendProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  "children"
> & {
  labels?: { less?: string | undefined; more?: string | undefined } | undefined;
  children?: ((props: { level: number }) => ReactNode) | undefined;
};

export const WeekdayHeatmapLegend = ({
  labels: labelsProp,
  className,
  children,
  ...props
}: WeekdayHeatmapLegendProps) => {
  const {
    levels,
    isNormalized,
    blockRadius,
    colors,
    labels,
  } = useWeekdayHeatmap();

  const lessLabel = labelsProp?.less ?? "Less";
  const moreLabel = labelsProp?.more ?? "More";

  const legendLevels = Array.from({ length: levels }, (_, i) =>
    isNormalized ? i + 1 : i,
  );

  return (
    <fieldset
      data-slot="weekday-heatmap-legend"
      aria-label={labels.legendLabel ?? "Activity intensity legend"}
      className={cn(
        "ml-auto flex items-center gap-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className="mr-1 font-medium text-xs">{lessLabel}</span>
      {legendLevels.map((level) =>
        children ? (
          <Fragment key={`legend-level-${level}`}>
            {children({ level })}
          </Fragment>
        ) : (
          <svg
            role="img"
            aria-label={(
              labels.legendLevelLabel ?? "{{level}} contributions"
            ).replace("{{level}}", String(level))}
            height={LEGEND_SWATCH}
            key={`legend-level-${level}`}
            width={LEGEND_SWATCH}
          >
            <rect
              data-level={level}
              height={LEGEND_SWATCH}
              rx={blockRadius}
              ry={blockRadius}
              width={LEGEND_SWATCH}
              style={{
                fill: getLevelFill(level, levels, isNormalized, colors),
              }}
            />
          </svg>
        ),
      )}
      <span className="ml-1 font-medium text-xs">{moreLabel}</span>
    </fieldset>
  );
};
