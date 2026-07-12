import type { Metadata } from "next";
import { BlogCard } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { posts } from "@/config/site";
export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas and practical guidance for product teams.",
  alternates: { canonical: "/blog" },
};
export default function BlogPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Blog"
        title="Ideas for building"
        highlighted="better"
        description="Practical guidance for teams creating dependable product experiences."
      />
      <section className="pb-25">
        <div className="max-w-c-1315 mx-auto grid gap-7.5 px-4 md:px-8 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.title} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
