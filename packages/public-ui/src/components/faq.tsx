"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type {
  Action,
  BlogPost,
  FaqItem,
  FeatureItem,
  LinkItem,
  LogoItem,
  PricePlan,
  TestimonialItem,
} from "../types";
import { SectionHeading } from "./section-heading";

export function Faq({ heading, items }: { heading: string; items: FaqItem[] }) {
  const [active, setActive] = useState(0);
  return (
    <section className="py-20 lg:py-25">
      <div className="max-w-c-1016 mx-auto px-4 md:px-8">
        <SectionHeading eyebrow="FAQ" title={heading} />
        <div className="space-y-4">
          {items.map((x, i) => (
            <div
              key={x.question}
              className="shadow-solid-8 dark:bg-blacksection rounded-lg bg-white p-6"
            >
              <button
                className="flex w-full items-center justify-between text-left text-lg font-medium text-black dark:text-white"
                onClick={() => setActive(active === i ? -1 : i)}
              >
                {x.question}
                <span>{active === i ? "âˆ’" : "+"}</span>
              </button>
              {active === i && <p className="pt-4">{x.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
