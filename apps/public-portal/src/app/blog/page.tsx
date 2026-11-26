import type { Metadata } from "next";
import { BlogGrid, Hero, MarketingContainer } from "@template/public-ui";
import { posts } from "@/config/site";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas and practical guidance for product teams.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <main>
      <Hero
        description="Ideas and practical guidance for product teams."
        eyebrow="Blog"
        size="page"
        title="News and guides"
      />
      <MarketingContainer className="pb-12 md:pb-20">
        <BlogGrid posts={posts} />
      </MarketingContainer>
    </main>
  );
}
