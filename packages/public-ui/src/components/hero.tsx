"use client";

import Image from "next/image";
import Link from "next/link";
import type { Action } from "../types";

export function Hero({
  eyebrow,
  title,
  highlighted,
  description,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  title: string;
  highlighted: string;
  description: string;
  primaryAction: Action;
  secondaryAction?: Action;
}) {
  return (
    <section className="overflow-hidden pt-35 pb-20 md:pt-40 xl:pt-46 xl:pb-25">
      <div className="max-w-c-1390 mx-auto px-4 md:px-8 2xl:px-0">
        <div className="flex lg:items-center lg:gap-8 xl:gap-32.5">
          <div className="md:w-1/2">
            <h4 className="mb-4.5 text-lg font-medium text-black dark:text-white">
              {eyebrow}
            </h4>
            <h1 className="xl:text-hero mb-5 text-3xl font-bold text-black dark:text-white">
              {title}{" "}
              <span className="before:bg-titlebg dark:before:bg-titlebgdark relative inline-block before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full">
                {highlighted}
              </span>
            </h1>
            <p>{description}</p>
            <div className="mt-10 flex flex-wrap gap-5">
              <Link
                className="hover:bg-blackho dark:bg-btndark rounded-full bg-black px-7.5 py-2.5 text-white"
                href={primaryAction.href}
              >
                {primaryAction.label}
              </Link>
              {secondaryAction && (
                <Link
                  className="border-stroke dark:border-strokedark rounded-full border px-7.5 py-2.5 text-black dark:text-white"
                  href={secondaryAction.href}
                >
                  {secondaryAction.label}
                </Link>
              )}
            </div>
          </div>
          <div className="animate_right hidden md:w-1/2 lg:block">
            <div className="relative 2xl:-mr-7.5">
              <Image
                src="/images/shape/shape-01.png"
                alt=""
                width={46}
                height={246}
                className="absolute -top-0 -left-11.5"
              />
              <Image
                src="/images/shape/shape-02.svg"
                alt=""
                width={37}
                height={37}
                className="absolute right-0 bottom-0 z-10"
              />
              <Image
                src="/images/shape/shape-03.svg"
                alt=""
                width={22}
                height={22}
                className="absolute -right-6.5 bottom-0 z-1"
              />
              <div className="relative aspect-700/444 w-full">
                <Image
                  className="shadow-solid-l dark:hidden"
                  src="/images/hero/hero-light.svg"
                  alt="Product preview"
                  fill
                  priority
                />
                <Image
                  className="shadow-solid-l hidden dark:block"
                  src="/images/hero/hero-dark.svg"
                  alt="Product preview"
                  fill
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
