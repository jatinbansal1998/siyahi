import { lazy, Suspense, useState, type ComponentType, type ReactNode } from "react";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@siyahi/ui";
import { ArrowLeftIcon, ArrowRightIcon, CodeIcon } from "lucide-react";
import { Code } from "./code";
import type { ExampleSpec, Family, Page, PropRow } from "./page";

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

/** Renders `examples/<name>.tsx` live, under its caption, with its own source a click away. */
function Example({ name, caption, compact = false }: ExampleSpec) {
  const [open, setOpen] = useState(false);
  const path = `./examples/${name}.tsx`;
  const Component = examples[path];
  const Source = code[path];
  if (!Component || !Source) throw new Error(`no example ${path}`);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-slot="example"
      // A small control in a page-wide frame sits in a field of empty fill; the frame widens once the source opens beside it.
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card ${compact && !open ? "lg:max-w-2xl" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm">{caption}</span>
          <code className="truncate font-mono text-xs text-muted-foreground">examples/{name}.tsx</code>
        </div>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
          <CodeIcon />
          {open ? "Hide source" : "Show source"}
        </CollapsibleTrigger>
      </div>
      <div data-open={open || undefined} className="grid min-w-0 items-start data-open:xl:grid-cols-2">
        <div data-slot="example-preview" className="flex min-w-0 flex-col gap-4 bg-muted/40 p-4 md:p-6">
          <Component />
        </div>
        <CollapsibleContent className="min-w-0 border-t xl:border-t-0 xl:border-l">
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

/** Prose under a heading. */
function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-muted-foreground">{children}</p>;
}

// Prettier's width: past it, one name to a line.
const IMPORT_WIDTH = 80;

function importLine(names: string[]): string {
  const line = `import { ${names.join(", ")} } from "@siyahi/ui";`;
  return line.length <= IMPORT_WIDTH
    ? line
    : `import {\n${names.map((n) => `  ${n},`).join("\n")}\n} from "@siyahi/ui";`;
}

function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Prop and type</TableHead>
            <TableHead className="hidden sm:table-cell">Default</TableHead>
            <TableHead className="hidden pr-4 sm:table-cell">What it does</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="pl-4 align-top whitespace-normal">
                <div className="font-mono font-medium">{row.name}</div>
                <div className="font-mono text-xs break-words text-muted-foreground">{row.type}</div>
                {/* Three columns do not fit a phone: the default and purpose follow the type in the one cell. */}
                <div className="mt-1 font-mono text-xs text-muted-foreground sm:hidden">
                  Default: {row.default ?? "required"}
                </div>
                <div className="mt-1 pr-4 sm:hidden">{row.purpose}</div>
              </TableCell>
              <TableCell className="hidden align-top font-mono text-xs whitespace-normal text-muted-foreground sm:table-cell">
                {row.default ?? "required"}
              </TableCell>
              <TableCell className="hidden min-w-48 pr-4 align-top whitespace-normal sm:table-cell">
                {row.purpose}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/**
 * A family's reference under its title and lead, fastest answer first: the line to copy, its props, its rules, then
 * live examples.
 * `level` is the rank of its own headings: 2 when the family has the page to itself, 3 under a stacked page's h2.
 */
function FamilyBody({ family, level }: { family: Family; level: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  const heading = level === 2 ? "text-xl font-semibold tracking-tight" : "text-base font-semibold";
  const { imports, props, rules, body, examples: specs } = family;
  return (
    <>
      {imports && (
        <CodeBlock size="sm" className="max-w-3xl">
          <CodeBlockHeader>
            <CodeBlockTitle>Import</CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton value={importLine(imports)} />
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockContent>{importLine(imports)}</CodeBlockContent>
        </CodeBlock>
      )}
      {props && (
        <>
          <Heading className={heading}>Props</Heading>
          <PropsTable rows={props} />
        </>
      )}
      {rules && (
        <>
          <Heading className={heading}>Rules</Heading>
          <ul className="flex max-w-prose list-disc flex-col gap-1.5 pl-5">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </>
      )}
      {body}
      {specs && (
        <>
          {(props || rules) && <Heading className={heading}>Examples</Heading>}
          {specs.map((spec) => (
            <Example key={spec.name} {...spec} />
          ))}
        </>
      )}
    </>
  );
}

/** One part of a stacked page; its id is the `#/<page>/<id>` anchor. */
export function Section({ family }: { family: Family }) {
  return (
    <section id={family.id} className="flex scroll-mt-28 flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{family.title}</h2>
      <Lead>{family.lead}</Lead>
      <FamilyBody family={family} level={3} />
    </section>
  );
}

function Neighbour({ page, family, direction }: { page: Page; family?: Family; direction: "previous" | "next" }) {
  if (!family) return <span />;
  const next = direction === "next";
  return (
    <a
      href={`#/${page.id}/${family.id}`}
      className={`flex flex-col gap-0.5 rounded-lg border px-4 py-3 hover:bg-muted ${next ? "items-end text-right" : ""}`}
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {!next && <ArrowLeftIcon className="size-3" />}
        {next ? "Next" : "Previous"}
        {next && <ArrowRightIcon className="size-3" />}
      </span>
      <span className="font-medium">{family.title}</span>
    </a>
  );
}

/** A family on its own route, under the page's title and lead, with its neighbours at the foot. */
export function FamilyView({ page, family }: { page: Page; family: Family }) {
  const at = page.families.indexOf(family);
  return (
    <section id={family.id} className="flex flex-col gap-4">
      <FamilyBody family={family} level={2} />
      <nav aria-label={`More in ${page.title}`} className="mt-4 grid grid-cols-2 gap-4">
        <Neighbour page={page} family={page.families[at - 1]} direction="previous" />
        <Neighbour page={page} family={page.families[at + 1]} direction="next" />
      </nav>
    </section>
  );
}

/** A category's families as cards to pick from, so the page is a map rather than every example at once. */
export function FamilyIndex({ page }: { page: Page }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {page.families.map((family) => {
        const count = family.examples?.length ?? 0;
        return (
          <li key={family.id} className="flex">
            <a
              href={`#/${page.id}/${family.id}`}
              className="group/family flex w-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="w-full transition-colors group-hover/family:bg-muted">
                <CardHeader>
                  <CardTitle>{family.title}</CardTitle>
                  <CardDescription>{family.lead}</CardDescription>
                </CardHeader>
                <div className="mt-auto flex items-center justify-between gap-2 px-4 text-xs text-muted-foreground">
                  <span className="truncate font-mono">{family.imports?.[0]}</span>
                  {count > 1 && <span className="shrink-0">{count} examples</span>}
                </div>
              </Card>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
