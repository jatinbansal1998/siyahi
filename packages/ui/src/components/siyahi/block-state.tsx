import type { ReactNode } from "react";
import { cn } from "cn";
import { CircleAlertIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@siyahi/ui/components/ui/empty";
import { TONES } from "@siyahi/ui/lib/tone";

export interface BlockStateProps {
  /** What happened: "No holding matches the search", "Prices failed to load". */
  title: ReactNode;
  /** Why, and what the reader can do: "The broker did not answer. Retry in a minute." */
  description?: ReactNode | undefined;
  /** The button that does it: "Reset filters", "Retry". */
  action?: ReactNode | undefined;
  /** negative for an error, which washes the box red; neutral, the default, for a block with nothing to show. */
  tone?: "neutral" | "negative" | undefined;
}

/**
 * What a chart, table or list shows in place of its data when it has none or the data failed to load. It goes where
 * the data would: a chart card's `placeholder`, inside `DataTableEmptyBody`, or in place of a list.
 */
export function BlockState({ title, description, action, tone = "neutral" }: BlockStateProps) {
  const error = tone === "negative";
  return (
    <Empty
      data-slot="block-state"
      data-tone={tone}
      role={error ? "alert" : undefined}
      // Empty dashes the border it would draw; an error's box takes the solid edge every tinted box has.
      className={cn("gap-3 p-4", error && cn("border border-solid", TONES.negative.box))}
    >
      <EmptyHeader className="gap-1">
        {error && (
          <EmptyMedia className="mb-1">
            <CircleAlertIcon className={cn("size-4", TONES.negative.ink)} />
          </EmptyMedia>
        )}
        <EmptyTitle className="text-foreground">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
