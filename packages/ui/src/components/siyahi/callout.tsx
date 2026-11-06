import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

const TONES = {
  neutral: "border-border bg-muted/50 [&_[data-slot=callout-icon]]:text-muted-foreground",
  accent: "border-chart-1/35 bg-chart-1/8 [&_[data-slot=callout-icon]]:text-link",
  warning: "border-warning/45 bg-warning/10 [&_[data-slot=callout-icon]]:text-warning",
  positive: "border-positive/40 bg-positive/8 [&_[data-slot=callout-icon]]:text-positive",
  negative: "border-negative/40 bg-negative/8 [&_[data-slot=callout-icon]]:text-negative",
} as const;

export interface CalloutProps extends Omit<ComponentProps<"aside">, "title"> {
  /** neutral for an aside, accent for a key point, warning for a caution, positive or negative for a gain or a loss. */
  tone?: keyof typeof TONES;
  /** A lucide icon, drawn in the tone's colour. */
  icon?: ReactNode;
  title?: ReactNode;
}

/**
 * A point set apart from the prose: a takeaway, a caveat, a definition. The whole box takes the tone, a faint wash
 * inside a border of the same colour; never a single coloured edge. For a notice that interrupts, use Alert or
 * WarningAlert instead.
 */
export function Callout({ tone = "neutral", icon, title, className, children, ...props }: CalloutProps) {
  return (
    <aside
      data-slot="callout"
      data-tone={tone}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", TONES[tone], className)}
      {...props}
    >
      {icon && (
        <span data-slot="callout-icon" aria-hidden className="mt-0.5 shrink-0 [&>svg]:size-4">
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-pretty text-muted-foreground [&_strong]:text-foreground">{children}</div>
      </div>
    </aside>
  );
}
