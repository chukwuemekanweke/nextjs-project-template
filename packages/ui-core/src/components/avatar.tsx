"use client";

import { useState } from "react";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md" | "lg";

const avatarSizes: Record<AvatarSize, string> = {
  sm: "size-8 text-caption",
  md: "size-10 text-label",
  lg: "size-22 text-[1.75rem]",
};

/** Up to two initials from a display name ("Ada Okafor" → "AO"). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "";
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const initial = (word: string) => Array.from(word)[0] ?? "";
  return (initial(first) + (last ? initial(last) : "")).toLocaleUpperCase();
}

/**
 * Circular avatar (reference `.avatar`, `.avatar.lg`): the image when it
 * loads, otherwise the initials. Pass `decorative` when the name is already
 * shown next to it.
 */
export function Avatar({
  className,
  decorative = false,
  name,
  size = "md",
  src,
}: Readonly<{
  className?: string;
  decorative?: boolean;
  name: string;
  size?: AvatarSize;
  src?: string | null;
}>) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      className={cn(
        "bg-brand-soft-2 text-brand-ink relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold",
        avatarSizes[size],
        className,
      )}
      role={decorative ? undefined : "img"}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
      {showImage && src ? (
        // A plain <img>: avatars are small, often remote, and must not
        // depend on Next.js image configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : null}
    </span>
  );
}
