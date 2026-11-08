import { useId, useState, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@siyahi/ui/components/ui/toggle-group";
import type { AxisScale } from "@siyahi/ui/lib/ticks";

export interface ScaleToggleProps {
  /** The group's accessible name, such as "Share of book scale". */
  label: string;
  value: AxisScale;
  onValueChange: (scale: AxisScale) => void;
  /** Why log cannot draw this data, such as a value at or below zero; Log is then disabled and this says why. */
  logBlocked?: string;
}

/** Linear and Log buttons for one chart axis, in the header's toggle style. */
export function ScaleToggle({ label, value, onValueChange, logBlocked }: ScaleToggleProps) {
  const reason = useId();
  return (
    // A disabled button takes no pointer events, so the title sits on its wrapper for a mouse to find.
    <span data-slot="scale-toggle" className="inline-flex" title={logBlocked}>
      <ToggleGroup
        value={[value]}
        // Pressing the selected scale again would leave none selected; keep it.
        onValueChange={([next]) => next && onValueChange(next === "log" ? "log" : "linear")}
        variant="outline"
        size="sm"
        aria-label={label}
        aria-describedby={logBlocked ? reason : undefined}
      >
        <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
        <ToggleGroupItem value="log" disabled={logBlocked !== undefined}>
          Log
        </ToggleGroupItem>
      </ToggleGroup>
      {logBlocked && (
        <span id={reason} className="sr-only">
          {logBlocked}
        </span>
      )}
    </span>
  );
}

/**
 * The scale an axis draws on, and its buttons when `toggle` is set. The page's scale is the first selection; after
 * that the reader's pick holds. Log falls back to linear while `logBlocked` says why it cannot draw the data.
 */
export function useAxisScale(
  initial: AxisScale,
  toggle: boolean,
  label: string,
  logBlocked: string | undefined,
): { scale: AxisScale; buttons: ReactNode } {
  const [picked, setPicked] = useState(initial);
  const wanted = toggle ? picked : initial;
  const scale = logBlocked ? "linear" : wanted;
  const buttons = toggle ? (
    <ScaleToggle label={label} value={scale} onValueChange={setPicked} logBlocked={logBlocked} />
  ) : null;
  return { scale, buttons };
}

/** Why Log is disabled when a value is at or below zero. */
export const LOG_BLOCKED = "Log needs every value above zero";
