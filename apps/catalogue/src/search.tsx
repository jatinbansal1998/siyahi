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

/** Finds a page or section by name, from the header button or ⌘K / Ctrl+K anywhere in the catalogue. */
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
        <Command>
          <CommandInput placeholder="Find a component, chart or rule…" />
          <CommandList>
            <CommandEmpty>Nothing by that name.</CommandEmpty>
            {pages.map((page) => (
              <CommandGroup key={page.id} heading={page.title}>
                <CommandItem value={page.title} onSelect={() => go(`#/${page.id}`)}>
                  All of {page.title}
                </CommandItem>
                {page.sections.map((section) => (
                  <CommandItem
                    key={section.id}
                    value={`${page.title} ${section.title}`}
                    onSelect={() => go(`#/${page.id}/${section.id}`)}
                  >
                    {section.title}
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
