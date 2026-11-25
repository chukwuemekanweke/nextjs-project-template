import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Alert } from "./alert";
import { Badge, StatusBadge } from "./badge";
import { Avatar } from "./avatar";
import { Progress } from "./indicators";
import { Skeleton, SkeletonCard } from "./skeleton";
import { Spinner } from "./spinner";
import { EmptyState, ErrorState } from "./states";

describe("Alert", () => {
  it("uses alert semantics for errors and warnings, status otherwise", async () => {
    const screen = await render(
      <>
        <Alert variant="error">Payment failed.</Alert>
        <Alert variant="warning">Card expires soon.</Alert>
        <Alert variant="success">Saved.</Alert>
        <Alert variant="info">Heads up.</Alert>
      </>,
    );

    expect(screen.getByRole("alert").all()).toHaveLength(2);
    expect(screen.getByRole("status").all()).toHaveLength(2);
    // Each tone carries an icon, not only a colour.
    for (const region of screen.getByRole("alert").all()) {
      expect(region.element().querySelector("svg")).not.toBeNull();
    }
  });

  it("renders a title and an action", async () => {
    const screen = await render(
      <Alert action={<button type="button">Retry</button>} title="Sync failed">
        We could not reach the server.
      </Alert>,
    );
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Sync failed");
    await expect
      .element(screen.getByRole("button", { name: "Retry" }))
      .toBeVisible();
  });

  it("dismisses through a labelled button", async () => {
    const onDismiss = vi.fn();
    const screen = await render(
      <Alert onDismiss={onDismiss} variant="success">
        Saved.
      </Alert>,
    );
    await screen.getByRole("button", { name: "Dismiss alert" }).click();
    await expect.poll(() => onDismiss.mock.calls.length).toBe(1);
  });

  it("auto-dismisses after the given delay", async () => {
    const onDismiss = vi.fn();
    await render(
      <Alert autoDismissAfter={50} onDismiss={onDismiss}>
        Copied.
      </Alert>,
    );
    await expect.poll(() => onDismiss.mock.calls.length).toBe(1);
  });
});

describe("Badge", () => {
  it("renders the semantic tone with its text", async () => {
    const screen = await render(
      <>
        <Badge tone="success">Active</Badge>
        <StatusBadge tone="danger">Failed</StatusBadge>
      </>,
    );
    await expect
      .element(screen.getByText("Active"))
      .toHaveClass("bg-success-bg");
    await expect
      .element(screen.getByText("Failed"))
      .toHaveClass("bg-danger-bg");
  });
});

describe("Indicators", () => {
  it("exposes progress semantics", async () => {
    const screen = await render(
      <Progress
        label="Billing period"
        max={30}
        value={12}
        valueText="12 of 30 days"
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Billing period" });
    await expect.element(bar).toHaveAttribute("aria-valuenow", "12");
    await expect
      .element(bar)
      .toHaveAttribute("aria-valuetext", "12 of 30 days");
  });

  it("names an avatar and falls back to initials", async () => {
    const screen = await render(<Avatar name="Ada Okafor" />);
    const avatar = screen.getByRole("img", { name: "Ada Okafor" });
    await expect.element(avatar).toHaveTextContent("AO");
  });

  it("drops a failed avatar image and keeps the initials", async () => {
    const screen = await render(
      <Avatar name="Tunde Balogun" src="/does-not-exist.png" />,
    );
    const avatar = screen.getByRole("img", { name: "Tunde Balogun" });
    await expect.poll(() => avatar.element().querySelector("img")).toBeNull();
    await expect.element(avatar).toHaveTextContent("TB");
  });
});

describe("Loading states", () => {
  it("announces a standalone spinner", async () => {
    const screen = await render(<Spinner label="Loading sessions" />);
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Loading sessions");
  });

  it("announces composed skeletons and hides the blocks", async () => {
    const screen = await render(<SkeletonCard label="Loading profile" />);
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Loading profile");
    expect(
      screen.container.querySelectorAll("[aria-hidden='true']").length,
    ).toBeGreaterThan(0);
  });

  it("stops animating under prefers-reduced-motion", async () => {
    // The test browser runs with reducedMotion: "reduce".
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    const screen = await render(
      <>
        <Skeleton className="h-4 w-20" data-testid="skeleton" />
        <Spinner decorative />
      </>,
    );
    const skeleton = screen.getByTestId("skeleton").element();
    expect(getComputedStyle(skeleton).animationName).toBe("none");
    const spinner = screen.container.querySelector("svg") as SVGElement;
    expect(getComputedStyle(spinner).animationName).toBe("none");
  });
});

describe("Empty and error states", () => {
  it("renders an empty state with actions", async () => {
    const screen = await render(
      <EmptyState
        action={<button type="button">Add passkey</button>}
        description="Passkeys let you sign in without a password."
        secondaryAction={<a href="/help">Learn more</a>}
        title="No passkeys yet"
      />,
    );
    await expect.element(screen.getByText("No passkeys yet")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Add passkey" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Learn more" }))
      .toBeVisible();
  });

  it("announces an error and calls the retry callback", async () => {
    const onRetry = vi.fn();
    const screen = await render(<ErrorState onRetry={onRetry} />);

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Something went wrong");
    await screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("blocks repeated retries while retrying", async () => {
    const onRetry = vi.fn();
    const screen = await render(<ErrorState onRetry={onRetry} retrying />);
    const retry = screen.getByRole("button", { name: "Try again" });
    await expect.element(retry).toHaveAttribute("aria-busy", "true");
    await retry.click({ force: true });
    expect(onRetry).not.toHaveBeenCalled();
  });
});
