import { Button, PageHeader } from "@siyahi/ui";
import { ArrowRightIcon } from "lucide-react";

// The catalogue's own ink drop, painted with currentColor so the header tints it.
function InkDrop() {
  return (
    <svg viewBox="0 0 16 16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 .5C8 .5 2.5 6.3 2.5 10a5.5 5.5 0 0 0 11 0C13.5 6.3 8 .5 8 .5ZM4.75 10A3.25 3.25 0 0 0 8 13.25v-1.5A1.75 1.75 0 0 1 6.25 10Z"
      />
    </svg>
  );
}

export default function PageHeaderExample() {
  return (
    <PageHeader
      eyebrow="@siyahi/ui"
      title="Siyahi"
      lead="Ink for numbers. A design system for pages people read figures from: dashboards, ledgers, reports."
      detail="Stock shadcn/ui on Base UI and Tailwind v4, with a theme for figures, charts and tables that fit a phone, Indian-aware formatters and a lint. Siyahi is Hindi for ink."
      actions={
        <>
          <Button nativeButton={false} render={<a href="#/data" />}>
            Browse the data components
            <ArrowRightIcon />
          </Button>
          <Button variant="outline" nativeButton={false} render={<a href="#/overview/install" />}>
            Install
          </Button>
        </>
      }
      mark={<InkDrop />}
    />
  );
}
