import { describe, expect, it } from "vitest";
import { contactMailtoHref } from "./contact-mailto";

describe("contactMailtoHref", () => {
  it("addresses the support email with an encoded subject and body", () => {
    const href = contactMailtoHref("support@example.com", {
      email: " ada@example.com ",
      message: "Hello & welcome?\nSecond line",
      name: " Ada Lovelace ",
      topic: "Sales",
    });
    const url = new URL(href);

    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("support@example.com");
    expect(url.searchParams.get("subject")).toBe(
      "Sales enquiry from Ada Lovelace",
    );
    expect(url.searchParams.get("body")).toBe(
      "Hello & welcome?\r\nSecond line\r\n\r\nAda Lovelace\r\nada@example.com",
    );
  });

  it("cannot inject extra header fields through the message", () => {
    const href = contactMailtoHref("support@example.com", {
      email: "a@example.com",
      message: "x&cc=attacker@example.com",
      name: "Name?bcc=attacker@example.com",
      topic: "General",
    });
    const url = new URL(href);

    expect([...url.searchParams.keys()]).toEqual(["subject", "body"]);
  });
});
