import type {
  BlogPost,
  FaqItem,
  FeatureItem,
  LinkItem,
  LogoItem,
  TestimonialItem,
} from "@template/public-ui";
import type { PlanMarketingContent } from "@/lib/subscription-pricing";
import { branding, env, userPortalHref } from "./env";

export const site = {
  name: branding.productName,
  url: env.siteUrl,
  description: env.productDescription,
  email: branding.supportEmail,
  address: env.contactAddress,
  signIn: { label: "Sign in", href: userPortalHref("/sign-in") },
  register: { label: "Get started", href: userPortalHref("/register") },
} as const;

export const navigation: LinkItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
];
export const features: FeatureItem[] = [
  {
    title: "Shared standards",
    description:
      "Compose product experiences from accessible, typed building blocks.",
  },
  {
    title: "Independent delivery",
    description:
      "Build and deploy each portal independently as your organization grows.",
  },
  {
    title: "Backend compatible",
    description:
      "Connect cleanly to authoritative APIs without coupling presentation to persistence.",
  },
  {
    title: "Responsive by default",
    description:
      "Deliver a polished experience across phones, tablets, and desktops.",
  },
  {
    title: "Configurable content",
    description:
      "Replace product messaging and links without rewriting visual components.",
  },
  {
    title: "Production ready",
    description:
      "Start from standardized tooling, metadata, testing, and container builds.",
  },
];
/**
 * Optional marketing copy keyed by backend plan `code`. Commercial data
 * (price, currency, interval) always comes from the subscription-plans API;
 * do not list feature entitlements here unless the backend enforces them.
 */
export const planMarketing: PlanMarketingContent = {};
export const faqs: FaqItem[] = [
  {
    question: "Can I customize the product?",
    answer:
      "Yes. Branding, copy, destinations, and page composition are supplied through typed configuration.",
  },
  {
    question: "Does it work with an existing backend?",
    answer:
      "Yes. The public portal remains independently deployable and treats backend authorization as authoritative.",
  },
  {
    question: "Where do plan prices come from?",
    answer:
      "Prices, currencies, and billing intervals are read from the billing service, so this page shows exactly what checkout will charge.",
  },
];
export const testimonials: TestimonialItem[] = [
  {
    quote: "The foundation let our team focus on product value from day one.",
    name: "Alex Morgan",
    role: "Product Lead",
    image: "/images/user/user-01.png",
  },
  {
    quote:
      "A polished public experience with engineering standards already in place.",
    name: "Taylor Reed",
    role: "Engineering Manager",
    image: "/images/user/user-02.png",
  },
  {
    quote: "The reusable sections make every new campaign much faster to ship.",
    name: "Jordan Lee",
    role: "Marketing Director",
    image: "/images/user/user-01.png",
  },
];
export const logos: LogoItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  name: `Partner ${n}`,
  lightImage: `/images/brand/brand-light-0${n}.svg`,
  darkImage: `/images/brand/brand-dark-0${n}.svg`,
}));
export const posts: BlogPost[] = [
  {
    title: "How modern teams launch with confidence",
    excerpt: "A practical guide to creating a durable product foundation.",
    image: "/images/blog/blog-01.png",
    href: "/blog#launch",
  },
  {
    title: "Designing a scalable frontend platform",
    excerpt: "Standards that keep independent applications aligned.",
    image: "/images/blog/blog-02.png",
    href: "/blog#platform",
  },
  {
    title: "From idea to production",
    excerpt: "A simple path for turning product strategy into customer value.",
    image: "/images/blog/blog-03.png",
    href: "/blog#production",
  },
];
