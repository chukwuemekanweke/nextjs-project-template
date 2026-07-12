import type { ReactNode } from "react";

export type LinkItem = { label: string; href: string };
export type Action = LinkItem;
export type FeatureItem = {
  title: string;
  description: string;
  icon?: ReactNode;
};
export type PricePlan = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  action: Action;
};
export type FaqItem = { question: string; answer: string };
export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  image: string;
};
export type LogoItem = {
  name: string;
  lightImage: string;
  darkImage?: string;
  href?: string;
};
export type BlogPost = {
  title: string;
  excerpt: string;
  image: string;
  href: string;
};
