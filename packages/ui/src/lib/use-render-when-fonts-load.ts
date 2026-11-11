import { useEffect, useState } from "react";

/** Renders the component again once the page's fonts load, so text measured on a canvas is measured in Geist. */
export function useRenderWhenFontsLoad(): void {
  const [loaded, setLoaded] = useState(() => typeof document === "undefined" || document.fonts?.status === "loaded");
  useEffect(() => {
    if (loaded || !document.fonts) return;
    let live = true;
    void document.fonts.ready.then(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [loaded]);
}
