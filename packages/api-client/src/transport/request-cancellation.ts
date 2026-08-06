export interface RequestCancellation {
  readonly signal: AbortSignal;
  didTimeOut(): boolean;
  dispose(): void;
}

export function createRequestCancellation(
  callerSignal: AbortSignal | undefined,
  timeoutMs: number | undefined,
): RequestCancellation {
  const controller = new AbortController();
  let timedOut = false;
  const timeout =
    timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true;
          controller.abort(
            new DOMException("Request timed out", "TimeoutError"),
          );
        }, timeoutMs);
  const abortFromCaller = () => {
    controller.abort(callerSignal?.reason);
  };

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    dispose: () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}
