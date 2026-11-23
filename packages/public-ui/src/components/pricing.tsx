"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PricePlan } from "../types";
import { SectionHeading } from "./section-heading";

export function Pricing({
  heading,
  plans,
  placeholder,
}: {
  heading: string;
  plans: PricePlan[];
  /** Rendered instead of the plan grid when there are no plans to show. */
  placeholder?: ReactNode;
}) {
  return (
    <section className="overflow-hidden py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Pricing" title={heading} />
        {plans.length === 0 && placeholder ? (
          placeholder
        ) : (
          <div className="grid gap-7.5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id ?? plan.name}
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
                {plan.features && plan.features.length > 0 ? (
                  <ul className="my-8 space-y-3">
                    {plan.features.map((x) => (
                      <li key={x}>
                        <span aria-hidden="true">✓ </span>
                        {x}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="my-8" />
                )}
                <Link
                  href={plan.action.href}
                  aria-label={`${plan.action.label}: ${plan.name}`}
                  className="bg-primary inline-flex rounded-full px-7.5 py-3 text-white"
                >
                  {plan.action.label}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
