"use client";

import { motion } from "framer-motion";
import type { FeatureItem } from "../types";
import { SectionHeading } from "./section-heading";

const reveal = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export function Features({
  heading,
  items,
}: {
  heading: string;
  items: FeatureItem[];
}) {
  return (
    <section id="features" className="py-20 lg:py-25 xl:py-30">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Core features" title={heading} />
        <div className="mt-12.5 grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:mt-15 lg:grid-cols-3 xl:mt-20 xl:gap-12.5">
          {items.map((x, i) => (
            <motion.article
              key={x.title}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="animate_top shadow-solid-3 hover:shadow-solid-4 dark:border-strokedark dark:bg-blacksection dark:hover:bg-hoverdark z-40 rounded-lg border border-white bg-white p-7.5 transition-all xl:p-12.5"
            >
              <div className="bg-primary mb-7.5 flex h-15 w-15 items-center justify-center rounded-[4px] text-xl text-white">
                {x.icon ?? String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="xl:text-itemtitle mb-5 text-xl font-semibold text-black dark:text-white">
                {x.title}
              </h3>
              <p>{x.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
