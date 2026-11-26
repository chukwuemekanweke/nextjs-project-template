import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BlogGrid,
  ContactLayout,
  CtaBanner,
  FaqGrid,
  FeatureGrid,
  Hero,
  LegalDocument,
  MarketingContainer,
  MarketingFooter,
  MarketingHeader,
  MarketingMobileMenu,
  MarketingSection,
  NumberedFeatureList,
  PlanGridSkeleton,
  PricingIntervals,
  ProductShot,
  SectionHeading,
} from "@template/public-ui";
import { useState } from "react";
import {
  marketingBlogPosts,
  marketingContactDetails,
  marketingFaqs,
  marketingFeatures,
  marketingFooterGroups,
  marketingIntervals,
  marketingLegalSections,
  marketingNavigation,
  register,
  signIn,
} from "./__fixtures__/marketing";

/*
 * Representative previews of the `@template/public-ui` marketing components
 * (FE-UI-005) with generic fixtures. Complete marketing pages are verified in
 * the Public Portal, not recreated here.
 */

function Brand() {
  return (
    <a
      className="text-fg flex items-center gap-2.5 text-lg font-bold"
      href="#home"
    >
      <span
        aria-hidden="true"
        className="bg-brand text-on-brand grid size-8 place-items-center rounded-md"
      >
        T
      </span>
      Template
    </a>
  );
}

function ChromePreview({ menuOpen = false }: { menuOpen?: boolean }) {
  const [open, setOpen] = useState(menuOpen);
  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <MarketingHeader
        activeHref="#features"
        brand={<Brand />}
        navigation={marketingNavigation}
        register={register}
        signIn={signIn}
      />
      <MarketingMobileMenu
        activeHref="#features"
        brand={<Brand />}
        navigation={marketingNavigation}
        onOpenChange={setOpen}
        open={open}
        register={register}
        signIn={signIn}
      />
      <main className="flex-1">
        <Hero
          actions={[register, { ...signIn, variant: "secondary" }]}
          description="A short lead paragraph that explains the product in a sentence or two."
          title="A headline that says what the product does."
        />
        <MarketingContainer className="flex justify-center pb-12 md:pb-20">
          <ProductShot />
        </MarketingContainer>
      </main>
      <MarketingFooter
        brand={<Brand />}
        copyright="Organization name. All rights reserved."
        description="One sentence about the product."
        groups={marketingFooterGroups}
      />
    </div>
  );
}

const meta = {
  component: ChromePreview,
  parameters: { bare: true, layout: "fullscreen" },
  title: "Marketing/Chrome",
} satisfies Meta<typeof ChromePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `1-marketing-site/PublicHome.html` chrome: header, hero, product shot, footer. */
export const HeaderAndFooter: Story = {};

/** `1-marketing-site/PublicMobileMenuMobile.html` (use the phone viewport). */
export const MobileMenuOpen: Story = { args: { menuOpen: true } };

/** Section components on the marketing page background. */
export const Sections: Story = {
  render: () => (
    <div className="bg-bg">
      <Hero
        description="Inner pages use the shorter hero."
        eyebrow="Eyebrow"
        size="page"
        title="Page hero title"
      />
      <MarketingSection tone="alt">
        <SectionHeading
          description="Section lead paragraph."
          eyebrow="Everything included"
          title="Feature card grid"
        />
        <FeatureGrid items={marketingFeatures} />
      </MarketingSection>
      <MarketingSection>
        <NumberedFeatureList items={marketingFeatures.slice(0, 3)} />
      </MarketingSection>
      <MarketingSection>
        <CtaBanner
          action={register}
          description="Call-to-action lead paragraph."
          title="Call to action"
        />
      </MarketingSection>
      <MarketingSection tone="alt">
        <SectionHeading title="Questions" />
        <FaqGrid items={marketingFaqs} />
      </MarketingSection>
      <MarketingSection>
        <BlogGrid posts={marketingBlogPosts} />
      </MarketingSection>
    </div>
  ),
};

/** Plan cards with the interval switch, and their loading placeholder. */
export const Pricing: Story = {
  render: () => (
    <div className="bg-bg flex flex-col gap-12 py-12">
      <MarketingContainer>
        <PricingIntervals intervals={marketingIntervals} />
      </MarketingContainer>
      <MarketingContainer>
        <PlanGridSkeleton />
      </MarketingContainer>
    </div>
  ),
};

/** `1-marketing-site/PublicContact.html` layout with a placeholder form. */
export const Contact: Story = {
  render: () => (
    <div className="bg-bg py-12">
      <ContactLayout details={marketingContactDetails}>
        <p className="text-fg-muted">The application supplies the form.</p>
      </ContactLayout>
    </div>
  ),
};

/** `1-marketing-site/PublicLegal.html`. */
export const Legal: Story = {
  render: () => (
    <div className="bg-bg">
      <LegalDocument
        currentHref="#privacy"
        documents={[
          { label: "Privacy policy", href: "#privacy" },
          { label: "Terms of service", href: "#terms" },
        ]}
        sections={marketingLegalSections}
        title="Privacy policy"
        updated="[date]"
      />
    </div>
  ),
};
