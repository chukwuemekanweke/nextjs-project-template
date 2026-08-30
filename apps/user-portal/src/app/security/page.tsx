import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@template/ui-core";
import { portalName } from "@/lib/portal";
import { PasswordChangeForm } from "./password-change-form";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="Update the credentials used to access your account."
        eyebrow={portalName}
        title="Account security"
      />
      <Card>
        <CardContent>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Confirm your current password before choosing a new one.
          </CardDescription>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </section>
  );
}
