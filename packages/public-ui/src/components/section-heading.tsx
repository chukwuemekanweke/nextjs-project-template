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

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-12.5 max-w-3xl text-center">
      {eyebrow && (
        <span className="text-primary font-medium uppercase">{eyebrow}</span>
      )}
      <h2 className="xl:text-sectiontitle2 mt-2 text-3xl font-bold text-black dark:text-white">
        {title}
      </h2>
      {description && <p className="mt-4">{description}</p>}
    </div>
  );
}
