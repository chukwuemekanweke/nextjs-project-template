import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BillingDocument,
  type BillingDocumentLineItem,
} from "@template/dashboard-ui/documents";

/**
 * The printable document sheet with generic sample content. It stays light
 * paper in the dark theme; use the browser's print preview to see the print
 * layout. Invoices and receipts are composed and tested in the apps
 * (FE-UI-018); nothing here represents a real document or payment.
 */

function sampleItems(count: number): BillingDocumentLineItem[] {
  return Array.from({ length: count }, (_, index) => ({
    amount: `${(index + 1) * 10}.00`,
    description: `Sample item ${index + 1}`,
    detail: "Secondary description line",
    id: `item-${index + 1}`,
    quantity: "1",
    unitPrice: `${(index + 1) * 10}.00`,
  }));
}

const meta = {
  args: {
    brandName: "Template",
    facts: [
      { label: "Date", value: "1 Jan 2026" },
      { label: "Reference", mono: true, value: "SAMPLE-REF-0001" },
      { label: "Currency", value: "Sample units" },
    ],
    footerDetails: ["Sample issuer · Registration no. SAMPLE"],
    footerNotes: ["Footer notes appear here as supplied."],
    issuerName: "Sample issuer",
    lineItems: sampleItems(2),
    lineItemsCaption: "Sample line items",
    notice: { content: "A supplied notice, in its tone.", tone: "info" },
    number: "SAMPLE-0001",
    numberLabel: "Document no.",
    parties: [
      {
        label: "To",
        lines: ["recipient@example.invalid", "Sample city"],
        name: "Sample recipient",
      },
      { label: "From", lines: ["Sample street"], name: "Sample issuer" },
    ],
    status: { label: "Sample", tone: "neutral" },
    title: "Document",
    totals: [
      { label: "Subtotal", value: "30.00" },
      { emphasis: "total", label: "Total", value: "30.00" },
      { emphasis: "balance", label: "Balance", value: "0.00" },
    ],
  },
  component: BillingDocument,
  parameters: { layout: "padded" },
  title: "Dashboard/BillingDocument",
} satisfies Meta<typeof BillingDocument>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Highlight: Story = {
  args: {
    highlight: {
      detail: "Supplied secondary line",
      label: "Highlighted figure",
      value: "30.00",
    },
    notice: undefined,
  },
};

export const ManyLineItems: Story = {
  args: { lineItems: sampleItems(30) },
};

export const MinimalContent: Story = {
  args: {
    facts: [],
    footerDetails: [],
    footerNotes: [],
    highlight: undefined,
    issuerName: undefined,
    lineItems: [{ amount: "10.00", description: "Single item", id: "only" }],
    notice: undefined,
    parties: [],
    status: undefined,
  },
};
