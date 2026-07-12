"use client";

import Image from "next/image";
import type { TestimonialItem } from "../types";
import { SectionHeading } from "./section-heading";

export function Testimonials({
  heading,
  items,
}: {
  heading: string;
  items: TestimonialItem[];
}) {
  return (
    <section className="bg-alabaster dark:bg-blacksection py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Testimonials" title={heading} />
        <div className="grid gap-7.5 lg:grid-cols-3">
          {items.map((x) => (
            <figure
              key={x.name}
              className="shadow-solid-9 rounded-lg bg-white p-7.5 dark:bg-black"
            >
              <blockquote>â€œ{x.quote}â€</blockquote>
              <figcaption className="mt-7 flex items-center gap-4">
                <Image
                  src={x.image}
                  alt=""
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div>
                  <strong className="block text-black dark:text-white">
                    {x.name}
                  </strong>
                  <span className="text-sm">{x.role}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
