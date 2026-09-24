import type {
  GoogleAuthenticatedResponse,
  GoogleSignInResponse,
} from "@template/api-client/authentication";

const TERMINAL_FLOW_CODES = new Set([
  "google_flow_consumed",
  "google_flow_expired",
  "google_flow_invalid",
]);

export function isAuthenticatedGoogleResponse(
  response: GoogleSignInResponse,
): response is GoogleAuthenticatedResponse {
  return response.outcome === "authenticated";
}

export function safeGoogleSessionResponse(
  session: GoogleAuthenticatedResponse,
) {
  return {
    expiresAtUtc: session.expiresAtUtc,
    status: "authenticated" as const,
    tokenType: session.tokenType,
  };
}

export function isTerminalGoogleFlowCode(code: string | undefined): boolean {
  return code !== undefined && TERMINAL_FLOW_CODES.has(code);
}
