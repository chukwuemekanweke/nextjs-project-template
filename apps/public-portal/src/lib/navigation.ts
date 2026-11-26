import type { LinkItem } from "@template/public-ui";

/**
 * The navigation href for the current path: an exact match, or the most
 * specific section prefix (`/blog` for `/blog/post`). Home matches only `/`.
 */
export function activeNavigationHref(
  items: readonly LinkItem[],
  pathname: string | null,
): string | undefined {
  if (!pathname) return undefined;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let active: string | undefined;
  for (const { href } of items) {
    const matches =
      href === path || (href !== "/" && path.startsWith(`${href}/`));
    if (matches && (!active || href.length > active.length)) active = href;
  }
  return active;
}
