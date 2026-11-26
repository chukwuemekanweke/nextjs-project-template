import type { AnchorHTMLAttributes } from "react";

/** Test stand-in for `next/link`: renders the anchor Next.js would render. */
export default function Link({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props} />;
}
