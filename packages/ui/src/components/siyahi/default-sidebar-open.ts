/**
 * SidebarProvider's `defaultOpen` for an app shell: the reader's last choice, which the provider keeps in the
 * `sidebar_state` cookie, else open — except on a short landscape screen, a phone held sideways, where an open
 * sidebar leaves no room for the page. There it starts as the icon rail.
 */
export function defaultSidebarOpen(): boolean {
  const saved = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("sidebar_state="))
    ?.slice("sidebar_state=".length);
  if (saved !== undefined) return saved === "true";
  return !matchMedia("(orientation: landscape) and (max-height: 30rem)").matches;
}
