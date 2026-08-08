const ROLE_CLAIMS = [
  "role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
] as const;

function decodePayload(
  accessToken: string,
): Record<string, unknown> | undefined {
  const segments = accessToken.split(".");
  if (segments.length !== 3 || !segments[1]) {
    return undefined;
  }

  try {
    const payload = Buffer.from(segments[1], "base64url").toString("utf8");
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function hasRequiredAdminRole(
  accessToken: string,
  requiredRole: string,
): boolean {
  const payload = decodePayload(accessToken);
  if (!payload) {
    return false;
  }

  const expected = requiredRole.toLocaleLowerCase();
  return ROLE_CLAIMS.some((claim) => {
    const value = payload[claim];
    const roles = Array.isArray(value) ? value : [value];
    return roles.some(
      (role) =>
        typeof role === "string" && role.toLocaleLowerCase() === expected,
    );
  });
}
