import { Section } from "./example";
import type { Page } from "./page";
import { blocks } from "./pages/blocks";
import { components, inputs } from "./pages/components";
import { data } from "./pages/data";
import { foundations } from "./pages/foundations";
import { layout } from "./pages/layout";
import { overview } from "./pages/overview";
import { reports } from "./pages/reports";
import { useRoute } from "./route";
import { Shell } from "./shell";

const PAGES: Page[] = [overview, foundations, components, inputs, layout, data, blocks, reports];

export function App() {
  const route = useRoute();
  const page = PAGES.find((p) => p.id === route.page) ?? overview;
  const nav = PAGES.map((p) => ({
    title: p.title,
    url: `#/${p.id}`,
    isActive: p.id === page.id,
    items: p.sections.map((s) => ({ title: s.title, url: `#/${p.id}/${s.id}` })),
  }));
  return (
    <Shell nav={nav} title={page.title}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="max-w-prose text-muted-foreground">{page.lead}</p>
      </div>
      {page.sections.map((s) => (
        <Section key={s.id} id={s.id} title={s.title}>
          {s.body}
        </Section>
      ))}
    </Shell>
  );
}
