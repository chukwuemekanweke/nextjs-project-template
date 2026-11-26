import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CapturedDialogProps = {
  children?: ReactNode;
  dismissible?: boolean;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
};

const dialogCalls = vi.hoisted(() => [] as CapturedDialogProps[]);

// Portalled Radix dialogs do not server-render. This stand-in records the
// props and exposes title, content and footer; focus trapping, Escape and
// focus return are covered by the ui-core Dialog browser tests.
vi.mock("@template/ui-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@template/ui-core")>()),
  Dialog: (props: CapturedDialogProps) => {
    dialogCalls.push(props);
    return props.open
      ? createElement(
          "div",
          {
            "aria-modal": "true",
            "data-dismissible": String(props.dismissible ?? true),
            role: "dialog",
          },
          createElement("h2", null, props.title),
          props.children,
          props.footer,
        )
      : null;
  },
}));

import type { WalletAction } from "./wallet-model";
import {
  fixtureContractOnlyScreen,
  fixturePreviewRows,
  fixturePreviewScreen,
  fixturePreviewSummary,
  fixtureTopUp,
  fixtureTransactionsPage,
  unavailableSummary,
} from "./wallet-preview.fixtures";
import { walletTransactionsFromResponse } from "./wallet-model";
import {
  WalletFigureCard,
  WalletScreen,
  WalletSummaryGrid,
  WalletTopUpButton,
  WalletTransactionFilters,
  WalletTransactionsCard,
} from "./wallet-screen";
import {
  TOP_UP_REDIRECT_NOTICE,
  WalletTopUpDialog,
} from "./wallet-top-up-dialog";

/*
 * Isolated harness for USR-WALLET and USR-WALLET-TOP-UP: every state is
 * rendered from typed fixtures. There is no production route (DR-059).
 */

const utc = { timeZone: "UTC" } as const;
const noop = () => undefined;

/** Static markup with Intl's non-breaking spaces as plain spaces. */
function render(node: ReactNode) {
  return renderToStaticMarkup(node).replace(/ /g, " ");
}

type ButtonLike = ReactElement<{
  "data-action"?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}>;

