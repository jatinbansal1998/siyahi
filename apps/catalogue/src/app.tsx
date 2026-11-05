import { Section } from "./example";
import { PageToc } from "@siyahi/ui";
import { Suspense } from "react";
import type { Page } from "./page";
import { blocks } from "./pages/blocks";
import { components, inputs } from "./pages/components";
import { data } from "./pages/data";
import { foundations } from "./pages/foundations";
import { layout } from "./pages/layout";
import { overview } from "./pages/overview";
import { reports } from "./pages/reports";
import { useRoute } from "./route";
import { CatalogueSearch } from "./search";
import { Shell } from "./shell";

const PAGES: Page[] = [overview, foundations, components, inputs, layout, data, blocks, reports];

export function App() {
  const route = useRoute();
  const page = PAGES.find((p) => p.id === route.page) ?? overview;
  const selected = page.sections.find((section) => section.id === route.section);
  const sections = selected ? [selected] : page.sections;
  const nav = PAGES.map((p) => ({
    title: p.title,
    url: `#/${p.id}`,
    icon: p.icon,
    isActive: p.id === page.id,
    items: p.sections.map((s) => ({
      title: s.title,
      url: `#/${p.id}/${s.id}`,
      isActive: p.id === page.id && s.id === selected?.id,
    })),
  }));
  return (
    <Shell nav={nav} title={page.title} actions={<CatalogueSearch pages={PAGES} />}>
      {/* The title and lead show at once; only the examples wait for their code. */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="max-w-prose text-muted-foreground">{page.lead}</p>
      </div>
      <Suspense fallback={<p role="status">Loading examples…</p>}>
        {selected ? (
          <a href={`#/${page.id}`} className="text-link">
            All {page.title} examples
          </a>
        ) : (
          page.sections.length > 2 && (
            // On wider screens the sidebar already lists these sections; the strip serves the phone, where it is a drawer.
            <PageToc items={page.sections.map(({ id, title }) => ({ id, title }))} className="top-14 md:hidden" />
          )
        )}
        {sections.map((s) => (
          <Section key={s.id} id={s.id} title={s.title}>
            {s.body}
          </Section>
        ))}
      </Suspense>
    </Shell>
  );
}
