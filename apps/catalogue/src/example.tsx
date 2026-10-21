import type { ComponentType, ReactNode } from "react";
import { Code } from "./code";

const modules = import.meta.glob<{ default: ComponentType }>("./examples/*.tsx", { eager: true });
const sources = import.meta.glob<string>("./examples/*.tsx", { eager: true, query: "?raw", import: "default" });

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
  const path = `./examples/${name}.tsx`;
  const Component = modules[path]?.default;
  const source = sources[path];
  if (!Component || source === undefined) throw new Error(`no example ${path}`);
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col justify-center gap-4 rounded-lg border border-dashed p-4 md:p-6">
        <Component />
      </div>
      <Code className="max-h-96">{source}</Code>
    </div>
  );
}

/** Prose under a section title. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-muted-foreground">{children}</p>;
}
