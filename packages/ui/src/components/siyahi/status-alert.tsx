import type { ComponentProps } from "react";
import { cn } from "cn";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import { Alert } from "@siyahi/ui/components/ui/alert";
import { TONES, type Tone } from "@siyahi/ui/lib/tone";

const ICONS = {
  neutral: InfoIcon,
  accent: LightbulbIcon,
  warning: TriangleAlertIcon,
  positive: CircleCheckIcon,
  negative: CircleAlertIcon,
} as const;

export interface StatusAlertProps extends Omit<ComponentProps<typeof Alert>, "variant"> {
  /** neutral for information, warning for a caution, negative for an error, positive for a success. */
  tone?: Tone | undefined;
}

/**
 * A notice the reader must not miss: the whole card takes its tone, a faint wash inside a border of the same colour,
 * with the tone's icon. Title and description stay in the text colours so they read on the wash. Never mark a notice
 * with a single coloured edge. Put an AlertTitle and an AlertDescription inside.
 */
export function StatusAlert({ tone = "neutral", className, children, ...props }: StatusAlertProps) {
  const Icon = ICONS[tone];
  return (
    <Alert data-tone={tone} className={cn("gap-x-3 px-4 py-3", TONES[tone].box, className)} {...props}>
      {/* Alert colours its icons with a selector that outranks a plain text class; the tone's ink carries a !. */}
      <Icon className={TONES[tone].ink} />
      {children}
    </Alert>
  );
}
