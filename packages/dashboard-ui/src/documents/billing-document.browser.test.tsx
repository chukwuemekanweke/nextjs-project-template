import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { emulateMedia } from "../../test/print-media";
import {
  BillingDocument,
  type BillingDocumentLineItem,
  type BillingDocumentProps,
} from "./billing-document";

/*
 * The billing document sheet in a real browser: light paper in every theme,
 * print-media layout (no card frame, repeated table header, unsplit rows and
 * totals) and phone layout without horizontal overflow. Generic sample
 * content; real invoices and receipts are composed in the apps.
 */

function items(count: number): BillingDocumentLineItem[] {
  return Array.from({ length: count }, (_, index) => ({
    amount: `${(index + 1) * 10}.00`,
    description: `Sample item ${index + 1} with a deliberately long description that wraps`,
    detail: "Secondary line",
    id: `item-${index + 1}`,
    quantity: String(index + 1),
    unitPrice: "10.00",
  }));
}

const props: BillingDocumentProps = {
  brandName: "Template",
  facts: [
    { label: "Issue date", value: "1 Jan 2026" },
    { label: "Reference", mono: true, value: "SAMPLE-REF-0001" },
  ],
  footerDetails: ["Sample issuer · Registration no. SAMPLE"],
  footerNotes: ["Sample note."],
  issuerName: "Sample issuer",
  lineItems: items(3),
  lineItemsCaption: "Sample line items",
  notice: { content: "Sample notice.", tone: "info" },
  number: "SAMPLE-0001",
  numberLabel: "Document no.",
  parties: [
    { label: "To", lines: ["Line one"], name: "Sample recipient" },
    { label: "From", name: "Sample issuer" },
  ],
  status: { label: "Sample", tone: "neutral" },
  title: "Document",
  totals: [
    { label: "Subtotal", value: "60.00" },
    { emphasis: "total", label: "Total", value: "60.00" },
    { emphasis: "balance", label: "Balance", value: "0.00" },
  ],
};

const sheet = () =>
  document.querySelector<HTMLElement>("[data-billing-document]")!;

afterEach(async () => {
  await emulateMedia("");
  await page.viewport(1440, 900);
  document.documentElement.classList.remove("dark");
});

describe("BillingDocument", () => {
  it("is a labelled article with an accessible line-item table", async () => {
    await render(<BillingDocument {...props} />);
    await expect
      .element(page.getByRole("article", { name: "Document" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("table", { name: "Sample line items" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("columnheader", { name: "Unit price" }))
      .toBeVisible();
    await expect
      .element(page.getByText("Sample", { exact: true }))
      .toBeVisible();
  });

  it("omits quantity and unit-price columns when no row has them", async () => {
    await render(
      <BillingDocument
        {...props}
        lineItems={[{ amount: "1.00", description: "Only", id: "only" }]}
      />,
    );
    expect(document.querySelectorAll("thead th")).toHaveLength(2);
  });

  it("stays light paper inside the dark theme", async () => {
    document.documentElement.classList.add("dark");
    await render(<BillingDocument {...props} />);
    const style = () => getComputedStyle(sheet());
    await expect.poll(() => style().backgroundColor).toBe("rgb(255, 255, 255)");
    expect(style().color).toBe("rgb(15, 23, 42)");
    expect(style().colorScheme).toBe("light");
  });

  it("drops the card frame and keeps rows and totals whole in print", async () => {
    document.documentElement.classList.add("dark");
    await render(<BillingDocument {...props} lineItems={items(60)} />);
    await emulateMedia("print");

    // Polled: the stylesheet can update after the first render.
    const style = () => getComputedStyle(sheet());
    await expect.poll(() => style().borderTopWidth).toBe("0px");
    await expect.poll(() => style().paddingLeft).toBe("0px");
    await expect.poll(() => style().maxWidth).toBe("none");
    await expect
      .poll(() => style().boxShadow)
      .toMatch(/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?)+$/);
    expect(style().backgroundColor).toBe("rgb(255, 255, 255)");
    expect(style().color).toBe("rgb(15, 23, 42)");
    // The page prints on light paper even in the dark theme.
    await expect
      .poll(() => getComputedStyle(document.body).backgroundColor)
      .toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(document.documentElement).colorScheme).toBe(
      "light",
    );

    expect(getComputedStyle(document.querySelector("thead")!).display).toBe(
      "table-header-group",
    );
    const row = document.querySelector("tbody tr")!;
    await expect.poll(() => getComputedStyle(row).breakInside).toBe("avoid");
    const totals = document.querySelector("[data-total]")!.closest("dl")!;
    expect(getComputedStyle(totals.parentElement!).breakInside).toBe("avoid");
    expect(document.querySelectorAll("tbody tr")).toHaveLength(60);
  });

  it("stacks line items on phones without horizontal overflow", async () => {
    await page.viewport(390, 844);
    await render(<BillingDocument {...props} />);
    const article = sheet();
    expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
    expect(document.documentElement.scrollWidth).toBe(390);
    const quantityCell = document.querySelector("tbody tr td:nth-child(2)")!;
    expect(getComputedStyle(quantityCell).display).toBe("none");
    await expect
      .element(page.getByText("Qty 1 · Unit price 10.00"))
      .toBeVisible();
  });
});
