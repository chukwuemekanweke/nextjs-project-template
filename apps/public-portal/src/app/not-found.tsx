import { Button } from "@template/ui-core";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-marketing mx-auto flex w-full flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center md:px-12 md:py-24">
      <span className="eyebrow">404</span>
      <h1 className="text-fg text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
        This page could not be found
      </h1>
      <p className="text-lead text-fg-muted max-w-160">
        The address may have changed, or the page may no longer exist.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
