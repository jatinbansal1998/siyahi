import type { ReactNode } from "react";

export interface StaleNoteProps {
  /** Since when the data is old, as the page writes it: "3 Nov". */
  since: ReactNode;
}

/** A small boxed mono capital note that a block's data is old: "Stale · 3 Nov". The block's own card greys out. */
export function StaleNote({ since }: StaleNoteProps) {
  return (
    <span
      data-slot="stale-note"
      className="w-fit border px-1.5 py-px font-mono text-2xs tracking-wider whitespace-nowrap text-muted-foreground uppercase"
    >
      Stale · {since}
    </span>
  );
}
