"use client";

import Image from "next/image";
import Link from "next/link";
import type { LinkItem } from "../types";

export function Footer({
  description,
  navigation,
  legal,
}: {
  description: string;
  navigation: LinkItem[];
  legal: LinkItem[];
}) {
  return (
    <footer className="border-stroke dark:border-strokedark dark:bg-blacksection border-t bg-white pt-20 pb-10 lg:pt-25">
      <div className="max-w-c-1390 mx-auto px-4 md:px-8 2xl:px-0">
        <div className="flex flex-wrap gap-8 lg:justify-between">
          <div className="max-w-sm">
            <Image
              src="/images/logo/logo-light.svg"
              alt="Product"
              width={119}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt="Product"
              width={119}
              height={30}
              className="hidden dark:block"
            />
            <p className="mt-5">{description}</p>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-medium text-black dark:text-white">
              Explore
            </h4>
            <ul className="space-y-3">
              {navigation.map((x) => (
                <li key={x.href}>
                  <Link className="hover:text-primary" href={x.href}>
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-medium text-black dark:text-white">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((x) => (
                <li key={x.href}>
                  <Link className="hover:text-primary" href={x.href}>
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-stroke dark:border-strokedark mt-12 border-t pt-7 text-sm">
          Â© {new Date().getFullYear()} Product. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
