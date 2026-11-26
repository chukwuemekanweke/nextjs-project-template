import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ActivityTable,
  IdentityVerificationCallout,
  MetricCard,
  ProfileSummaryCard,
  SecurityChecklist,
} from "./dashboard-sections";
import {
  previewActivityRows,
  previewMetrics,
  previewVerificationCallout,
} from "./dashboard-preview.fixtures";

describe("MetricCard", () => {
  it("renders a ready value with its detail", () => {
    const markup = renderToStaticMarkup(
      <MetricCard
        icon={null}
        label="Current plan"
        metric={{ detail: "Renews Dec 14, 2026", state: "ready", value: "Pro" }}
      />,
    );
    expect(markup).toMatch(/<h2[^>]*>Current plan<\/h2>/);
    expect(markup).toContain(">Pro<");
    expect(markup).toContain("Renews Dec 14, 2026");
  });

  it("announces loading without showing a value", () => {
    const markup = renderToStaticMarkup(
      <MetricCard
        icon={null}
        label="Active sessions"
        metric={{ state: "loading" }}
      />,
    );
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading active sessions");
  });

  it("states that data is unavailable and why", () => {
    const markup = renderToStaticMarkup(
      <MetricCard
        icon={null}
        label="Wallet balance"
        metric={{
          detail: "Wallet is not available yet.",
          state: "unavailable",
        }}
        unavailableLabel="Not available"
      />,
    );
    expect(markup).toContain(">Not available<");
    expect(markup).toContain("Wallet is not available yet.");
    expect(markup).not.toContain("₦");
  });
});

describe("ProfileSummaryCard", () => {
  const render = (isVerified: boolean) =>
    renderToStaticMarkup(
      <ProfileSummaryCard
        avatarUrl={null}
        emailAddress="grace@example.com"
        isVerified={isVerified}
        name="Grace Hopper"
      />,
    );

  it("shows the live identity with initials fallback and an edit link", () => {
    const markup = render(true);
    expect(markup).toContain("Grace Hopper");
    expect(markup).toContain("grace@example.com");
    expect(markup).toContain(">GH<");
    expect(markup).toMatch(/<a[^>]*href="\/profile"[^>]*>Edit profile<\/a>/);
    expect(markup).toContain("Account verified");
  });

  it("keeps account verification distinct from KYC and omits unsupported fields", () => {
    const markup = render(false);
    expect(markup).toContain("Verification pending");
    for (const unsupported of ["KYC", "Country", "Language", "Member since"]) {
      expect(markup).not.toContain(unsupported);
    }
  });
});

describe("SecurityChecklist", () => {
  it("carries each status in text and offers an action only for missing steps", () => {
    const markup = renderToStaticMarkup(
      <SecurityChecklist
        action={(item) => <a href="/security">Add {item.id}</a>}
        items={[
          {
            description: "Authenticator app · 8 recovery codes left",
            id: "two-factor",
            status: "done",
            title: "Two-factor authentication",
          },
          {
            description: "Status could not be loaded.",
            id: "passkey",
            status: "unavailable",
            title: "Passkey",
          },
          {
            description: "Add one on another device in case you lose this one.",
            id: "backup-passkey",
            status: "todo",
            title: "Backup passkey",
          },
        ]}
      />,
    );
    expect(markup).toContain("Done: </span>Two-factor authentication");
    expect(markup).toContain("Unavailable: </span>Passkey");
    expect(markup).toContain("Recommended: </span>Backup passkey");
    expect(markup.match(/href="\/security"/g)).toHaveLength(1);
    expect(markup).toContain("Add backup-passkey");
  });
});

describe("ActivityTable", () => {
  it("renders the reference columns and stacks rows on phones", () => {
    const markup = renderToStaticMarkup(
      <ActivityTable
        caption="Recent billing activity"
        rows={previewActivityRows}
      />,
    );
    for (const header of ["Date", "Description", "Status", "Amount"]) {
      expect(markup).toContain(`>${header}<`);
    }
    expect(markup).toContain('data-label="Amount"');
    expect(markup).toContain("max-md:block");
  });

  it("shows the supplied empty and error states instead of rows", () => {
    expect(
      renderToStaticMarkup(
        <ActivityTable
          caption="Activity"
          empty={<p>Nothing yet</p>}
          rows={[]}
        />,
      ),
    ).toContain("Nothing yet");
    expect(
      renderToStaticMarkup(
        <ActivityTable
          caption="Activity"
          error={<p>Could not load</p>}
          rows={previewActivityRows}
        />,
      ),
    ).not.toContain("Wallet top-up");
  });
});

describe("preview fixtures", () => {
  it("present the full reference design through the same sections", () => {
    const markup = renderToStaticMarkup(
      <>
        <IdentityVerificationCallout
          action={
            <button type="button">
              {previewVerificationCallout.actionLabel}
            </button>
          }
          title={previewVerificationCallout.title}
        >
          {previewVerificationCallout.body}
        </IdentityVerificationCallout>
        <MetricCard
          icon={null}
          label="Wallet balance"
          metric={previewMetrics.wallet}
        />
        <ActivityTable caption="Recent activity" rows={previewActivityRows} />
      </>,
    );
    expect(markup).toContain("Verify your identity");
    expect(markup).toContain("₦42,500.00");
    expect(markup).toContain("Wallet top-up · Bachs");
  });

  it("are never imported by production modules", () => {
    const directory = fileURLToPath(new URL(".", import.meta.url));
    const productionFiles = readdirSync(directory).filter(
      (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file),
    );
    expect(productionFiles).toContain("page.tsx");
    for (const file of productionFiles) {
      const source = readFileSync(`${directory}/${file}`, "utf8");
      expect(source, file).not.toMatch(
        /from "\.\/dashboard-preview\.fixtures"/,
      );
    }
  });
});
