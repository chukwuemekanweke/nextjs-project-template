"use client";

import { useEffect, useState } from "react";
import { largePrimaryButtonClass } from "../billing-ui";
import { ExternalLinkIcon, LockIcon, SpinnerIcon } from "./checkout-icons";

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
    <div className="py-4 text-center sm:py-8">
      <div aria-busy="true" aria-live="polite" role="status">
        <div className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24">
          <SpinnerIcon className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
          Taking you to {providerName}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-gray-500 sm:text-lg dark:text-gray-400">
          We&apos;re redirecting you to our secure payment provider to complete
          your subscription.
        </p>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-700 sm:text-base dark:text-gray-300">
          <LockIcon className="h-5 w-5 shrink-0 text-gray-500" />
          <span>You&apos;ll return here after checkout.</span>
        </p>
      </div>
      {showFallback ? (
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If the redirect doesn&apos;t happen automatically, you can continue
            manually.
          </p>
          <a
            className={`${largePrimaryButtonClass} mt-5 sm:w-auto sm:min-w-72`}
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
