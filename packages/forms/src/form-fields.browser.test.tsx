import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { z } from "zod";
import {
  ConfirmationCodeField,
  PasswordField,
  SubmitButton,
  TextField,
} from "./form-components";
import { useValidatedForm } from "./use-validated-form";
import { ValidatedForm } from "./validated-form";

const schema = z.object({
  code: z.string().length(6, "Enter the 6-digit code."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type Values = z.infer<typeof schema>;

function SignInHarness({
  onSubmit,
  serverError,
}: {
  onSubmit: (values: Values) => Promise<void> | void;
  serverError?: string;
}) {
  const form = useValidatedForm(schema, {
    defaultValues: { code: "", email: "", password: "" },
  });
  useEffect(() => {
    if (serverError) {
      // What applyBackendValidation does with a field-level API error.
      form.setError("email", { message: serverError, type: "server" });
    }
  }, [form, serverError]);

  return (
    <ValidatedForm form={form} onSubmit={onSubmit}>
      <TextField<Values>
        hint="Your work email."
        label="Email"
        name="email"
        required
      />
      <PasswordField<Values> label="Password" name="password" required />
      <ConfirmationCodeField<Values> label="Verification code" name="code" />
      <SubmitButton>Sign in</SubmitButton>
    </ValidatedForm>
  );
}

describe("connected fields", () => {
  it("label the controls and describe them with hints", async () => {
    const screen = await render(<SignInHarness onSubmit={vi.fn()} />);
    const email = screen.getByLabelText("Email");

    await expect.element(email).toBeRequired();
    await expect.element(email).toHaveAccessibleDescription("Your work email.");
    await expect
      .element(screen.getByLabelText(/^Password/))
      .toHaveAttribute("type", "password");
  });

  it("show schema errors linked to their fields and block submission", async () => {
    const onSubmit = vi.fn();
    const screen = await render(<SignInHarness onSubmit={onSubmit} />);

    await screen.getByRole("button", { name: "Sign in" }).click();

    const email = screen.getByLabelText("Email");
    await expect.element(email).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(email)
      .toHaveAccessibleDescription("Enter a valid email address.");
    await expect
      .element(screen.getByLabelText(/^Password/))
      .toHaveAccessibleDescription("Use at least 8 characters.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("show server-side validation on the matching field", async () => {
    const screen = await render(
      <SignInHarness
        onSubmit={vi.fn()}
        serverError="This email is already registered."
      />,
    );
    await expect
      .element(screen.getByLabelText("Email"))
      .toHaveAccessibleDescription("This email is already registered.");
  });

  it("submit registered values once, busy while submitting", async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn<(values: Values) => Promise<void>>(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const screen = await render(<SignInHarness onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "correct-horse");
    await screen.getByLabelText("Character 1 of 6").click();
    await userEvent.keyboard("123456");

    const submit = screen.getByRole("button", { name: "Sign in" });
    await submit.click();
    await expect.element(submit).toHaveAttribute("aria-busy", "true");
    await submit.click({ force: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      code: "123456",
      email: "ada@example.com",
      password: "correct-horse",
    });

    finish();
    await expect.element(submit).not.toHaveAttribute("aria-busy");
  });

  it("toggle password visibility without losing the value", async () => {
    const screen = await render(<SignInHarness onSubmit={vi.fn()} />);
    const password = screen.getByLabelText(/^Password/);

    await userEvent.type(password, "s3cret-value");
    await screen.getByRole("button", { name: "Show password" }).click();
    await expect.element(password).toHaveAttribute("type", "text");
    await expect.element(password).toHaveValue("s3cret-value");
  });
});
