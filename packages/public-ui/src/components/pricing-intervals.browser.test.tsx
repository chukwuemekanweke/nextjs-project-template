import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { PricingIntervals } from "./pricing-intervals";

const plan = (
  name: string,
  price: string,
  cadence: string,
  interval: string,
) => ({
  action: { label: "Subscribe", href: `#${name}-${interval}` },
  cadence,
  description: `${name} plan`,
  name,
  price,
});

const intervals = [
  {
    label: "Monthly",
    plans: [
      plan("Basic", "NGN 5,000.00", "month", "Monthly"),
      plan("Team", "NGN 9,000.00", "month", "Monthly"),
    ],
    value: "Monthly",
  },
  {
    label: "Yearly",
    plans: [plan("Team", "NGN 90,000.00", "year", "Yearly")],
    value: "Yearly",
  },
];

describe("PricingIntervals", () => {
  it("switches the plan cards between intervals from the keyboard", async () => {
    await render(<PricingIntervals intervals={intervals} />);
    const monthly = page.getByRole("radio", { name: "Monthly" });
    const yearly = page.getByRole("radio", { name: "Yearly" });
    await expect.element(page.getByLabelText("Billing interval")).toBeVisible();

    await expect.element(monthly).toBeChecked();
    await expect.element(page.getByText("NGN 9,000.00")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Subscribe: Basic" }))
      .toHaveAttribute("href", "#Basic-Monthly");

    await userEvent.click(yearly);
    await expect.element(yearly).toBeChecked();
    await expect.element(page.getByText("NGN 90,000.00")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Subscribe: Basic" }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("link", { name: "Subscribe: Team" }))
      .toHaveAttribute("href", "#Team-Yearly");

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(monthly).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByText("NGN 5,000.00")).toBeVisible();
  });

  it("renders only the plans when a single interval is offered", async () => {
    await render(<PricingIntervals intervals={intervals.slice(0, 1)} />);
    await expect
      .element(page.getByRole("radio", { name: "Monthly" }))
      .not.toBeInTheDocument();
    await expect.element(page.getByText("NGN 5,000.00")).toBeVisible();
  });
});
