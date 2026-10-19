import { useEffect, useState } from "react";

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
    const onChange = () => setRoute(parse(location.hash));
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  useEffect(() => {
    if (route.section) document.getElementById(route.section)?.scrollIntoView();
    else scrollTo(0, 0);
  }, [route]);
  return route;
}
