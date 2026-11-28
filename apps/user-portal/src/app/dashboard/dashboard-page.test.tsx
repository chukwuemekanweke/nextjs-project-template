import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: async () => ({
    profiles: { getProfile: state.getProfile },
  }),
}));
// Live widgets are covered in dashboard-live.test.tsx.
vi.mock("./dashboard-live", () => ({
  DashboardMetrics: () => <div data-testid="metrics" />,
  DashboardVerificationCallout: () => <div data-testid="verification" />,
  RecentBillingActivityCard: () => <div data-testid="activity" />,
  SecurityChecklistCard: () => <div data-testid="checklist" />,
}));

import DashboardPage from "./page";

const render = async () => renderToStaticMarkup(await DashboardPage());

beforeEach(() => {
  state.getProfile.mockResolvedValue({
    avatarUrl: null,
    emailAddress: "grace@example.com",
    firstName: "Grace",
    isVerified: true,
    lastName: "Hopper",
    stakeholderId: "st-1",
  });
});

describe("Dashboard page", () => {
  it("greets the signed-in user from the live profile", async () => {
    const markup = await render();

    expect(markup).toMatch(/<h1[^>]*>Welcome back, Grace<\/h1>/);
    expect(markup).toContain("Grace Hopper");
    expect(markup).toContain("grace@example.com");
    expect(markup).not.toContain("Ada");
  });

  it("composes the reference sections", async () => {
    const markup = await render();
    expect(markup).toContain('data-testid="metrics"');
    expect(markup).toContain('data-testid="verification"');
    expect(markup).toContain("Your profile");
    expect(markup).toContain('data-testid="checklist"');
    expect(markup).toContain('data-testid="activity"');
  });

  it("links View billing and omits unsupported wallet content", async () => {
    const markup = await render();

    expect(markup).toMatch(/<a[^>]*href="\/billing"[^>]*>View billing<\/a>/);
    expect(markup).not.toMatch(/Top up|\/wallet/);
  });

  it("renders the empty state when the profile has no identity", async () => {
    state.getProfile.mockResolvedValue({
      avatarUrl: null,
      emailAddress: " ",
      firstName: "",
      isVerified: false,
      lastName: "",
      stakeholderId: "st-1",
    });
    const markup = await render();

    expect(markup).toContain("Complete your account");
    expect(markup).toContain("Profile information is unavailable");
    expect(markup).not.toContain('data-testid="metrics"');
  });
});
