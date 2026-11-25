/**
 * The foundations preview (`/foundations`) is a development aid for checking
 * the shared design tokens. It is never served by production builds.
 */
export function isFoundationsPreviewEnabled(
  nodeEnvironment: string | undefined,
): boolean {
  return nodeEnvironment === "development";
}
