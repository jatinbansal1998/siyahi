import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@siyahi/ui";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Page } from "./page";

/**
 * A name holding the search outranks an export holding it, and nothing matches by scattered letters: cmdk's fuzzy
 * default finds "treemap" spread across the dozen Breadcrumb exports and puts that first.
 */
function byWords(value: string, search: string, keywords: string[] = []): number {
  const query = search.trim().toLowerCase();
  if (value.toLowerCase().includes(query)) return 1;
  return keywords.some((keyword) => keyword.toLowerCase().includes(query)) ? 0.5 : 0;
}

/** Finds a page or family by its name or an export's, from the header button or ⌘K / Ctrl+K anywhere in the catalogue. */
export function CatalogueSearch({ pages }: { pages: Page[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  const go = (hash: string) => {
    location.hash = hash;
    setOpen(false);
  };
  return (
    <>
      <Button variant="outline" size="sm" className="ml-auto" onClick={() => setOpen(true)}>
        <SearchIcon />
        Search
        <kbd className="hidden font-mono text-xs text-muted-foreground sm:inline">⌘K</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the catalogue"
        description="Find a page, component or section by name"
      >
        <Command filter={byWords}>
          <CommandInput placeholder="Find a component, chart or rule…" />
          <CommandList>
            <CommandEmpty>Nothing by that name.</CommandEmpty>
            {pages.map((page) => (
              <CommandGroup key={page.id} heading={page.title}>
                <CommandItem value={page.title} onSelect={() => go(`#/${page.id}`)}>
                  All of {page.title}
                </CommandItem>
                {page.families.map((family) => (
                  <CommandItem
                    key={family.id}
                    value={`${page.title} ${family.title}`}
                    // A developer often knows the export, not the catalogue's name for it: BarChartCard finds Bar chart.
                    keywords={family.imports}
                    onSelect={() => go(`#/${page.id}/${family.id}`)}
                  >
                    {family.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
