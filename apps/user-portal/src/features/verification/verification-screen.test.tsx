import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  VerificationActionSlot,
  VerificationHistoryCard,
  VerificationScreen,
  VerificationStatusPanel,
} from "./verification-sections";
import type { VerificationIntent } from "./verification-model";
import {
  FIXTURE_REJECTION_REASON,
  fixtureAttempt,
  fixtureHistory,
  fixtureScreen,
  fixtureVerification,
  verificationFixtureStatuses,
} from "./verification-preview.fixtures";

/*
 * Isolated harness for USR-VERIFICATION: every reference state is rendered
 * from typed fixtures. There is no production route (DR-054).
 */

const utc = { timeZone: "UTC" } as const;
const noop = () => undefined;

function render(node: ReactNode) {
  return renderToStaticMarkup(node);
}

/** Finds the action `Button` element returned by the slot (no DOM needed). */
function actionButton(element: ReactNode): ReactElement<{
  disabled?: boolean;
  onClick?: () => void;
}> {
  if (!isValidElement<{ children?: ReactNode }>(element)) {
    throw new Error("No action rendered");
  }
  const children = ([] as ReactNode[]).concat(element.props.children);
  const button = children.find(
    (child) =>
      isValidElement<Record<string, unknown>>(child) &&
      "data-intent" in child.props,
  );
  if (!isValidElement<{ disabled?: boolean; onClick?: () => void }>(button)) {
    throw new Error("No action button");
  }
  return button;
}

describe("VerificationScreen states", () => {
  const expectations = {
    expired: ["Your verification session expired", "Start again"],
    inProgress: ["Verification in progress", "Continue verification"],
    notStarted: ["Verify your identity", "Start verification"],
    pending: ["We&#x27;re reviewing your documents", "Refresh status"],
    rejected: ["Verification was not approved", "Try again"],
    verified: ["You&#x27;re verified", "Verified on Jan 15, 2026"],
  } as const;

  for (const status of verificationFixtureStatuses) {
    it(`renders the ${status} state with header and history`, () => {
      const markup = render(
        <VerificationScreen
          dates={utc}
          model={fixtureScreen(status)}
          onAction={noop}
        />,
      );
      expect(markup).toMatch(/<h1[^>]*>Identity verification<\/h1>/);
      expect(markup).toContain(`data-status="${status}"`);
      for (const text of expectations[status]) {
        expect(markup, status).toContain(text);
      }
      expect(markup).toContain("Verification history");
    });
  }

  it("shows instruction steps only before verification starts", () => {
    const steps = /<ol aria-label="Verification steps"/;
    expect(
      render(<VerificationScreen model={fixtureScreen("notStarted")} />),
    ).toMatch(steps);
    for (const status of verificationFixtureStatuses.filter(
      (value) => value !== "notStarted",
    )) {
      expect(
        render(<VerificationScreen model={fixtureScreen(status)} />),
        status,
      ).not.toMatch(steps);
    }
  });

  it("does not repeat reference sample identity, dates or claims", () => {
    for (const status of verificationFixtureStatuses) {
      const markup = render(
        <VerificationScreen dates={utc} model={fixtureScreen(status)} />,
      );
      for (const sample of [
        "Ada Okafor",
        "example.com",
        "25 Nov 2026",
        "3 minutes",
        "24 hours",
        "payouts",
        "higher limits",
      ]) {
        expect(markup, `${status}: ${sample}`).not.toContain(sample);
      }
    }
  });
});

describe("VerificationStatusPanel", () => {
  it("shows a verified status badge in text with no action", () => {
    const markup = render(
      <VerificationStatusPanel
        dates={utc}
        onAction={noop}
        verification={fixtureVerification("verified")}
      />,
    );
    expect(markup).toContain(">Verified</span>");
    expect(markup).not.toContain("<button");
  });

  it("omits the verified date when the source has none", () => {
    const markup = render(
      <VerificationStatusPanel verification={{ status: "verified" }} />,
    );
    expect(markup).toContain("Your identity has been verified.");
    expect(markup).not.toContain("Verified on");
  });

  it("shows a supplied rejection reason, wrapping long text", () => {
    const reason = `${FIXTURE_REJECTION_REASON} ${"Extra detail. ".repeat(40)}`;
    const markup = render(
      <VerificationStatusPanel
        onAction={noop}
        verification={fixtureVerification("rejected", { reason })}
      />,
    );
    expect(markup).toContain(FIXTURE_REJECTION_REASON);
    expect(markup).toContain("break-words");
  });

  it("does not invent a reason and offers support when retry is not allowed", () => {
    const markup = render(
      <VerificationStatusPanel
        supportEmail="support@fixture.test"
        verification={{ retryAllowed: false, status: "rejected" }}
      />,
    );
    expect(markup).toContain("No reason was provided for this decision.");
    expect(markup).not.toContain("Try again");
    expect(markup).toContain('href="mailto:support@fixture.test"');
  });

  it("disables actions with an explanation when no handler is supplied", () => {
    const markup = render(
      <VerificationStatusPanel
        verification={fixtureVerification("notStarted")}
      />,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-describedby="verification-action-hint"[^>]*disabled=""/,
    );
    expect(markup).toContain("Identity verification is not available yet.");
  });

  it("keeps an accessible name on every action button", () => {
    for (const status of verificationFixtureStatuses) {
      const markup = render(
        <VerificationStatusPanel
          onAction={noop}
          verification={fixtureVerification(status)}
        />,
      );
      for (const button of markup.match(/<button[^>]*>.*?<\/button>/g) ?? []) {
        expect(button.replace(/<[^>]+>/g, "").trim(), status).not.toBe("");
        expect(button, status).toContain('type="button"');
      }
    }
  });

  it("marks the busy intent without starting anything else", () => {
    const markup = render(
      <VerificationStatusPanel
        busyIntent="refresh"
        onAction={noop}
        verification={fixtureVerification("pending")}
      />,
    );
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("Start verification");
  });
});

