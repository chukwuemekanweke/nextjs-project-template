import type { Metadata } from "next";
import {
  BlogCard,
  ContactSection,
  Cta,
  Faq,
  Features,
  Hero,
  LogoCloud,
  Pricing,
  Testimonials,
} from "@template/public-ui";
import {
  faqs,
  features,
  logos,
  plans,
  posts,
  site,
  testimonials,
} from "@/config/site";
export const metadata: Metadata = {
  title: "Modern product experiences",
  description: site.description,
  alternates: { canonical: "/" },
};
export default function Home() {
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
      <Pricing heading="Simple plans for every stage" plans={plans} />
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
