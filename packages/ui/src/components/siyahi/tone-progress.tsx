import type { ComponentProps } from "react";
import { cn } from "cn";
import { Progress } from "@siyahi/ui/components/ui/progress";

const TONE = {
  positive: "**:data-[slot=progress-indicator]:bg-positive",
  negative: "**:data-[slot=progress-indicator]:bg-negative",
} as const;

export interface ToneProgressProps extends ComponentProps<typeof Progress> {
  /** The meaning colour of the bar: a gain's share in --positive, a loss's in --negative. */
  tone: keyof typeof TONE;
}

/** shadcn's Progress with its bar in a meaning colour, such as each position's share of the booked P&L. */
export function ToneProgress({ tone, className, ...props }: ToneProgressProps) {
  return <Progress data-tone={tone} className={cn(TONE[tone], className)} {...props} />;
}
