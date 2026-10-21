import type { ReactNode } from "react";
import { cn } from "cn";

/** Label and value pairs, such as a record's fields in a card. */
export function DataList({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn("flex flex-col gap-4", className)}>{children}</dl>;
}

export interface DataListItemProps {
  /** A short muted label; may hold a badge beside the words. */
  label: ReactNode;
  children: ReactNode;
}

export function DataListItem({ label, children }: DataListItemProps) {
  return (
    <div data-slot="data-list-item" className="flex flex-col gap-1">
      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
