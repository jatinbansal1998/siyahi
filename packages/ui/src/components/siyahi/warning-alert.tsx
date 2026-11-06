import type { ComponentProps } from "react";
import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";
import { Alert } from "@siyahi/ui/components/ui/alert";

/**
 * An Alert for a caution the reader must not miss, such as withdrawn results or incomplete data: the whole card
 * takes a faint amber wash inside an amber border, with the warning triangle. Never mark a warning with a single
 * coloured edge; the tint is the card. Put an AlertTitle and an AlertDescription inside.
 */
export function WarningAlert({ className, children, ...props }: ComponentProps<typeof Alert>) {
  return (
    <Alert
      data-tone="warning"
      // Alert sets its icon to the text colour with a stronger selector; the ! keeps the triangle amber.
      className={cn("gap-x-3 border-warning/45 bg-warning/10 px-4 py-3 [&>svg]:text-warning!", className)}
      {...props}
    >
      <TriangleAlertIcon />
      {children}
    </Alert>
  );
}
