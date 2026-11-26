import type {
  BlogPost,
  FaqItem,
  FeatureItem,
  FooterLinkGroup,
  LinkItem,
} from "@template/public-ui";
import {
  CircleCheckIcon,
  CreditCardIcon,
  DatabaseIcon,
  FingerprintIcon,
  GlobeIcon,
  GridIcon,
  LaptopIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UserIcon,
} from "@template/ui-core";
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

/** Primary site navigation (header and mobile menu); implemented routes only. */
export const navigation: LinkItem[] = [
  { label: "Product", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const footerNavigation: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

/** The legal documents, switched between at the top of each one. */
export const legalDocuments: LinkItem[] = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

/** Home page feature cards. */
export const features: FeatureItem[] = [
  {
    title: "Shared standards",
    description:
      "Compose product experiences from accessible, typed building blocks.",
    icon: <GridIcon />,
  },
  {
    title: "Independent delivery",
    description:
      "Build and deploy each portal independently as your organization grows.",
    icon: <GlobeIcon />,
  },
  {
    title: "Backend compatible",
    description:
      "Connect cleanly to authoritative APIs without coupling presentation to persistence.",
    icon: <DatabaseIcon />,
  },
  {
    title: "Responsive by default",
    description:
      "Deliver a polished experience across phones, tablets, and desktops.",
    icon: <SmartphoneIcon />,
  },
  {
    title: "Configurable content",
    description:
      "Replace product messaging and links without rewriting visual components.",
    icon: <SettingsIcon />,
  },
  {
    title: "Production ready",
    description:
      "Start from standardized tooling, metadata, testing, and container builds.",
    icon: <CircleCheckIcon />,
  },
];

/**
 * Features page capabilities. Describe only what the portals implement
 * today (DR-031): no wallet, identity verification or admin operations.
 */
export const capabilities: FeatureItem[] = [
  {
    title: "Accounts",
    description:
      "Registration with email confirmation and sign-in, ready in the customer portal.",
    icon: <UserIcon />,
  },
  {
    title: "Strong sign-in",
    description:
      "Authenticator two-factor verification and passkeys for phishing-resistant access.",
    icon: <FingerprintIcon />,
  },
  {
    title: "Account security",
    description:
      "Customers manage their sign-in methods and security settings in one place.",
    icon: <ShieldCheckIcon />,
  },
  {
    title: "Subscriptions",
    description:
      "Plans priced by the billing service, hosted checkout and billing history.",
    icon: <CreditCardIcon />,
  },
  {
    title: "Independent portals",
    description:
      "Public, customer and administration applications build and deploy on their own schedules.",
    icon: <LaptopIcon />,
  },
  {
    title: "Your brand",
    description:
      "Product name, logo, copy and destinations come from configuration, not code.",
    icon: <SettingsIcon />,
  },
];

export const about: FeatureItem[] = [
  {
    title: "Mission",
    description:
      "Help teams move from an ambitious idea to a polished, dependable product experience.",
  },
  {
    title: "Values",
    description:
      "Accessible by default, typed end to end, and honest about what the product does.",
  },
  {
    title: "Team",
    description:
      "Product, design and engineering people who care about the details customers notice.",
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
  {
    question: "How do I subscribe?",
    answer:
      "Choose a plan to continue to checkout in your account. You will be asked to sign in or create an account first.",
  },
];

/** Blog index cards. No post pages exist yet (DR-032), so cards do not link. */
export const posts: BlogPost[] = [
  {
    id: "launch",
    category: "Guides",
    title: "How modern teams launch with confidence",
    excerpt: "A practical guide to creating a durable product foundation.",
  },
  {
    id: "platform",
    category: "Engineering",
    title: "Designing a scalable frontend platform",
    excerpt: "Standards that keep independent applications aligned.",
  },
  {
    id: "production",
    category: "Product",
    title: "From idea to production",
    excerpt: "A simple path for turning product strategy into customer value.",
  },
];
