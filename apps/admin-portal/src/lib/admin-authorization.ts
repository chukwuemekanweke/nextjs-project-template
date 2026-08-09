import { decodeAccessTokenPayload } from "@template/api-client/authentication";

const ROLE_CLAIMS = [
  "role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
] as const;

export function hasRequiredAdminRole(
  accessToken: string,
  requiredRole: string,
): boolean {
  const payload = decodeAccessTokenPayload(accessToken);
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
