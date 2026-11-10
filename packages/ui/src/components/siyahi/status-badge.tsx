import type { ComponentProps } from "react";
import { cn } from "cn";
import { Badge } from "@siyahi/ui/components/ui/badge";
import { TONES, type Tone } from "@siyahi/ui/lib/tone";

export interface StatusBadgeProps extends Omit<ComponentProps<typeof Badge>, "variant"> {
  /** positive for done or paid, warning for pending, negative for failed, accent for new, neutral for a draft. */
  tone?: Tone | undefined;
}

/**
 * A state, such as Paid, Pending or Failed: the badge takes its tone's wash and border, and a dot in the tone's
 * colour marks it. The label stays in the text colour, since small coloured text on its own wash falls under 4.5:1.
 * Categories (a team, a region) are not states: they stay outline badges.
 */
export function StatusBadge({ tone = "neutral", className, children, ...props }: StatusBadgeProps) {
  return (
    <Badge variant="outline" data-tone={tone} className={cn(TONES[tone].box, className)} {...props}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", TONES[tone].dot)} />
      {children}
    </Badge>
  );
}
