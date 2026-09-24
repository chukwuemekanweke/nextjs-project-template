"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type GoogleAuthenticationError,
  type GoogleAuthenticationOutcome,
  googleErrorFromResponse,
} from "@/lib/google-authentication";

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

type FlowResponse = { expiresAtUtc: string; nonce: string };
type GoogleState = "idle" | "preparing" | "ready" | "submitting";

export function GoogleAuthenticationButton({
  clientId,
  onError,
  onOutcome,
}: Readonly<{
  onError: (error: GoogleAuthenticationError) => void;
  onOutcome: (outcome: GoogleAuthenticationOutcome) => void;
  clientId: string;
}>) {
  const abortController = useRef<AbortController | undefined>(undefined);
  const buttonContainer = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const submitting = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [state, setState] = useState<GoogleState>("idle");

  const reset = useCallback(() => {
    window.google?.accounts.id.cancel();
    abortController.current?.abort();
    abortController.current = undefined;
    buttonContainer.current?.replaceChildren();
    initialized.current = false;
    submitting.current = false;
    setState("idle");
  }, []);

  useEffect(
    () => () => {
      window.google?.accounts.id.cancel();
      abortController.current?.abort();
    },
    [],
  );

  const authenticateCredential = useCallback(
    ({ credential }: GoogleCredentialResponse) => {
      if (submitting.current) {
        return;
      }
      submitting.current = true;
      setState("submitting");
      void fetch("/api/auth/session/google", {
        body: JSON.stringify({ credential }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: abortController.current?.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const error = await googleErrorFromResponse(response);
            onError(error);
            if (error.restartRequired) {
              reset();
            } else {
              submitting.current = false;
              setState("ready");
            }
            return;
          }
          onOutcome((await response.json()) as GoogleAuthenticationOutcome);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          onError({
            message:
              "Google sign-in is temporarily unavailable. Try again later.",
            restartRequired: false,
          });
          submitting.current = false;
          setState("ready");
        });
    },
    [onError, onOutcome, reset],
  );

  const prepare = useCallback(async () => {
    const identity = window.google?.accounts.id;
    const container = buttonContainer.current;
    if (
      !scriptReady ||
      !identity ||
      !container ||
      state !== "idle" ||
      initialized.current
    ) {
      return;
    }

    const controller = new AbortController();
    abortController.current?.abort();
    abortController.current = controller;
    setState("preparing");

    try {
      const response = await fetch("/api/auth/google/flow", {
        credentials: "same-origin",
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw await googleErrorFromResponse(response);
      }
      const flow = (await response.json()) as FlowResponse;
      if (controller.signal.aborted) {
        return;
      }

      identity.initialize({
        callback: authenticateCredential,
        client_id: clientId,
        nonce: flow.nonce,
      });
      initialized.current = true;
      container.replaceChildren();
      identity.renderButton(container, {
        shape: "rectangular",
        size: "large",
        text: "continue_with",
        theme: "outline",
        type: "standard",
        width: Math.min(container.clientWidth || 360, 400),
      });
      setState("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      onError(
        isGoogleAuthenticationError(error)
          ? error
          : {
              message:
                "Google sign-in is temporarily unavailable. Try again later.",
              restartRequired: false,
            },
      );
      setState("idle");
    }
  }, [authenticateCredential, clientId, onError, scriptReady, state]);

  return (
    <div className="space-y-2">
      <Script
        onError={() => {
          setScriptFailed(true);
          onError({
            message:
              "Google sign-in could not load. Check your connection and try again.",
            restartRequired: false,
          });
        }}
        onReady={() => {
          setScriptFailed(false);
          setScriptReady(true);
        }}
        src={GOOGLE_IDENTITY_SCRIPT}
        strategy="afterInteractive"
      />
      {state === "idle" || state === "preparing" ? (
        <button
          aria-busy={state === "preparing"}
          className="flex min-h-10 w-full items-center justify-center gap-3 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          disabled={!scriptReady || scriptFailed || state === "preparing"}
          onClick={() => void prepare()}
          type="button"
        >
          <GoogleMark />
          {state === "preparing"
            ? "Preparing Google sign-in…"
            : scriptFailed
              ? "Google sign-in unavailable"
              : "Continue with Google"}
        </button>
      ) : null}
      <div
        aria-busy={state === "submitting"}
        className={
          state === "ready"
            ? "flex min-h-10 w-full justify-center"
            : state === "submitting"
              ? "pointer-events-none flex min-h-10 w-full justify-center opacity-60"
              : "hidden"
        }
        ref={buttonContainer}
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.614Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.322 0 2.508.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function isGoogleAuthenticationError(
  value: unknown,
): value is GoogleAuthenticationError {
  return (
    value !== null &&
    typeof value === "object" &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string" &&
    "restartRequired" in value &&
    typeof (value as { restartRequired?: unknown }).restartRequired ===
      "boolean"
  );
}
