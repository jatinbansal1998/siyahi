import { startTransition, useEffect, useState } from "react";

export interface Route {
  page: string;
  section: string | undefined;
}

function parse(hash: string): Route {
  const [page, section] = hash.replace(/^#\/?/, "").split("/");
  return { page: page || "overview", section: section || undefined };
}

/** Hash routes: `#/<page>/<section>`. Static hosting needs no server routes this way. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const onChange = () => {
      // A section's route shows that section alone, so every route opens at its top.
      scrollTo(0, 0);
      startTransition(() => setRoute(parse(location.hash)));
    };
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
