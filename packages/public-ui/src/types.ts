import type { ReactNode } from "react";

export type LinkItem = { label: string; href: string };
/** A link styled as a button; `primary` unless stated. */
export type Action = LinkItem & { variant?: "primary" | "secondary" };
export type FeatureItem = {
  title: string;
  description: string;
  /** Decorative icon from `@template/ui-core`, shown in a brand tile. */
  icon?: ReactNode;
};
export type PricePlan = {
  /** Stable identity, such as a backend plan id; falls back to `name`. */
  id?: string;
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features?: string[];
  action: Action;
};
export type FaqItem = { question: string; answer: string };
export type BlogPost = {
  /** Anchor id of the card, so `/blog#id` links land on it. */
  id?: string;
  title: string;
  excerpt: string;
  category?: string;
  /** Publication date: machine-readable value and its display label. */
  date?: { dateTime: string; label: string };
  icon?: ReactNode;
  /** Detail page; omit until a post route exists (no dead links). */
  href?: string;
};
export type FooterLinkGroup = { title: string; links: LinkItem[] };
export type ContactDetail = {
  label: string;
  value: string;
  /** Makes the value a link, for example `mailto:`. */
  href?: string;
  icon?: ReactNode;
};
export type LegalSection = { id: string; title: string; content: ReactNode };
