import { useLayoutEffect, useRef, type KeyboardEventHandler, type RefObject } from "react";

/** One tab stop per heatmap; arrows move between its actual drawn cells. */
export function useHeatmapNavigation(): {
  ref: RefObject<HTMLDivElement | null>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const cells = () => [...(ref.current?.querySelectorAll<SVGRectElement>('rect[role="button"]') ?? [])];
  useLayoutEffect(() => {
    const buttons = cells();
    const active = buttons.find((cell) => cell === document.activeElement) ?? buttons[0];
    for (const cell of buttons) cell.tabIndex = cell === active ? 0 : -1;
  });
  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!(event.target instanceof SVGElement) || event.target.getAttribute("role") !== "button") return;
    const buttons = cells();
    let next: SVGRectElement | undefined;
    if (event.key === "Home") next = buttons[0];
    else if (event.key === "End") next = buttons.at(-1);
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      const origin = event.target.getBoundingClientRect();
      const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      let nearest = Infinity;
      for (const cell of buttons) {
        const box = cell.getBoundingClientRect();
        const primary = (horizontal ? box.x - origin.x : box.y - origin.y) * direction;
        const across = Math.abs(horizontal ? box.y - origin.y : box.x - origin.x);
        const distance = primary + across * 4;
        if (primary > 1 && distance < nearest) {
          nearest = distance;
          next = cell;
        }
      }
    } else return;
    event.preventDefault();
    if (!next) return;
    for (const cell of buttons) cell.tabIndex = cell === next ? 0 : -1;
    next.focus();
  };
  return { ref, onKeyDown };
}
