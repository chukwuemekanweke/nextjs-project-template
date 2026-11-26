import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  branding: {
    productName: "Acme Platform",
    supportEmail: "support@example.com",
  },
  env: {
    contactAddress: "Address",
    productDescription: "Description",
    siteUrl: "https://www.example.com",
  },
  userPortalHref: (path: string) => `https://app.example.com${path}`,
}));

const { footerNavigation, legalDocuments, navigation, site } =
  await import("./site");
const { default: sitemap } = await import("@/app/sitemap");

const appDirectory = fileURLToPath(new URL("../app", import.meta.url));
const internalHrefs = [
  ...navigation,
  ...footerNavigation.flatMap((group) => group.links),
  ...legalDocuments,
].map((link) => link.href);

describe("site navigation", () => {
  it.each(internalHrefs)("links %s to an implemented page", (href) => {
    expect(
      existsSync(`${appDirectory}${href.replace(/\/$/, "")}/page.tsx`),
    ).toBe(true);
  });

  it("lists every linked page in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const href of internalHrefs) {
      expect(urls).toContain(`${site.url}${href === "/" ? "" : href}`);
    }
  });

  it("sends sign-in and registration to the User Portal", () => {
    expect(site.signIn.href).toBe("https://app.example.com/sign-in");
    expect(site.register.href).toBe("https://app.example.com/register");
  });
});
