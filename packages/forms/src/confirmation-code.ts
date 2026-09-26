export type ConfirmationCodeCharacterSet = "alphanumeric" | "numeric";

export function normalizeConfirmationCode(
  code: string,
  characterSet: ConfirmationCodeCharacterSet,
): string {
  return characterSet === "alphanumeric"
    ? code.toUpperCase().replaceAll(/[^A-Z0-9]/g, "")
    : code.replaceAll(/\D/g, "");
}
