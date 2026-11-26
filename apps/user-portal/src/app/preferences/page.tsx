import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  FormField,
  ListRow,
  Select,
  Switch,
  ThemeSelect,
} from "@template/ui-core";

export const metadata: Metadata = { title: "Preferences" };

/**
 * Account preferences (USR-PREFERENCES). Only the theme is functional: it
 * uses the shared `ThemeProvider` (applied immediately, stored per portal on
 * this device). Language and email notifications have no backend API yet
 * (DR-051), so they are shown as unavailable and nothing here claims to save
 * them.
 */
export default function PreferencesPage() {
  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Choose how the portal looks on this device."
        title="Preferences"
      />
      <ThemeCard />
      <LanguageCard />
      <NotificationsCard />
    </section>
  );
}

function ThemeCard() {
  return (
    <Card aria-labelledby="theme-heading" role="region">
      <CardHeader>
        <CardTitle id="theme-heading">Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-fg font-semibold">Appearance</p>
          <CardDescription>
            Light uses blue and white. Dark uses neutral greys that are easy on
            the eyes at night. System follows your device setting.
          </CardDescription>
        </div>
        <ThemeSelect label="Appearance" />
        <p className="text-small text-fg-subtle" id="theme-persistence">
          Changes apply immediately and are remembered in this browser. Your
          theme is not saved to your account.
        </p>
      </CardContent>
    </Card>
  );
}

function LanguageCard() {
  return (
    <Card aria-labelledby="language-heading" role="region">
      <CardHeader>
        <CardTitle id="language-heading">Language</CardTitle>
        <Chip>Not available yet</Chip>
      </CardHeader>
      <CardContent>
        <FormField
          className="md:max-w-sm"
          descriptionId="language-hint"
          hint="The portal is currently available in English only. Choosing a language is not supported yet."
          inputId="language"
          label="Language"
        >
          <Select
            aria-describedby="language-hint"
            defaultValue="en"
            disabled
            id="language"
          >
            <option value="en">English</option>
          </Select>
        </FormField>
      </CardContent>
    </Card>
  );
}

const optionalNotifications = [
  {
    description: "Receipts, renewals and failed payments.",
    id: "billing",
    title: "Billing emails",
  },
  {
    description: "New features and occasional tips.",
    id: "product",
    title: "Product updates",
  },
] as const;

function NotificationsCard() {
  return (
    <Card aria-labelledby="notifications-heading" role="region">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle id="notifications-heading">Email notifications</CardTitle>
          <CardDescription>
            Proposed settings. Email preferences cannot be changed or saved yet.
          </CardDescription>
        </div>
        <Chip>Proposed</Chip>
      </CardHeader>
      <ul>
        <ListRow
          actions={
            <Switch
              aria-describedby="security-alerts-description"
              aria-label="Security alerts (always on)"
              checked
              disabled
            />
          }
          as="li"
          description={
            <span id="security-alerts-description">
              New sign-ins, password and two-factor changes. Always on for your
              protection.
            </span>
          }
          title="Security alerts"
        />
        {optionalNotifications.map((item) => (
          <ListRow
            actions={<Badge tone="neutral">Not available</Badge>}
            as="li"
            description={item.description}
            key={item.id}
            title={item.title}
          />
        ))}
      </ul>
    </Card>
  );
}
