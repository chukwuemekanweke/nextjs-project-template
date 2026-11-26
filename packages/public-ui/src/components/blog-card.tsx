import {
  Card,
  CardContent,
  Chip,
  FileTextIcon,
  IconTile,
} from "@template/ui-core";
import Link from "next/link";
import type { BlogPost } from "../types";

/**
 * Blog post card (reference `PublicBlog`): a brand-tinted banner with an
 * icon, category chip, title, excerpt and optional date. The title links to
 * `href` only when a post page exists.
 */
export function BlogCard({ post }: Readonly<{ post: BlogPost }>) {
  return (
    <article className="h-full scroll-mt-24" id={post.id}>
      <Card className="flex h-full flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-brand-soft grid h-40 place-items-center"
        >
          <IconTile className="size-14 [&_svg]:size-6">
            {post.icon ?? <FileTextIcon />}
          </IconTile>
        </div>
        <CardContent className="flex flex-col items-start gap-2">
          {post.category ? <Chip>{post.category}</Chip> : null}
          <h3 className="text-h3 text-fg">
            {post.href ? (
              <Link className="hover:underline" href={post.href}>
                {post.title}
              </Link>
            ) : (
              post.title
            )}
          </h3>
          <p className="text-small text-fg-muted">{post.excerpt}</p>
          {post.date ? (
            <time
              className="text-caption text-fg-subtle"
              dateTime={post.date.dateTime}
            >
              {post.date.label}
            </time>
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}

/** Blog cards: one column on phones, two on tablets, three from `lg`. */
export function BlogGrid({ posts }: Readonly<{ posts: readonly BlogPost[] }>) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id ?? post.title}>
          <BlogCard post={post} />
        </li>
      ))}
    </ul>
  );
}
