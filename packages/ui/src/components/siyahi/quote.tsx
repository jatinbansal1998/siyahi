import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

export interface QuoteProps extends ComponentProps<"blockquote"> {
  /** Who said it, or where it is from, set under the quote. */
  source?: ReactNode;
}

/**
 * A quotation set apart from the prose on a muted panel, with its source under it. The panel is the whole box, not a
 * stripe down one side.
 */
export function Quote({ source, className, children, ...props }: QuoteProps) {
  return (
    <figure data-slot="quote" className={cn("flex flex-col gap-2 rounded-lg bg-muted/60 px-4 py-3", className)}>
      <blockquote className="text-pretty italic" {...props}>
        {children}
      </blockquote>
      {source && <figcaption className="text-sm text-muted-foreground">{source}</figcaption>}
    </figure>
  );
}
