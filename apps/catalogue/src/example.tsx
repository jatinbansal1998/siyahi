import { lazy, Suspense, useState, type ComponentType, type ReactNode } from "react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Skeleton } from "@siyahi/ui";
import { Code } from "./code";

const modules = import.meta.glob<{ default: ComponentType }>("./examples/*.tsx");
const sources = import.meta.glob<string>("./examples/*.tsx", { query: "?raw", import: "default" });
const examples = Object.fromEntries(Object.entries(modules).map(([path, load]) => [path, lazy(load)]));
const code = Object.fromEntries(
  Object.entries(sources).map(([path, load]) => [
    path,
    lazy(async () => {
      const source = await load();
      return { default: () => <Code className="max-h-96">{source}</Code> };
    }),
  ]),
);

export interface SectionProps {
  id: string;
  title: string;
  children?: ReactNode;
}

/** A titled part of a page; its id is the `#/<page>/<id>` anchor. */
export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

/** Renders `examples/<name>.tsx` live with its own source beside it. */
export function Example({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const path = `./examples/${name}.tsx`;
  const Component = examples[path];
  const Source = code[path];
  if (!Component || !Source) throw new Error(`no example ${path}`);
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-slot="example" className="flex min-w-0 flex-col gap-2">
      <CollapsibleTrigger render={<Button variant="outline" size="sm" className="self-end" />}>
        {open ? "Hide source" : "Show source"}
      </CollapsibleTrigger>
      <div data-open={open || undefined} className="grid min-w-0 items-start gap-4 data-open:xl:grid-cols-2">
        <div
          data-slot="example-preview"
          className="flex min-w-0 flex-col gap-4 rounded-lg border border-dashed p-4 md:p-6"
        >
          <Component />
        </div>
        <CollapsibleContent>
          {open && (
            <Suspense fallback={<Skeleton className="h-96" />}>
              <Source />
            </Suspense>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** Prose under a section title. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-muted-foreground">{children}</p>;
}
