"use client";

import { useEffect, useState } from "react";
import {
  ExternalLinkIcon,
  LockIcon,
  Spinner,
  buttonVariants,
} from "@template/ui-core";

/** How long automatic navigation gets before the manual link is offered. */
export const PROVIDER_REDIRECT_FALLBACK_DELAY_MS = 4_000;

/**
 * Shown while the browser leaves for the provider's hosted checkout. The
 * navigation itself is started once by the checkout submit handler; this view
 * never navigates, never polls, and shows no payment identifiers. `href` is
 * the backend-returned, already validated payment link.
 */
export function ProviderRedirect({
  fallbackDelayMs = PROVIDER_REDIRECT_FALLBACK_DELAY_MS,
  href,
  providerName,
}: Readonly<{
  fallbackDelayMs?: number;
  href: string;
  providerName: string;
}>) {
  const [showFallback, setShowFallback] = useState(fallbackDelayMs <= 0);

  useEffect(() => {
    if (fallbackDelayMs <= 0) return;
    const timer = window.setTimeout(
      () => setShowFallback(true),
      fallbackDelayMs,
    );
    return () => window.clearTimeout(timer);
  }, [fallbackDelayMs]);

  return (
    <div className="py-4 text-center md:py-6">
      <div aria-busy="true" aria-live="polite" role="status">
        <span className="bg-brand-soft text-brand-ink mx-auto inline-grid size-16 place-items-center rounded-full">
          <Spinner decorative size="lg" />
        </span>
        <h2 className="text-h2 text-fg mt-5">Taking you to {providerName}</h2>
        <p className="text-fg-muted mx-auto mt-2 max-w-md">
          We&apos;re redirecting you to our secure payment provider to complete
          your subscription.
        </p>
        <p className="text-small text-fg-muted mt-4 flex items-center justify-center gap-2">
          <LockIcon className="shrink-0" size="xs" />
          <span>You&apos;ll return here after checkout.</span>
        </p>
      </div>
      {showFallback ? (
        <div className="border-border mt-6 border-t pt-5">
          <p className="text-small text-fg-muted">
            If the redirect doesn&apos;t happen automatically, you can continue
            manually.
          </p>
          <a
            className={`${buttonVariants({ variant: "primary" })} mt-4`}
            href={href}
          >
            Continue to {providerName}
            <ExternalLinkIcon />
          </a>
        </div>
      ) : null}
    </div>
  );
}
