import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormField, Input } from "./form";
import { Steps } from "./steps";

const steps = [
  { id: "email", label: "Email" },
  { id: "details", label: "Your details" },
  { id: "confirm", label: "Confirm email" },
] as const;

describe("Steps", () => {
  it("renders a labelled ordered list with one current step", () => {
    const html = renderToStaticMarkup(
      <Steps current="details" label="Account setup" steps={steps} />,
    );

    expect(html).toMatch(/^<ol aria-label="Account setup"/);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('Email<span class="sr-only"> (completed)</span>');
    expect(html).not.toContain('Confirm email<span class="sr-only">');
  });

  it("keeps every label for assistive technology on phones", () => {
    const html = renderToStaticMarkup(<Steps current="email" steps={steps} />);

    // Inactive labels are visually hidden below md, never removed.
    expect(html.match(/max-md:sr-only/g)).toHaveLength(2);
    expect(html).toContain("Your details");
    expect(html).toContain("Confirm email");
  });

  it("numbers upcoming steps and checks completed ones", () => {
    const html = renderToStaticMarkup(
      <Steps current="confirm" steps={steps} />,
    );

    expect(html).toContain(">3</span>");
    expect(html).not.toContain(">1</span>");
    expect(html.match(/<svg/g)).toHaveLength(2);
  });
});

describe("FormField labelAction", () => {
  it("places the action beside the label, outside it", () => {
    const html = renderToStaticMarkup(
      <FormField
        inputId="password"
        label="Password"
        labelAction={<a href="/recover">Forgot password?</a>}
      >
        <Input id="password" />
      </FormField>,
    );

    expect(html).toContain(
      '<label class="text-label text-fg" for="password">Password</label>',
    );
    expect(html).toContain('<a href="/recover">Forgot password?</a>');
    expect(html.indexOf("Forgot password?")).toBeLessThan(
      html.indexOf("<input"),
    );
  });

  it("renders the plain label when no action is given", () => {
    const html = renderToStaticMarkup(
      <FormField inputId="email" label="Email">
        <Input id="email" />
      </FormField>,
    );

    expect(html).not.toContain("justify-between");
  });
});