describe("VerificationActionSlot", () => {
  const cases: [
    Parameters<typeof fixtureVerification>[0],
    VerificationIntent,
  ][] = [
    ["notStarted", "start"],
    ["inProgress", "continue"],
    ["pending", "refresh"],
    ["rejected", "retry"],
    ["expired", "start"],
  ];

  for (const [status, intent] of cases) {
    it(`reports the ${intent} intent for ${status} and nothing more`, () => {
      const onAction = vi.fn();
      const button = actionButton(
        VerificationActionSlot({
          onAction,
          verification: fixtureVerification(status),
        }),
      );
      button.props.onClick?.();
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledWith(intent);
    });
  }

  it("renders nothing for a verified user", () => {
    expect(
      VerificationActionSlot({
        onAction: noop,
        verification: fixtureVerification("verified"),
      }),
    ).toBeNull();
  });

  it("has no click handler when not wired", () => {
    const button = actionButton(
      VerificationActionSlot({ verification: fixtureVerification("expired") }),
    );
    expect(button.props.disabled).toBe(true);
    expect(button.props.onClick).toBeUndefined();
  });
});

describe("VerificationHistoryCard", () => {
  it("renders the reference columns and keeps every field on phones", () => {
    const markup = render(
      <VerificationHistoryCard
        dates={utc}
        history={fixtureHistory("pending")}
      />,
    );
    for (const header of ["Attempt", "Started", "Status", "Updated"]) {
      expect(markup).toContain(`>${header}</th>`);
      expect(markup).toContain(`data-label="${header}"`);
    }
    expect(markup).toContain("max-md:block");
    expect(markup).toContain(">#2<");
    expect(markup).toContain('<time dateTime="2026-01-12T09:00:00Z">');
    expect(markup).toContain("Jan 12, 2026, 9:00 AM");
    expect(markup).toContain(">Pending</span>");
    expect(markup).toContain(">Rejected</span>");
  });

  it("states a missing update time in text", () => {
    const markup = render(
      <VerificationHistoryCard
        history={{
          attempts: [fixtureAttempt(1, "unknown", { updatedAt: undefined })],
          state: "ready",
        }}
      />,
    );
    expect(markup).toContain("Not available");
    expect(markup).toContain(">Unknown</span>");
  });

  it("shows an empty state", () => {
    const markup = render(
      <VerificationHistoryCard history={fixtureHistory("notStarted")} />,
    );
    expect(markup).toContain("No verification attempts yet");
  });

  it("shows loading and error states without rows", () => {
    const loading = render(
      <VerificationHistoryCard history={{ state: "loading" }} />,
    );
    expect(loading).toContain("Loading verification history");
    expect(loading).toContain('aria-busy="true"');

    const error = render(
      <VerificationHistoryCard history={{ state: "error" }} onReload={noop} />,
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain("History unavailable");
    expect(error).toContain("Try again");
  });

  it("is omitted when the source provides no history", () => {
    expect(
      render(<VerificationHistoryCard history={{ state: "unavailable" }} />),
    ).toBe("");
  });
});

describe("VerificationScreen loading, error and unknown", () => {
  it("announces loading without sample content", () => {
    const markup = render(<VerificationScreen model={{ state: "loading" }} />);
    expect(markup).toContain("Loading verification status");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("Verify your identity");
  });

  it("shows an error with a reload intent", () => {
    const markup = render(
      <VerificationScreen model={{ state: "error" }} onReload={noop} />,
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Verification status unavailable");
    expect(markup).toContain("Try again");
  });

  it("treats an unrecognised status as unknown with no action", () => {
    const markup = render(
      <VerificationScreen
        model={{ history: { state: "unavailable" }, state: "unknown" }}
        onAction={noop}
        supportEmail="support@fixture.test"
      />,
    );
    expect(markup).toContain('data-status="unknown"');
    expect(markup).toContain("couldn&#x27;t confirm your verification status");
    expect(markup).not.toContain("<button");
    expect(markup).toContain("support@fixture.test");
  });
});

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));

  function productionFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return productionFiles(path);
      return /\.tsx?$/.test(entry) &&
        !/\.test\.tsx?$/.test(entry) &&
        !entry.endsWith(".fixtures.ts")
        ? [path]
        : [];
    });
  }

  it("never imports the preview fixtures from production modules", () => {
    const files = productionFiles(sourceRoot);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /from "[^"]*verification-preview\.fixtures"/,
      );
    }
  });

  it("adds no production route or navigation entry", () => {
    const appDirectory = join(sourceRoot, "app");
    expect(() => statSync(join(appDirectory, "verification"))).toThrow();
    const navigation = readFileSync(
      join(sourceRoot, "config", "navigation.ts"),
      "utf8",
    );
    expect(navigation).not.toMatch(/href: "\/verification"/);
  });
});
