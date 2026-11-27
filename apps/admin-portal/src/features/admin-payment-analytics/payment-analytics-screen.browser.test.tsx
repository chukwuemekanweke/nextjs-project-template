import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { AdminOptionsState } from "@/components/admin-patterns";
import type { PaymentAnalyticsFilters } from "./payment-analytics-model";
import { paymentAnalyticsPreview } from "./payment-analytics-preview.fixtures";
import { PaymentAnalyticsScreen } from "./payment-analytics-screen";

const initialFilters: PaymentAnalyticsFilters = {
  currency: "NGN",
  interval: "day",
  provider: "",
  range: "30d",
};

const currencyOptions: AdminOptionsState = {
  options: [
    { label: "NGN", value: "NGN" },
    { label: "GHS", value: "GHS" },
  ],
  state: "ready",
};

const providerOptions: AdminOptionsState = {
  options: [{ label: "FixturePay", value: "fixture-pay" }],
  state: "ready",
};

/** Owns filters; the NGN data stays on screen while GHS "loads". */
function Harness({
  onFiltersChange,
}: Readonly<{ onFiltersChange: (filters: PaymentAnalyticsFilters) => void }>) {
  const [filters, setFilters] = useState(initialFilters);
  function change(next: PaymentAnalyticsFilters) {
    onFiltersChange(next);
    setFilters(next);
  }
  return (
    <PaymentAnalyticsScreen
      currencyOptions={currencyOptions}
      filters={filters}
      onFiltersChange={change}
      providerOptions={providerOptions}
      state={{ data: paymentAnalyticsPreview, state: "ready" }}
    />
  );
}

describe("PaymentAnalyticsScreen", () => {
  it("reports option changes and never relabels stale figures", async () => {
    const onFiltersChange = vi.fn();
    const screen = await render(<Harness onFiltersChange={onFiltersChange} />);

    await screen.getByLabelText("Provider").selectOptions("fixture-pay");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      provider: "fixture-pay",
    });

    await screen.getByLabelText("Currency").selectOptions("GHS");
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...initialFilters,
      currency: "GHS",
      provider: "fixture-pay",
    });
    await expect
      .element(
        screen.getByText(
          "Showing figures reported in NGN. GHS figures have not loaded yet.",
        ),
      )
      .toBeVisible();
    await expect.element(screen.getByText("Amounts in NGN")).toBeVisible();
  });
});
