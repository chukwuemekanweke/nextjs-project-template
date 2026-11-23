import type { Metadata } from "next";
import { connection } from "next/server";
import {
  BlogCard,
  ContactSection,
  Cta,
  Faq,
  Features,
  Hero,
  LogoCloud,
  Testimonials,
} from "@template/public-ui";
import {
  faqs,
  features,
  logos,
  planMarketing,
  posts,
  site,
  testimonials,
} from "@/config/site";
import { SubscriptionPricing } from "@/components/subscription-pricing";
import { env } from "@/config/env";
import { loadSubscriptionPlans } from "@/lib/subscription-plans";
export const metadata: Metadata = {
  title: "Modern product experiences",
  description: site.description,
  alternates: { canonical: "/" },
};
export default async function Home() {
  // Per-request render keeps builds independent of the API; plans are cached.
  await connection();
  const plans = await loadSubscriptionPlans();
  return (
    <main>
      <Hero
        eyebrow="A complete product foundation"
        title="Build better products"
        highlighted="faster"
        description={site.description}
        primaryAction={site.register}
        secondaryAction={{ label: "Explore features", href: "/features" }}
      />
      <LogoCloud items={logos} />
      <Features
        heading="Everything your team needs to move forward"
        items={features}
      />
      <Cta
        title="Ready to build what comes next?"
        description="Start with a strong foundation and shape it around your product."
        action={site.register}
      />
      <Faq heading="Frequently asked questions" items={faqs} />
      <Testimonials heading="Trusted by ambitious teams" items={testimonials} />
      <SubscriptionPricing
        heading="Simple plans for every stage"
        marketing={planMarketing}
        plans={plans}
        userPortalUrl={env.userPortalUrl}
      />
      <ContactSection
        heading="Send a message"
        description="Talk with our team about your goals."
        email={site.email}
        address={site.address}
      />
      <section className="py-20">
        <div className="max-w-c-1315 mx-auto px-4 md:px-8">
          <div className="grid gap-7.5 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.title} post={post} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
