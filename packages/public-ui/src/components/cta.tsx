"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Action } from "../types";

export function Cta({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: Action;
}) {
  return (
    <section className="overflow-hidden px-4 py-20 md:px-8 lg:py-25 xl:py-30 2xl:px-0">
      <div className="max-w-c-1390 dark:bg-blacksection dark:stroke-strokedark mx-auto rounded-lg bg-linear-to-t from-[#F8F9FF] to-[#DEE7FF] px-7.5 py-12.5 md:px-12.5 xl:px-17.5 xl:py-0 dark:bg-linear-to-t dark:from-transparent dark:to-transparent">
        <div className="flex flex-wrap gap-8 md:flex-nowrap md:items-center md:justify-between md:gap-0">
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_left md:w-[70%] lg:w-1/2"
          >
            <h2 className="xl:text-sectiontitle4 mb-4 w-11/12 text-3xl font-bold text-black dark:text-white">
              {title}
            </h2>
            <p>{description}</p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 },
            }}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_right lg:w-[45%]"
          >
            <div className="flex items-center justify-end xl:justify-between">
              <Image
                width={299}
                height={299}
                src="/images/shape/shape-06.png"
                alt=""
                className="hidden xl:block"
              />
              <Link
                href={action.href}
                className="inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3 font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                {action.label}
                <Image
                  width={20}
                  height={20}
                  src="/images/icon/icon-arrow-dark.svg"
                  alt=""
                  className="dark:hidden"
                />
                <Image
                  width={20}
                  height={20}
                  src="/images/icon/icon-arrow-light.svg"
                  alt=""
                  className="hidden dark:block"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
