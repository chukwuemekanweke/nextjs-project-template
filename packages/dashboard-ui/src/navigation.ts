/**
 * Pure active-route resolution for dashboard navigation. Applications pass
 * the current pathname; nothing here reads the router.
 */

function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** True when `href` is the current page or an ancestor of it. */
export function isNavItemActive(href: string, pathname: string): boolean {
  const target = normalizePath(href);
  const current = normalizePath(pathname);
  if (target === current) return true;
  return target !== "/" && current.startsWith(`${target}/`);
}

/**
 * The single destination to mark as current: the most specific `href` that
 * is the page or one of its ancestors. With both `/billing` and
 * `/billing/history` listed, `/billing/history/2026` activates only the
 * latter; the root `/` matches only itself.
 */
export function resolveActiveNavHref(
  hrefs: Iterable<string>,
  pathname: string,
): string | undefined {
  let active: string | undefined;
  for (const href of hrefs) {
    if (
      isNavItemActive(href, pathname) &&
      (active === undefined ||
        normalizePath(href).length > normalizePath(active).length)
    ) {
      active = href;
    }
  }
  return active;
}
