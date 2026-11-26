import type {
  Action,
  BlogPost,
  ContactDetail,
  FaqItem,
  FeatureItem,
  FooterLinkGroup,
  LegalSection,
  LinkItem,
  PricingInterval,
} from "@template/public-ui";
import {
  GridIcon,
  MailIcon,
  MapPinIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@template/ui-core";

/* Generic marketing fixtures for workbench stories only. */

export const marketingNavigation: LinkItem[] = [
  { label: "Product", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

export const signIn: Action = { label: "Sign in", href: "#sign-in" };
export const register: Action = { label: "Get started", href: "#register" };

export const marketingFooterGroups: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  { title: "Legal", links: [{ label: "Terms", href: "#terms" }] },
];

export const marketingFeatures: FeatureItem[] = [
  {
    title: "Feature title",
    description: "One or two sentences describing the feature.",
    icon: <GridIcon />,
  },
  {
    title: "A longer feature title that wraps",
    description: "Cards keep equal height in a row.",
    icon: <ShieldCheckIcon />,
  },
  {
    title: "Third feature",
    description: "Short description.",
    icon: <SettingsIcon />,
  },
];

export const marketingFaqs: FaqItem[] = [
  { question: "A question?", answer: "A one-sentence answer." },
  {
    question: "Another, longer question that wraps onto a second line?",
    answer: "Answers stay visible; there is no disclosure state.",
  },
];

export const marketingBlogPosts: BlogPost[] = [
  {
    category: "Category",
    date: { dateTime: "2026-01-01", label: "1 Jan 2026" },
    excerpt: "Short summary of the post.",
    title: "Post title",
  },
  {
    category: "Guides",
    excerpt: "A card without a date or post page.",
    title: "A longer post title that wraps onto a second line",
  },
  { excerpt: "No category.", href: "#post", title: "Linked post" },
];

const samplePlan = (name: string, price: string, cadence: string) => ({
  action: { label: "Subscribe", href: `#${name}` },
  cadence,
  description: "Plan description.",
  features: ["Feature bullet", "Another feature bullet"],
  name,
  price,
});

/** Sample presentation values; never real prices. */
export const marketingIntervals: PricingInterval[] = [
  {
    label: "Monthly",
    plans: [
      samplePlan("Starter", "NGN 0.00", "month"),
      samplePlan("Team", "NGN 0.00", "month"),
      samplePlan("Scale", "NGN 0.00", "month"),
    ],
    value: "Monthly",
  },
  {
    label: "Yearly",
    plans: [samplePlan("Team", "NGN 0.00", "year")],
    value: "Yearly",
  },
];

export const marketingContactDetails: ContactDetail[] = [
  {
    href: "mailto:support@example.com",
    icon: <MailIcon />,
    label: "Email",
    value: "support@example.com",
  },
  { icon: <MapPinIcon />, label: "Office", value: "[Street address, City]" },
];

export const marketingLegalSections: LegalSection[] = [
  "Who we are",
  "Information we collect",
  "Your rights",
].map((title, index) => ({
  content: <p>[Legal text for this section goes here.]</p>,
  id: `section-${index + 1}`,
  title,
}));
