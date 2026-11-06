import { FamilyIndex, FamilyView, Section } from "./example";
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

function PageBody({ page }: { page: Page }) {
  if (page.layout === "index") return <FamilyIndex page={page} />;
  return (
    <>
      {page.families.length > 2 && (
        // On wider screens the sidebar already lists these sections; the strip serves the phone, where it is a drawer.
        <PageToc items={page.families.map(({ id, title }) => ({ id, title }))} className="top-14 md:hidden" />
      )}
      {page.families.map((family) => (
        <Section key={family.id} family={family} />
      ))}
    </>
  );
}

export function App() {
  const route = useRoute();
  const page = PAGES.find((p) => p.id === route.page) ?? overview;
  const family = page.families.find((f) => f.id === route.section);
  const nav = PAGES.map((p) => ({
    title: p.title,
    url: `#/${p.id}`,
    icon: p.icon,
    isActive: p.id === page.id,
    items: p.families.map((f) => ({
      title: f.title,
      url: `#/${p.id}/${f.id}`,
      isActive: p.id === page.id && f.id === family?.id,
    })),
  }));
  const trail = [{ title: page.title, href: `#/${page.id}` }];
  if (family) trail.push({ title: family.title, href: `#/${page.id}/${family.id}` });
  const { title, lead } = family ?? page;
  return (
    <Shell nav={nav} trail={trail} actions={<CatalogueSearch pages={PAGES} />}>
      {/* The title and lead show at once; only the examples wait for their code. */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-prose text-muted-foreground">{lead}</p>
      </div>
      <Suspense fallback={<p role="status">Loading examples…</p>}>
        {family ? <FamilyView page={page} family={family} /> : <PageBody page={page} />}
      </Suspense>
    </Shell>
  );
}
