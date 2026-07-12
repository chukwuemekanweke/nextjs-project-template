"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "../types";

const reveal = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <motion.article
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="shadow-solid-8 dark:bg-blacksection rounded-lg bg-white p-4 pb-9"
    >
      <Link href={post.href} className="relative block aspect-368/239">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="rounded-sm object-cover"
        />
      </Link>
      <div className="px-4">
        <h3 className="hover:text-primary xl:text-itemtitle2 mt-7.5 mb-3.5 text-lg font-medium text-black dark:text-white">
          <Link href={post.href}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
      </div>
    </motion.article>
  );
}
