"use client";

import {
  Alert,
  Button,
  Checkbox,
  CopyIcon,
  DownloadIcon,
} from "@template/ui-core";
import { useState } from "react";
import {
  recoveryCodesFileContents,
  type RecoveryCodeSource,
} from "./two-factor-flow";

/**
 * One-time recovery codes (reference `UserTwoFactorSetup` step 3). Codes are
 * shown exactly as the backend returned them; copy and download are
 * presentation-only and nothing is stored. The "saved" checkbox gates the
 * dialog's Finish action.
 */
export function RecoveryCodesPanel({
  codes,
  onSavedChange,
  saved,
  source,
}: Readonly<{
  codes: readonly string[];
  onSavedChange: (saved: boolean) => void;
  saved: boolean;
  source: RecoveryCodeSource;
}>) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning">
        Store these somewhere safe. Each code signs you in once if you lose your
        authenticator. You won&apos;t see them again.
      </Alert>
      {source === "regeneration" ? (
        <p className="text-small text-fg-muted">
          Your previous recovery codes are no longer valid.
        </p>
      ) : null}
      <ul
        aria-label="Recovery codes"
        className="bg-surface-2 border-border grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-lg border p-4 font-mono text-[0.8125rem]"
      >
        {codes.map((code) => (
          <li className="text-fg tracking-wide" key={code}>
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          leadingIcon={<DownloadIcon />}
          onClick={() => downloadRecoveryCodes(codes)}
          size="sm"
          variant="secondary"
        >
          Download
        </Button>
        <Button
          leadingIcon={<CopyIcon />}
          onClick={() => {
            void navigator.clipboard
              .writeText(codes.join("\n"))
              .then(() => setCopied(true));
          }}
          size="sm"
          variant="secondary"
        >
          {copied ? "Copied" : "Copy all"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Recovery codes copied to the clipboard" : ""}
        </span>
      </div>
      <Checkbox
        checked={saved}
        label="I have saved my recovery codes"
        onChange={(event) => onSavedChange(event.target.checked)}
      />
    </div>
  );
}

function downloadRecoveryCodes(codes: readonly string[]): void {
  const file = new Blob([recoveryCodesFileContents(codes)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = "two-factor-recovery-codes.txt";
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
