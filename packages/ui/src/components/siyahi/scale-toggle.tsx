import { useId, useState, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@siyahi/ui/components/ui/toggle-group";
import type { AxisScale } from "@siyahi/ui/lib/ticks";

/** Why Log is disabled when a value is at or below zero. */
export const LOG_BLOCKED = "Log needs every value above zero";

export interface ScaleToggleProps {
  /** The group's accessible name, such as "Share of book scale". */
  label: string;
  /** The axis' name shown before the buttons, for a card with a toggle on each axis. */
  caption?: string | undefined;
  value: AxisScale;
  onValueChange: (scale: AxisScale) => void;
  /** Why log cannot draw this data, such as a value at or below zero: Log is disabled and this shows beside it. */
  logBlocked?: string | undefined;
}

/** Linear and Log buttons for one chart axis, in the header's toggle style. */
export function ScaleToggle({ label, caption, value, onValueChange, logBlocked }: ScaleToggleProps) {
  const reason = useId();
  return (
    <div data-slot="scale-toggle" className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      <ToggleGroup
        value={[value]}
        // Pressing the selected scale again would leave none selected; keep it.
        onValueChange={([next]) => next && onValueChange(next === "log" ? "log" : "linear")}
        variant="outline"
        size="sm"
        // Joined into one segmented pair, so it reads apart from a range toggle beside it.
        spacing={0}
        aria-label={label}
        aria-describedby={logBlocked ? reason : undefined}
      >
        <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
        <ToggleGroupItem value="log" disabled={logBlocked !== undefined}>
          Log
        </ToggleGroupItem>
      </ToggleGroup>
      {/* In view, not a hover title: a phone has no hover, and a disabled button takes no tap. */}
      {logBlocked && (
        <span id={reason} className="text-xs text-muted-foreground">
          {logBlocked}
        </span>
      )}
    </div>
  );
}

export interface AxisScaleOptions extends Omit<ScaleToggleProps, "value" | "onValueChange"> {
  /** The page's scale: the first selection. */
  initial: AxisScale;
  /** Show the buttons. */
  toggle: boolean;
}

/**
 * The scale an axis draws on, and its buttons when `toggle` is set. The page's scale is the first selection; after
 * that the reader's pick holds. Log falls back to linear while `logBlocked` says why it cannot draw the data.
 */
export function useAxisScale({ initial, toggle, ...buttons }: AxisScaleOptions): {
  scale: AxisScale;
  buttons: ReactNode;
} {
  const [picked, setPicked] = useState(initial);
  const wanted = toggle ? picked : initial;
  const scale = buttons.logBlocked ? "linear" : wanted;
  return {
    scale,
    buttons: toggle ? <ScaleToggle {...buttons} value={scale} onValueChange={setPicked} /> : null,
  };
}
