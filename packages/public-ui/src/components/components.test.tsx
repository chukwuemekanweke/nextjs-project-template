import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlogCard } from "./blog-card";
import { CtaBanner } from "./cta-banner";
import { LegalDocument } from "./legal-document";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { PlanCard, PlanGridSkeleton } from "./plan-card";
import { ProductShot } from "./product-shot";

const navigation = [
  { label: "Product", href: "/" },
  { label: "Pricing", href: "/pricing" },
];

describe("MarketingHeader", () => {
  it("marks the active link and keeps the menu closed on the server", () => {
    const markup = renderToStaticMarkup(
      <MarketingHeader
        activeHref="/pricing"
        brand={<a href="/">Acme</a>}
        navigation={navigation}
        register={{
          label: "Get started",
          href: "https://app.example.com/register",
        }}
        signIn={{ label: "Sign in", href: "https://app.example.com/sign-in" }}
      />,
    );

    expect(markup).toContain('<nav aria-label="Site"');
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/pricing"/);
    expect(markup).not.toMatch(/aria-current="page"[^>]*href="\/"/);
    expect(markup).toContain('aria-label="Open menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('href="https://app.example.com/sign-in"');
    expect(markup).toContain('href="https://app.example.com/register"');
    // The menu sheet renders only once opened.
    expect(markup).not.toContain('role="dialog"');
  });
});

describe("MarketingFooter", () => {
  it("renders labelled link groups and the copyright", () => {
    const markup = renderToStaticMarkup(
      <MarketingFooter
        brand={<span>Acme</span>}
        copyright="Acme Inc. All rights reserved."
        description="A configurable foundation."
        groups={[
          { title: "Legal", links: [{ label: "Terms", href: "/terms" }] },
        ]}
      />,
    );

    expect(markup).toContain('<nav aria-label="Legal"');
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain("Acme Inc. All rights reserved.");
  });
});

describe("PlanCard", () => {
  it("renders the supplied price, cadence and a named plan action", () => {
    const markup = renderToStaticMarkup(
      <PlanCard
        plan={{
          action: {
            label: "Subscribe",
            href: "https://app.example.com/billing/checkout?planId=1",
          },
          cadence: "month",
          description: "For growing teams.",
          features: ["Priority support"],
          name: "Pro",
          price: "NGN 7,500.00",
        }}
      />,
    );

    expect(markup).toContain("NGN 7,500.00");
    expect(markup).toContain(" / month");
    expect(markup).toContain('aria-label="Subscribe: Pro"');
    expect(markup).toContain("Priority support");
  });

  it("announces the loading placeholder", () => {
    const markup = renderToStaticMarkup(<PlanGridSkeleton />);
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading plans");
  });
});

describe("ProductShot", () => {
  it("is decorative and shows no figures that could read as real data", () => {
    const markup = renderToStaticMarkup(<ProductShot />);
    expect(markup.startsWith('<div aria-hidden="true"')).toBe(true);
    expect(markup.replace(/<[^>]*>/g, "")).toBe("");
  });
});

describe("BlogCard", () => {
  it("keeps the anchor id and links only when a post page exists", () => {
    const post = { id: "launch", title: "Launch", excerpt: "Guide" };
    expect(renderToStaticMarkup(<BlogCard post={post} />)).toContain(
      '<article class="h-full scroll-mt-24" id="launch"',
    );
    expect(renderToStaticMarkup(<BlogCard post={post} />)).not.toContain("<a ");
    expect(
      renderToStaticMarkup(
        <BlogCard post={{ ...post, href: "/blog/launch" }} />,
      ),
    ).toContain('href="/blog/launch"');
  });
});

describe("LegalDocument", () => {
  it("switches documents with links and numbers the sections", () => {
    const markup = renderToStaticMarkup(
      <LegalDocument
        currentHref="/terms"
        documents={[
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ]}
        sections={[{ id: "accounts", title: "Accounts", content: <p>Text</p> }]}
        title="Terms of service"
        updated="July 2026"
      />,
    );

    expect(markup).toContain('<nav aria-label="On this page"');
    expect(markup).toContain('href="#accounts"');
    expect(markup).toMatch(/aria-current="page"[^>]*href="\/terms"/);
    expect(markup).not.toMatch(/aria-current="page"[^>]*href="\/privacy"/);
    expect(markup).toContain(">1. Accounts</h2>");
    expect(markup).toContain("Last updated July 2026");
  });
});

describe("CtaBanner", () => {
  it("labels the section with its heading", () => {
    const markup = renderToStaticMarkup(
      <CtaBanner
        action={{ label: "Create your account", href: "/register" }}
        title="Ready"
      />,
    );
    const id = /aria-labelledby="([^"]+)"/.exec(markup)?.[1];
    expect(id).toBeTruthy();
    expect(markup).toContain(`id="${id}"`);
  });
});
