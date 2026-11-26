"use client";

import { MarketingHeader, type LinkItem } from "@template/public-ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navigation, site } from "@/config/site";
import { activeNavigationHref } from "@/lib/navigation";

/** Marketing header with the current route marked in the navigation. */
export function SiteHeader({
  brand,
  items = navigation,
}: Readonly<{ brand: ReactNode; items?: readonly LinkItem[] }>) {
  const pathname = usePathname();
  return (
    <MarketingHeader
      activeHref={activeNavigationHref(items, pathname)}
      brand={brand}
      navigation={items}
      register={site.register}
      signIn={site.signIn}
    />
  );
}
