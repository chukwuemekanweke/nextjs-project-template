"use client";

import { Alert, Card, CardContent, Skeleton } from "@template/ui-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { billingRoutes } from "@/config/billing";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { secondaryButtonClass } from "../../billing-ui";

/** Resolves the remembered purchase id; provider query parameters are ignored. */
export function CheckoutReturn() {
  const router = useRouter();
  const attempt = useRememberedCheckoutAttempt();
  const purchaseId = attempt?.purchaseId;

  useEffect(() => {
    if (purchaseId) router.replace(billingRoutes.purchase(purchaseId));
  }, [purchaseId, router]);

  if (attempt === undefined || purchaseId) {
    return (
      <div aria-busy="true" aria-label="Finding your checkout" role="status">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <Alert variant="info">
          We could not find a recent checkout in this browser. Your billing page
          shows your current subscription and payment history.
        </Alert>
        <Link className={secondaryButtonClass} href={billingRoutes.overview}>
          Go to billing
        </Link>
      </CardContent>
    </Card>
  );
}
