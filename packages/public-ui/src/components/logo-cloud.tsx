"use client";

import Image from "next/image";
import type { LogoItem } from "../types";

export function LogoCloud({ items }: { items: LogoItem[] }) {
  return (
    <section className="border-stroke dark:border-strokedark border-y py-11">
      <div className="max-w-c-1390 mx-auto flex flex-wrap items-center justify-center gap-10 px-4 md:justify-between md:px-8">
        {items.map((x) => (
          <a
            key={x.name}
            href={x.href ?? "#"}
            aria-label={x.name}
            className="relative h-10 w-32 opacity-65 hover:opacity-100"
          >
            <Image
              src={x.lightImage}
              alt={x.name}
              fill
              className="object-contain dark:hidden"
            />
            {x.darkImage && (
              <Image
                src={x.darkImage}
                alt={x.name}
                fill
                className="hidden object-contain dark:block"
              />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
