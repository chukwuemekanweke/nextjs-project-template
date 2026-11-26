import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: undefined, setTheme: vi.fn() }),
}));

import { AuthHeading, AuthLayout, AuthPanel } from "./auth-layout";

describe("AuthLayout", () => {
  it("renders the brand, theme switch, main content and footer", () => {
    const html = renderToStaticMarkup(
      <AuthLayout brand={<span>Brand</span>} footer="© Example">
        <p>Form</p>
      </AuthLayout>,
    );

    expect(html).toContain("<header");
    expect(html).toContain("Brand");
    expect(html).toContain('aria-label="Dark theme"');
    expect(html).toMatch(/<main[^>]*max-w-auth-form[^>]*><p>Form<\/p><\/main>/);
    expect(html).toContain("<footer");
    expect(html).toContain("© Example");
    expect(html).not.toContain("<aside");
  });

  it("shows the brand panel only from lg, on the auth-panel token", () => {
    const html = renderToStaticMarkup(
      <AuthLayout
        brand={<span>Brand</span>}
        panel={
          <AuthPanel
            description="Lead"
            highlights={[{ icon: <svg />, label: "Encrypted sessions" }]}
            title="Panel title"
          />
        }
      >
        <p>Form</p>
      </AuthLayout>,
    );

    expect(html).toMatch(/<aside class="[^"]*\bhidden\b[^"]*\blg:flex\b/);
    expect(html).toContain("bg-auth-panel");
    expect(html).toContain("border-auth-panel-border");
    expect(html).toContain("Panel title");
    expect(html).toContain("<li");
    expect(html).toContain("Encrypted sessions");
  });

  it("keeps the panel title out of the heading outline", () => {
    const html = renderToStaticMarkup(<AuthPanel title="Panel title" />);
    expect(html).not.toMatch(/<h[1-6]/);
  });
});

describe("AuthHeading", () => {
  it("renders one h1 with optional eyebrow, icon and description", () => {
    const html = renderToStaticMarkup(
      <AuthHeading
        description="Supporting text"
        eyebrow={<span>Admin portal</span>}
        icon={<span data-icon />}
        title="Administrator sign in"
      />,
    );

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Administrator sign in");
    expect(html).toContain("Admin portal");
    expect(html).toContain("data-icon");
    expect(html).toContain("Supporting text");
  });
});