/** Depth-first search of an element tree (no DOM needed). */
function findElements(
  node: ReactNode,
  predicate: (element: ButtonLike) => boolean,
): ButtonLike[] {
  if (Array.isArray(node)) {
    return node.flatMap((child: ReactNode) => findElements(child, predicate));
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  const element = node as ButtonLike;
  return [
    ...(predicate(element) ? [element] : []),
    ...findElements(element.props.children, predicate),
  ];
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

/* ------------------------------------------------------------------------ */

describe("WalletScreen", () => {
  it("renders the full reference composition from preview fixtures", () => {
    const markup = render(
      <WalletScreen
        display={utc}
        model={fixturePreviewScreen}
        onAction={noop}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Wallet<\/h1>/);
    for (const label of ["Available balance", "Pending", "Funded this month"]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain("NGN 42,500.00");
    expect(markup).toContain("1 top-up awaiting confirmation");
    for (const header of [
      "Date",
      "Type",
      "Provider",
      "Reference",
      "Status",
      "Amount",
    ]) {
      expect(markup).toContain(`>${header}</th>`);
      expect(markup).toContain(`data-label="${header}"`);
    }
    expect(markup).toContain("max-md:block");
    expect(markup).toContain('<time dateTime="2026-01-24T10:00:00Z">');
    expect(markup).toContain("Jan 24, 2026, 10:00 AM");
    expect(markup).toContain("WTX-FIXTURE-0001");
    expect(markup).not.toContain("Receipt");
    expect(markup).not.toMatch(/href=/);
  });

  it("renders only what the backend supports today", () => {
    const markup = render(
      <WalletScreen
        display={utc}
        model={fixtureContractOnlyScreen(
          walletTransactionsFromResponse(fixtureTransactionsPage),
        )}
        onAction={noop}
      />,
    );
    // Missing is not zero: every figure says "Not available".
    expect(markup.match(/Not available<\/p>/g)).toHaveLength(3);
    expect(markup).not.toMatch(/NGN 0\.00/);
    // No invented status, provider or reference columns.
    for (const header of ["Provider", "Reference", "Status"]) {
      expect(markup).not.toContain(`>${header}</th>`);
    }
    expect(markup).not.toContain(">Successful</span>");
    expect(markup).toContain("NGN 20,000.00");
    expect(markup).toContain("NGN 5,000.00");
    expect(markup).toContain("Wallet funding");
    // Top-up and filters are unavailable with an explanation.
    expect(markup).toContain("Wallet top-ups are not available yet.");
    expect(markup).toContain(
      "Filtering by status or date is not available yet.",
    );
    expect(markup).toContain("Load more");
  });

  it("disables every action without a handler", () => {
    const markup = render(<WalletScreen model={fixturePreviewScreen} />);
    for (const button of markup.match(/<button[^>]*>/g) ?? []) {
      expect(button).toContain('disabled=""');
    }
    expect(markup).toMatch(
      /<button[^>]*aria-describedby="wallet-top-up-hint"[^>]*disabled=""/,
    );
  });

  it("does not repeat reference sample providers, references or dates", () => {
    for (const model of [
      fixturePreviewScreen,
      fixtureContractOnlyScreen({ state: "loading" }),
    ]) {
      const markup = render(<WalletScreen display={utc} model={model} />);
      for (const sample of [
        "Bachs",
        "Credo",
        "SafeHaven",
        "WTX-21F9",
        "24 Nov 2026",
        "Showing 1–4 of 4",
      ]) {
        expect(markup, sample).not.toContain(sample);
      }
    }
  });

  it("gives every button an accessible name and button type", () => {
    const markup = render(
      <WalletScreen model={fixturePreviewScreen} onAction={noop} />,
    );
    for (const button of markup.match(/<button[^>]*>.*?<\/button>/g) ?? []) {
      expect(button.replace(/<[^>]+>/g, "").trim()).not.toBe("");
      expect(button).toContain('type="button"');
    }
  });
});

describe("summary tiles", () => {
  it("shows loading, error and unavailable without a figure", () => {
    const loading = render(
      <WalletFigureCard
        figure={{ state: "loading" }}
        icon={null}
        label="Pending"
      />,
    );
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("Loading pending");

    const error = render(
      <WalletFigureCard
        figure={{ state: "error" }}
        icon={null}
        label="Pending"
      />,
    );
    expect(error).toContain("This figure could not be loaded.");

    const unavailable = render(
      <WalletFigureCard
        figure={{ state: "unavailable" }}
        icon={null}
        label="Pending"
      />,
    );
    expect(unavailable).toContain("Not provided by the wallet service yet.");
    expect(unavailable.replace(/<[^>]+>/g, "")).not.toMatch(/\d/);
  });

  it("offers a summary reload intent only after an error", () => {
    const onAction = vi.fn();
    const ok = render(
      <WalletSummaryGrid onAction={onAction} summary={fixturePreviewSummary} />,
    );
    expect(ok).not.toContain("Reload summary");
    const failed = render(
      <WalletSummaryGrid
        onAction={onAction}
        summary={{ ...unavailableSummary, pending: { state: "error" } }}
      />,
    );
    expect(failed).toContain("Reload summary");
  });
});

describe("transactions", () => {
  it("presents each status in text, including unknown", () => {
    const markup = render(
      <WalletTransactionsCard
        filters={{ state: "ready", status: "all" }}
        transactions={{
          hasMore: false,
          state: "ready",
          transactions: fixturePreviewRows,
        }}
      />,
    );
    expect(markup).toMatch(/>Successful<\/span>/);
    expect(markup).toMatch(/>Pending<\/span>/);
    expect(markup).toMatch(/>Failed<\/span>/);
    expect(markup).toMatch(/>Unknown<\/span>/);
    // Unknown is not successful: only the successful row is tinted.
    expect(markup.match(/tabular-nums text-success/g)).toHaveLength(1);
    // A row missing its provider/reference says so in text.
    expect(markup).toContain("Not available");
  });

  it("distinguishes empty, filtered-empty, loading and error", () => {
    const empty = render(
      <WalletTransactionsCard
        filters={{ state: "unavailable" }}
        transactions={{ hasMore: false, state: "ready", transactions: [] }}
      />,
    );
    expect(empty).toContain("No transactions yet");
    expect(empty).not.toContain("Not available</p>");

    const filtered = render(
      <WalletTransactionsCard
        filters={{ state: "ready", status: "failed" }}
        transactions={{ hasMore: false, state: "ready", transactions: [] }}
      />,
    );
    expect(filtered).toContain("No transactions match this filter");

    const loading = render(
      <WalletTransactionsCard
        filters={{ state: "unavailable" }}
        transactions={{ state: "loading" }}
      />,
    );
    expect(loading).toContain("Loading wallet transactions");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toContain("No transactions yet");

    const error = render(
      <WalletTransactionsCard
        filters={{ state: "unavailable" }}
        onAction={noop}
        transactions={{ state: "error" }}
      />,
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain("Transactions unavailable");
    expect(error).toContain("Try again");
  });

  it("reports filter and date-range intents only when supported", () => {
    const onAction = vi.fn<(action: WalletAction) => void>();
    const tree = WalletTransactionFilters({
      filters: { state: "ready", status: "pending" },
      onAction,
    });
    const markup = render(tree);
    expect(markup).toContain('aria-label="Filter transactions by status"');
    expect(markup).toMatch(
      /aria-checked="true"[^>]*>Pending|data-state="on"[^>]*>Pending/,
    );
    const [dateRange] = findElements(
      tree,
      (element) =>
        "leadingIcon" in element.props &&
        textOf(element.props.children) === "Date range",
    );
    dateRange?.props.onClick?.();
    expect(onAction).toHaveBeenCalledWith({ type: "chooseDateRange" });

    const unavailable = WalletTransactionFilters({
      filters: { state: "unavailable" },
      onAction,
    });
    const [disabled] = findElements(
      unavailable,
      (element) =>
        "leadingIcon" in element.props &&
        textOf(element.props.children) === "Date range",
    );
    expect(disabled?.props.disabled).toBe(true);
    expect(disabled?.props.onClick).toBeUndefined();
  });

  it("pages with a load-more intent", () => {
    const onAction = vi.fn<(action: WalletAction) => void>();
    const markup = render(
      <WalletTransactionsCard
        busyAction="loadMore"
        filters={{ state: "unavailable" }}
        onAction={onAction}
        transactions={walletTransactionsFromResponse(fixtureTransactionsPage)}
      />,
    );
    expect(markup).toMatch(/<button[^>]*aria-busy="true"[^>]*>.*Load more/);
  });
});

describe("WalletTopUpButton", () => {
  it("opens the dialog only when wired and configured", () => {
    const onOpen = vi.fn();
    const wired = WalletTopUpButton({
      onAction: noop,
      onOpen,
      topUp: fixtureTopUp,
    });
    const [button] = findElements(
      wired,
      (element) => element.props["data-action"] === "openTopUp",
    );
    expect(button?.props.disabled).toBe(false);
    button?.props.onClick?.();
    expect(onOpen).toHaveBeenCalledTimes(1);

    for (const props of [
      { onAction: undefined, topUp: fixtureTopUp },
      { onAction: noop, topUp: { state: "unavailable" } as const },
      { onAction: noop, topUp: { ...fixtureTopUp, providers: [] } },
    ]) {
      const [disabled] = findElements(
        WalletTopUpButton({ ...props, onOpen }),
        (element) => element.props["data-action"] === "openTopUp",
      );
      expect(disabled?.props.disabled).toBe(true);
      expect(disabled?.props.onClick).toBeUndefined();
    }
  });
});

describe("WalletTopUpDialog", () => {
  beforeEach(() => {
    dialogCalls.length = 0;
  });

  function renderDialog(
    overrides: Partial<Parameters<typeof WalletTopUpDialog>[0]> = {},
  ) {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const markup = render(
      <WalletTopUpDialog
        config={fixtureTopUp}
        onClose={onClose}
        onSubmit={onSubmit}
        {...overrides}
      />,
    );
    const props = dialogCalls.at(-1);
    if (!props) throw new Error("Dialog not rendered");
    return { markup, onClose, onSubmit, props };
  }

  it("renders labelled amount, presets, provider select and redirect notice", () => {
    const { markup } = renderDialog();
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Top up wallet");
    expect(markup).toMatch(/<label[^>]*for="([^"]+)"[^>]*>Amount \(NGN\)/);
    expect(markup).toMatch(/<input[^>]*autofocus=""/i);
    expect(markup).toContain('inputMode="decimal"');
    expect(markup).toMatch(/role="group"[^>]*>|aria-label="Preset amounts"/);
    for (const preset of [
      "NGN 5,000.00",
      "NGN 10,000.00",
      "NGN 20,000.00",
      "NGN 50,000.00",
    ]) {
      expect(markup).toContain(preset);
    }
    expect(markup).toMatch(/aria-pressed="false"/);
    expect(markup).toMatch(/<label[^>]*for="([^"]+)"[^>]*>Pay with/);
    expect(markup).toContain(
      '<option value="fixture-provider-a" selected="">FIXTURE Provider A — card or transfer</option>',
    );
    expect(markup).toContain(
      '<option value="fixture-provider-b">FIXTURE Provider B</option>',
    );
    expect(markup).toContain(TOP_UP_REDIRECT_NOTICE.replace("'", "&#x27;"));
    expect(markup).toContain("Continue to payment");
    expect(markup).not.toMatch(/success|receipt|confirmed!/i);
  });

  it("keeps preset buttons from submitting the form", () => {
    const { markup } = renderDialog();
    for (const preset of markup.match(/<button[^>]*data-preset[^>]*>/g) ?? []) {
      expect(preset).toContain('type="button"');
    }
    expect(markup).toMatch(
      /<button[^>]*type="submit"[^>]*>.*Continue to payment/,
    );
  });

  it("closes through Cancel and the dialog's dismiss handler", () => {
    const { onClose, props } = renderDialog();
    expect(props.dismissible).toBe(true);
    props.onOpenChange(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    const [cancel] = findElements(
      props.footer,
      (element) => textOf(element.props.children) === "Cancel",
    );
    cancel?.props.onClick?.();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("cannot be dismissed or changed while the intent is pending", () => {
    const { markup, onSubmit, props } = renderDialog({ pending: true });
    expect(props.dismissible).toBe(false);
    expect(markup).toContain('data-dismissible="false"');
    expect(markup).toMatch(
      /<button[^>]*aria-busy="true"[^>]*>.*Continue to payment/,
    );
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toMatch(/<select[^>]*disabled=""/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an adapter error without a success state", () => {
    const { markup } = renderDialog({
      error: "The top-up could not be started.",
    });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("The top-up could not be started.");
  });
});

/* ------------------------------------------------------------------------ */

describe("production boundary", () => {
  const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));
  const featureRoot = fileURLToPath(new URL(".", import.meta.url));

  function sourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(entry) ? [path] : [];
    });
  }

  const isProduction = (file: string) =>
    !/\.test\.tsx?$/.test(file) && !file.endsWith(".fixtures.ts");

  it("never imports the preview fixtures from production modules", () => {
    const files = sourceFiles(sourceRoot).filter(isProduction);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /from "[^"]*wallet-preview\.fixtures"/,
      );
    }
  });

  it("is not imported by any production module outside the feature", () => {
    for (const file of sourceFiles(sourceRoot).filter(isProduction)) {
      if (file.startsWith(featureRoot)) continue;
      expect(readFileSync(file, "utf8"), file).not.toMatch(/features\/wallet/);
    }
  });

  it("makes no payment, wallet or network call", () => {
    for (const file of sourceFiles(featureRoot).filter(isProduction)) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/@template\/api-react/);
      expect(source, file).not.toMatch(
        /useInitiatePayment|useWalletTransactions|useWalletTopUp|initiatePayment\(|fetch\(|window\.location|router\.push/,
      );
      // Contract types only; no runtime api-client import.
      for (const line of source.match(/^import .*@template\/api-client.*$/gm) ??
        []) {
        expect(line, file).toMatch(/^import type /);
      }
      expect(source, file).not.toMatch(/@\/app\/billing|@\/lib\/billing/);
    }
  });

  it("adds no production route, navigation entry or preview flag", () => {
    const appDirectory = join(sourceRoot, "app");
    expect(() => statSync(join(appDirectory, "wallet"))).toThrow();
    const navigation = readFileSync(
      join(sourceRoot, "config", "navigation.ts"),
      "utf8",
    );
    expect(navigation).not.toMatch(/\/wallet/);
    for (const file of sourceFiles(featureRoot).filter(isProduction)) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/NEXT_PUBLIC_/);
    }
  });
});
