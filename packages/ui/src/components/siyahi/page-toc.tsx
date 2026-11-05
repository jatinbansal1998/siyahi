import { cn } from "cn";
import { useEffect, useRef, useState, type RefObject } from "react";

export interface PageTocItem {
  /** The `id` of the PageSection it jumps to. */
  id: string;
  title: string;
}

export interface PageTocProps {
  items: PageTocItem[];
  /** Names the navigation for screen readers. */
  label?: string;
  /** Layout only, such as `top-14` under a sticky page header. */
  className?: string;
}

/**
 * A long page's sections as one sticky strip of links. It stays at the top while the reader scrolls, marks the
 * section in view in the link colour, and scrolls sideways on a phone with the current link kept in sight.
 */
export function PageToc({ items, label = "On this page", className }: PageTocProps) {
  const nav = useRef<HTMLElement>(null);
  const active = useActiveSection(items, nav);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const link = strip.current?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active ?? "")}"]`);
    const box = strip.current;
    if (!link || !box) return;
    // Scroll the strip only; scrollIntoView would also move the page.
    const left = link.offsetLeft - box.clientWidth / 2 + link.offsetWidth / 2;
    box.scrollTo({ left, behavior: "smooth" });
  }, [active]);
  return (
    <nav
      ref={nav}
      aria-label={label}
      data-slot="page-toc"
      className={cn("sticky top-0 z-10 -mx-4 border-b bg-background px-4 sm:mx-0 sm:px-0", className)}
    >
      <div ref={strip} className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={item.id === active ? "location" : undefined}
            onClick={(event) => {
              // Hash routers own the URL hash; jump without changing it.
              event.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            className="shrink-0 rounded-md px-2.5 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=location]:bg-muted aria-[current=location]:font-medium aria-[current=location]:text-link"
          >
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

// The last section the reader has scrolled to: the one they are in. A fixed band of the viewport would lag behind
// the sticky strip and mark the section above it.
function useActiveSection(items: PageTocItem[], strip: RefObject<HTMLElement | null>): string | undefined {
  const [active, setActive] = useState(items[0]?.id);
  // Callers pass a fresh array each render; listen again only when the sections change.
  const ids = items.map((item) => item.id).join(" ");
  useEffect(() => {
    const sections = ids.split(" ").flatMap((id) => document.getElementById(id) ?? []);
    if (sections.length === 0) return;
    const update = () => {
      const stripBottom = strip.current?.getBoundingClientRect().bottom ?? 0;
      // The reading line: a third of the way down the window, never above the strip or a jump's stopping point.
      const line = (section: HTMLElement) =>
        Math.max(stripBottom, Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0, innerHeight * 0.3);
      const reached = sections.filter((section) => section.getBoundingClientRect().top <= line(section) + 1);
      setActive((reached.at(-1) ?? sections[0])!.id);
    };
    update();
    addEventListener("scroll", update, { passive: true, capture: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update, { capture: true });
      removeEventListener("resize", update);
    };
  }, [ids, strip]);
  return active;
}
