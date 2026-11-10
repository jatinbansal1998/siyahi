import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { TONES, type Tone } from "@siyahi/ui/lib/tone";

export interface CalloutProps extends Omit<ComponentProps<"aside">, "title"> {
  /** neutral for an aside, accent for a key point, warning for a caution, positive or negative for a gain or a loss. */
  tone?: Tone | undefined;
  /** A lucide icon, drawn in the tone's colour. */
  icon?: ReactNode;
  title?: ReactNode;
}

/**
 * A point set apart from the prose: a takeaway, a caveat, a definition. The whole box takes the tone, a faint wash
 * inside a border of the same colour; never a single coloured edge. For a notice that interrupts, use StatusAlert
 * instead.
 */
export function Callout({ tone = "neutral", icon, title, className, children, ...props }: CalloutProps) {
  return (
    <aside
      data-slot="callout"
      data-tone={tone}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", TONES[tone].box, className)}
      {...props}
    >
      {icon && (
        <span data-slot="callout-icon" aria-hidden className={cn("mt-0.5 shrink-0 [&>svg]:size-4", TONES[tone].ink)}>
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
