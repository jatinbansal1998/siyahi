import type { ReactNode } from "react";

/** A command, file name or identifier inside prose, in Geist Mono on a muted chip, at the size of the text around it. */
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-sm bg-muted px-1 font-mono">{children}</code>;
}
