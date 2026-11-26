"use client";

import Link from "next/link";
import { Button, Card, CopyIcon, IconTile, LockIcon } from "@template/ui-core";
import { useState } from "react";
import {
  formatForbiddenDetails,
  hasForbiddenDetails,
  safePermissionName,
  sanitizeForbiddenDetails,
  type ForbiddenRequestDetails,
} from "./forbidden-details";

type CopyStatus = "idle" | "copied" | "failed";

/** Writes to the clipboard; resolves to the feedback state to show. */
export async function copyForbiddenDetails(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined,
): Promise<Exclude<CopyStatus, "idle">> {
  if (!clipboard) return "failed";
  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * In-shell 403 state (reference `AdminForbidden`): rendered on the
 * requested URL when an admitted administrator's backend call returns 403.
 * It is presentation only — it never grants, retries or reinterprets
 * access. `permission` is shown only when the backend names it; it is never
 * guessed. "Back to dashboard" targets `/`, which needs only the admitted
 * admin role, so it cannot loop back here.
 */
export function AdminForbidden({
  backHref = "/",
  backLabel = "Back to dashboard",
  permission,
  requestDetails,
  resourceLabel,
  title = "You don't have access to this page",
}: Readonly<{
  backHref?: string;
  backLabel?: string;
  /** Required permission, only when reported by the backend. */
  permission?: string;
  /** Non-secret details for support; see `forbiddenDetailsFromError`. */
  requestDetails?: ForbiddenRequestDetails;
  /** What was denied, for example "Payment analytics". */
  resourceLabel?: string;
  title?: string;
}>) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const safePermission = safePermissionName(permission);
  const details = requestDetails
    ? sanitizeForbiddenDetails(requestDetails)
    : undefined;
  const detailsText =
    details && hasForbiddenDetails(details)
      ? formatForbiddenDetails(details)
      : undefined;

  return (
    <Card
      aria-labelledby="admin-forbidden-title"
      className="mx-auto my-8 flex max-w-[560px] flex-col items-center gap-4 px-5 py-8 text-center md:my-16 md:px-8"
      role="region"
    >
      <IconTile className="size-16 rounded-full" size="lg" tone="danger">
        <LockIcon />
      </IconTile>
      <p className="eyebrow text-fg-subtle">Error 403</p>
      <h1 className="text-h1 text-fg" id="admin-forbidden-title">
        {title}
      </h1>
      <p className="text-fg-muted max-w-md">
        {describeDenial(resourceLabel, safePermission)}
      </p>
      <div className="flex flex-wrap justify-center gap-3 max-sm:w-full max-sm:*:flex-auto">
        <Button asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        {detailsText ? (
          <Button
            leadingIcon={<CopyIcon />}
            onClick={() => {
              void copyForbiddenDetails(detailsText, navigator.clipboard).then(
                setCopyStatus,
              );
            }}
            variant="secondary"
          >
            Copy request details
          </Button>
        ) : null}
      </div>
      <p className="text-small text-fg-muted min-h-5" role="status">
        {copyStatus === "copied" ? "Request details copied." : null}
        {copyStatus === "failed"
          ? "Couldn't copy automatically. Select the details below."
          : null}
      </p>
      {copyStatus === "failed" && detailsText ? (
        <pre className="bg-surface-2 border-border text-small text-fg w-full overflow-x-auto rounded-md border p-3 text-left font-mono whitespace-pre-wrap select-all">
          {detailsText}
        </pre>
      ) : null}
    </Card>
  );
}

function describeDenial(
  resourceLabel: string | undefined,
  permission: string | undefined,
) {
  const subject = resourceLabel ?? "This page";
  if (permission) {
    return (
      <>
        {subject} needs the <code className="font-mono">{permission}</code>{" "}
        permission. Ask an administrator to give you a role that includes it.
      </>
    );
  }
  return (
    <>
      Your administrator role doesn&apos;t include access to{" "}
      {resourceLabel ? resourceLabel : "this page"}. Ask an administrator if you
      need it.
    </>
  );
}
