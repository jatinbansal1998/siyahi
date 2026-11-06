import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/** The element's content width, kept current as it resizes; 0 until it is first measured. */
export function useElementWidth<T extends Element>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
