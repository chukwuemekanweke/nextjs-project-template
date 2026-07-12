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

export function ContactSection({
  heading,
  description,
  email,
  address,
}: {
  heading: string;
  description: string;
  email: string;
  address: string;
}) {
  const submit = (e: FormEvent) => e.preventDefault();
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="max-w-c-1390 mx-auto flex flex-col-reverse gap-8 rounded-lg bg-linear-to-t from-transparent to-[#dee7ff47] px-7.5 py-10 md:flex-row lg:p-15 dark:to-[#252A42]">
        <form
          onSubmit={submit}
          className="shadow-solid-8 w-full rounded-lg bg-white p-7.5 md:w-3/5 xl:p-15 dark:bg-black"
        >
          <h2 className="mb-10 text-3xl font-semibold text-black dark:text-white">
            {heading}
          </h2>
          <div className="grid gap-7.5 lg:grid-cols-2">
            <input
              aria-label="Full name"
              required
              placeholder="Full name"
              className="border-stroke focus:border-primary border-b bg-transparent pb-3.5 outline-none"
            />
            <input
              aria-label="Email address"
              required
              type="email"
              placeholder="Email address"
              className="border-stroke focus:border-primary border-b bg-transparent pb-3.5 outline-none"
            />
          </div>
          <textarea
            aria-label="Message"
            required
            rows={4}
            placeholder="Message"
            className="border-stroke focus:border-primary mt-8 w-full border-b bg-transparent pb-3.5 outline-none"
          />
          <button className="dark:bg-btndark mt-8 rounded-full bg-black px-6 py-3 text-white">
            Send Message
          </button>
        </form>
        <aside className="w-full md:w-2/5 md:p-7.5">
          <h2 className="mb-6 text-3xl font-semibold text-black dark:text-white">
            Find us
          </h2>
          <p className="mb-7">{description}</p>
          <h3 className="font-medium text-black dark:text-white">
            Our location
          </h3>
          <p className="mb-7">{address}</p>
          <h3 className="font-medium text-black dark:text-white">
            Email address
          </h3>
          <a href={`mailto:${email}`}>{email}</a>
        </aside>
      </div>
    </section>
  );
}
