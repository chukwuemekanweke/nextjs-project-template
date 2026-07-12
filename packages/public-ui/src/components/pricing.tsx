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

export function Pricing({
  heading,
  plans,
}: {
  heading: string;
  plans: PricePlan[];
}) {
  return (
    <section className="overflow-hidden py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Pricing" title={heading} />
        <div className="grid gap-7.5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="border-stroke shadow-solid-10 dark:border-strokedark dark:bg-blacksection rounded-lg border bg-white p-7.5 xl:p-12.5"
            >
              <h3 className="text-2xl font-semibold text-black dark:text-white">
                {plan.name}
              </h3>
              <div className="my-6">
                <span className="text-4xl font-bold text-black dark:text-white">
                  {plan.price}
                </span>
                {plan.cadence && <span>/{plan.cadence}</span>}
              </div>
              <p>{plan.description}</p>
              <ul className="my-8 space-y-3">
                {plan.features.map((x) => (
                  <li key={x}>âœ“ {x}</li>
                ))}
              </ul>
              <Link
                href={plan.action.href}
                className="bg-primary inline-flex rounded-full px-7.5 py-3 text-white"
              >
                {plan.action.label}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
