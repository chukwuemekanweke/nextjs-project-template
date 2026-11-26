import Image from "next/image";
import Link from "next/link";
import { branding } from "@/config/env";

/** The configured logo (light and dark variants) linking to the home page. */
export function SiteBrand() {
  return (
    <Link className="inline-flex shrink-0 rounded-sm" href="/">
      <Image
        alt={branding.logo.alt}
        className="dark:hidden"
        height={30}
        src={branding.logo.light}
        width={119}
      />
      <Image
        alt={branding.logo.alt}
        className="hidden dark:block"
        height={30}
        src={branding.logo.dark}
        width={119}
      />
    </Link>
  );
}
