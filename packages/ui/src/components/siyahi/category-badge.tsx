import type { ComponentProps } from "react";
import { Badge } from "@siyahi/ui/components/ui/badge";
import { cn } from "cn";

const HUES = {
  1: "bg-badge-1 text-badge-1-foreground",
  2: "bg-badge-2 text-badge-2-foreground",
  3: "bg-badge-3 text-badge-3-foreground",
  4: "bg-badge-4 text-badge-4-foreground",
  5: "bg-badge-5 text-badge-5-foreground",
} as const;

export interface CategoryBadgeProps extends Omit<ComponentProps<typeof Badge>, "variant"> {
  /** Chart slot the badge is tinted from: 1 is --chart-1. Give each category of a column its own slot, in order. */
  hue: keyof typeof HUES;
}

/** A Badge tinted from a chart hue, for a category such as a sector or a broker. */
export function CategoryBadge({ hue, className, ...props }: CategoryBadgeProps) {
  return <Badge variant="secondary" className={cn(HUES[hue], className)} {...props} />;
}
