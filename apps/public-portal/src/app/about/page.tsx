import type { Metadata } from "next";
import Image from "next/image";
import { Cta, Testimonials } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { site, testimonials } from "@/config/site";
export const metadata: Metadata = {
  title: "About",
  description: `Learn what drives ${site.name}.`,
  alternates: { canonical: "/about" },
};
export default function AboutPage() {
  return (
    <main>
      <PageIntro
        eyebrow="About us"
        title="A foundation for"
        highlighted="progress"
        description="We help teams move from an ambitious idea to a polished, dependable product experience."
      />
      <section className="pb-20">
        <div className="max-w-c-1235 mx-auto flex items-center gap-8 px-4 md:px-8 lg:gap-20">
          <div className="relative hidden aspect-[588/526.5] w-1/2 md:block">
            <Image
              src="/images/about/about-light-01.png"
              alt="Team product workspace"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src="/images/about/about-dark-01.png"
              alt="Team product workspace"
              fill
              className="hidden object-contain dark:block"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="xl:text-hero mb-6 text-3xl font-bold text-black dark:text-white">
              Made to become your own
            </h2>
            <p className="mb-5">
              Every section is driven by typed content, so teams can adopt the
              foundation without inheriting a fixed brand or business model.
            </p>
            <p>
              Independent applications share standards while remaining free to
              deploy and evolve on their own schedules.
            </p>
          </div>
        </div>
      </section>
      <Testimonials heading="What teams say" items={testimonials} />
      <Cta
        title="Build your next chapter"
        description="Use a proven visual foundation and make it unmistakably yours."
        action={site.register}
      />
    </main>
  );
}
