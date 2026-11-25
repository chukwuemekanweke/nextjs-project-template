import type { AnchorHTMLAttributes } from "react";

/** Workbench stand-in for `next/link`: renders the anchor Next.js renders. */
export default function Link({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props} />;
}
