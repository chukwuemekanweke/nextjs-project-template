import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../page";
import { AdminDashboard } from "./admin-dashboard";
import {
  productionAdminDashboard,
  type AdminDashboardData,
} from "./admin-dashboard-data";
import { previewAdminDashboard } from "./admin-dashboard-preview.fixtures";

const render = (data: AdminDashboardData) =>
  renderToStaticMarkup(<AdminDashboard data={data} />);

function sectionState(markup: string, attribute: string, name: string) {
  return new RegExp(`data-${attribute}="${name}" data-state="([a-z]+)"`).exec(
    markup,
  )?.[1];
}

describe("admin dashboard route", () => {
  const markup = renderToStaticMarkup(<Home />);

  it("renders the operations overview with one h1", () => {
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("Operations overview");
  });

  it("shows every production panel as unavailable, never sample data", () => {
    for (const label of [
      "Total users",
      "Daily active users",
      "Payment volume",
      "Monthly recurring revenue",
    ]) {
      expect(sectionState(markup, "kpi", label), label).toBe("unavailable");
    }
    for (const title of [
      "New registrations",
      "Payments: successful vs failed",
    ]) {
      expect(sectionState(markup, "chart", title), title).toBe("unavailable");
    }
    expect(markup).toContain("Needs an admin analytics API.");
    expect(markup).toContain("Operational data is not connected yet");
    for (const sample of [
      "12,480",
      "₦",
      "Bachs",
      "Credo",
      "SafeHaven",
      ">0<",
    ]) {
      expect(markup).not.toContain(sample);
    }
  });

  it("links nowhere: report, KYC, subscription and provider routes do not exist", () => {
    expect(markup).not.toMatch(/<a\s/);
    for (const label of [
      "Open report",
      "Open KYC monitoring",
      "Review subscriptions",
      "Manage providers",
    ]) {
      expect(markup).not.toContain(label);
    }
  });

  it("keeps the UTC period filter disabled with its reason", () => {
    expect(markup).toMatch(/<select[^>]*disabled=""/);
    expect(markup).toContain("Last 30 days (UTC)");
    expect(markup).toContain("Available once admin analytics are connected.");
  });
});

describe("AdminDashboard with preview fixtures (test harness only)", () => {
  const markup = render(previewAdminDashboard);

  it("presents the full reference composition", () => {
    expect(markup).toContain("12,480");
    expect(markup).toContain("+4.2%");
    expect(markup).toContain("vs previous 30 days");
    expect(markup).toContain("27 Oct – 25 Nov 2026 (UTC)");
    expect(markup).toContain("SafeHaven");
    expect(markup).not.toContain("Operational data is not connected yet");
  });

  it("gives charts a text summary, a legend and a data table", () => {
    expect(markup).toContain("<figcaption");
    expect(markup).toContain("successful payments rose from 3,120 to 4,210");
    expect(markup).toContain("<caption>New registrations data</caption>");
    expect(markup).toMatch(/<li[^>]*>.*?Successful<\/li>/);
    // A missing week is reported as missing, not as zero.
    expect(markup).toContain("<td>Not reported</td>");
  });
});

describe("AdminDashboard panel states", () => {
  it("distinguishes a real zero from unavailable", () => {
    const markup = render({
      ...productionAdminDashboard,
      kpis: {
        ...productionAdminDashboard.kpis,
        totalUsers: { state: "ready", value: "0" },
      },
    });
    expect(sectionState(markup, "kpi", "Total users")).toBe("ready");
    expect(markup).toContain(">0<");
    expect(sectionState(markup, "kpi", "Daily active users")).toBe(
      "unavailable",
    );
  });

  it("renders loading, error and empty states", () => {
    const markup = render({
      ...previewAdminDashboard,
      kpis: {
        ...previewAdminDashboard.kpis,
        dailyActiveUsers: { state: "loading" },
        paymentVolume: {
          message: "Payments could not be loaded.",
          state: "error",
        },
      },
      kycQueue: { state: "loading" },
      payments: { message: "Payments could not be loaded.", state: "error" },
      registrations: { state: "empty" },
      subscriptionsNeedingAttention: {
        message: "No subscriptions need attention.",
        state: "empty",
      },
    });
    expect(markup).toContain("Loading daily active users");
    expect(markup).toContain("Loading kyc queue");
    expect(markup).toContain("Couldn&#x27;t load");
    expect(markup).toContain("Chart unavailable");
    expect(markup).toContain("No data for this period.");
    expect(markup).toContain("No subscriptions need attention.");
    expect(markup).not.toContain("1,912");
  });
});

describe("preview fixtures", () => {
  it("are never imported by production modules", () => {
    const directory = fileURLToPath(new URL("..", import.meta.url));
    const files = readdirSync(directory, { recursive: true, encoding: "utf8" })
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) => !/\.(test|fixtures)\.tsx?$/.test(file));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(`${directory}/${file}`, "utf8");
      expect(source, file).not.toMatch(/preview\.fixtures/);
    }
  });
});
