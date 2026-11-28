import type { Metadata } from "next";
import { VerificationLive } from "@/features/verification/verification-live";

export const metadata: Metadata = { title: "Identity verification" };

/** Authenticated provider-return and identity-verification page. */
export default function VerificationPage() {
  return <VerificationLive />;
}
