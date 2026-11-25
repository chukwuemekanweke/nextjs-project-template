import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Checkbox,
  FormField,
  Input,
  Radio,
  RadioCard,
  RadioGroup,
  SearchInput,
  Select,
  Textarea,
} from "./form";
import { OtpInput } from "./otp-input";
import { PasswordInput } from "./password-input";
import { SegmentedControl } from "./segmented-control";
import { Switch } from "./switch";

describe("FormField with text controls", () => {
  it("associates the label and hint with the control", async () => {
    const screen = await render(
      <FormField
        descriptionId="email-hint"
        hint="We never share it."
        inputId="email"
        label="Email"
        required
      >
        <Input aria-describedby="email-hint" id="email" required />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");

    await expect.element(input).toBeRequired();
    await expect
      .element(input)
      .toHaveAccessibleDescription("We never share it.");
  });

  it("links and announces a validation error, not only by colour", async () => {
    const screen = await render(
      <FormField
        descriptionId="email-error"
        error="Enter a valid email address."
        hint="Hidden while invalid"
        inputId="email"
        label="Email"
      >
        <Input aria-describedby="email-error" aria-invalid id="email" />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    const error = screen.getByRole("alert");

    await expect.element(input).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(input)
      .toHaveAccessibleDescription("Enter a valid email address.");
    await expect
      .element(error)
      .toHaveTextContent("Enter a valid email address.");
    // An icon accompanies the message.
    expect(error.element().querySelector("svg")).not.toBeNull();
    await expect.element(input).toHaveClass("aria-invalid:border-danger");
    expect(screen.container.textContent).not.toContain("Hidden while invalid");
  });

  it("supports controlled and uncontrolled typing", async () => {
    function Controlled() {
      const [value, setValue] = useState("Ada");
      return (
        <>
          <Input
            aria-label="Controlled"
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            value={value}
          />
          <Input aria-label="Uncontrolled" defaultValue="x" />
        </>
      );
    }
    const screen = await render(<Controlled />);

    const controlled = screen.getByLabelText("Controlled", { exact: true });
    await userEvent.type(controlled, "b");
    await expect.element(controlled).toHaveValue("ADAB");
    await userEvent.type(screen.getByLabelText("Uncontrolled"), "yz");
    await expect
      .element(screen.getByLabelText("Uncontrolled"))
      .toHaveValue("xyz");
  });

  it("does not change read-only or disabled controls", async () => {
    const screen = await render(
      <>
        <Input aria-label="Read only" readOnly value="ada@example.com" />
        <Input aria-label="Disabled" defaultValue="locked" disabled />
        <Textarea aria-label="Notes" disabled />
      </>,
    );

    await userEvent.type(screen.getByLabelText("Read only"), "x");
    await expect
      .element(screen.getByLabelText("Read only"))
      .toHaveValue("ada@example.com");
    await expect.element(screen.getByLabelText("Disabled")).toBeDisabled();
    await expect.element(screen.getByLabelText("Notes")).toBeDisabled();
  });

  it("forwards refs for form libraries", async () => {
    let element: HTMLInputElement | null = null;
    await render(
      <Input
        aria-label="Ref"
        ref={(node) => {
          element = node;
        }}
      />,
    );
    expect(element).toBeInstanceOf(HTMLInputElement);
  });

  it("renders a native select and a labelled search field", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <>
        <Select aria-label="Country" defaultValue="ng" onChange={onChange}>
          <option value="ng">Nigeria</option>
          <option value="gh">Ghana</option>
        </Select>
        <SearchInput aria-label="Search users" />
      </>,
    );

    await userEvent.selectOptions(screen.getByLabelText("Country"), "gh");
    expect(onChange).toHaveBeenCalled();
    await expect
      .element(screen.getByRole("searchbox", { name: "Search users" }))
      .toBeVisible();
  });

  it("keeps a 44px control height", async () => {
    const screen = await render(<Input aria-label="Height" />);
    expect(
      screen.getByLabelText("Height").element().getBoundingClientRect().height,
    ).toBe(44);
  });
});

describe("Checkbox and radios", () => {
  it("labels and describes a checkbox", async () => {
    const screen = await render(
      <Checkbox
        description="Product news, at most monthly."
        label="Email updates"
        name="updates"
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Email updates" });

    await expect
      .element(checkbox)
      .toHaveAccessibleDescription("Product news, at most monthly.");
    await screen.getByText("Email updates").click();
    await expect.element(checkbox).toBeChecked();
  });

  it("groups radios with a legend and moves with arrow keys", async () => {
    const screen = await render(
      <RadioGroup error="Choose a method." legend="Payment method">
        <Radio defaultChecked label="Card" name="method" value="card" />
        <Radio label="Bank transfer" name="method" value="bank" />
      </RadioGroup>,
    );
    const group = screen.getByRole("group", { name: "Payment method" });

    await expect.element(group).toHaveAccessibleDescription("Choose a method.");
    (
      screen.getByRole("radio", { name: "Card" }).element() as HTMLElement
    ).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("radio", { name: "Bank transfer" }))
      .toBeChecked();
  });

  it("selects a radio card by clicking anywhere on it", async () => {
    const screen = await render(
      <RadioGroup legend="Interval">
        <RadioCard description="Billed every month" label="Monthly" name="i" />
        <RadioCard description="Two months free" label="Yearly" name="i" />
      </RadioGroup>,
    );

    await screen.getByText("Two months free").click();
    const yearly = screen.getByRole("radio", { name: /Yearly/ });
    await expect.element(yearly).toBeChecked();
    await expect.element(yearly).toHaveAccessibleDescription("Two months free");
  });
});

describe("Switch", () => {
  it("toggles with the keyboard and reports its state", async () => {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <>
        <label htmlFor="alerts">Security alerts</label>
        <Switch id="alerts" onCheckedChange={onCheckedChange} />
      </>,
    );
    const toggle = screen.getByRole("switch", { name: "Security alerts" });

    await expect.element(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.tab();
    await expect.element(toggle).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.element(toggle).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    // 44px touch target.
    expect(toggle.element().getBoundingClientRect().height).toBe(44);
  });

  it("cannot be toggled when disabled", async () => {
    const screen = await render(<Switch aria-label="Locked" disabled />);
    const toggle = screen.getByRole("switch", { name: "Locked" });
    await toggle.click({ force: true });
    await expect.element(toggle).toHaveAttribute("aria-checked", "false");
  });
});

describe("SegmentedControl", () => {
  const options = [
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ] as const;

  it("always keeps one option selected", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <SegmentedControl
        aria-label="Billing interval"
        onValueChange={onValueChange}
        options={options}
      />,
    );
    const monthly = screen.getByRole("radio", { name: "Monthly" });

    await expect.element(monthly).toHaveAttribute("aria-checked", "true");
    await monthly.click();
    await expect.element(monthly).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).not.toHaveBeenCalled();

    await screen.getByRole("radio", { name: "Yearly" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith("yearly");
    await expect
      .element(screen.getByRole("radio", { name: "Yearly" }))
      .toHaveAttribute("aria-checked", "true");
  });

  it("moves focus with arrow keys", async () => {
    const screen = await render(
      <SegmentedControl aria-label="Billing interval" options={options} />,
    );
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("radio", { name: "Yearly" }))
      .toHaveFocus();
  });
});

describe("PasswordInput", () => {
  it("shows and hides the password with a labelled toggle", async () => {
    const screen = await render(
      <PasswordInput aria-label="Password" defaultValue="s3cret" id="pw" />,
    );
    const input = screen.getByLabelText("Password", { exact: true });
    const toggle = screen.getByRole("button", { name: "Show password" });

    await expect.element(input).toHaveAttribute("type", "password");
    await toggle.click();
    await expect.element(input).toHaveAttribute("type", "text");
    await expect
      .element(screen.getByRole("button", { name: "Hide password" }))
      .toHaveAttribute("aria-pressed", "true");
  });
});

describe("OtpInput", () => {
  function Harness({ length = 6 }: { length?: number }) {
    const [value, setValue] = useState("");
    return (
      <>
        <OtpInput
          id="otp"
          length={length}
          normalize={(code) => code.replace(/\D/g, "")}
          onChange={setValue}
          value={value}
        />
        <output data-testid="value">{value}</output>
      </>
    );
  }

  it("advances on typing, filters input and steps back on Backspace", async () => {
    const screen = await render(<Harness />);
    const first = screen.getByLabelText("Character 1 of 6");

    await first.click();
    await userEvent.keyboard("1a2");
    await expect.element(screen.getByTestId("value")).toHaveTextContent("12");
    await expect
      .element(screen.getByLabelText("Character 3 of 6"))
      .toHaveFocus();

    await userEvent.keyboard("{Backspace}");
    await expect.element(screen.getByTestId("value")).toHaveTextContent("1");
    await expect
      .element(screen.getByLabelText("Character 2 of 6"))
      .toHaveFocus();
  });

  it("fills every box from a pasted code", async () => {
    const screen = await render(<Harness />);
    await screen.getByLabelText("Character 1 of 6").click();
    const data = new DataTransfer();
    data.setData("text", "12 34 56");
    screen
      .getByLabelText("Character 1 of 6")
      .element()
      .dispatchEvent(
        new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: data,
        }),
      );

    await expect
      .element(screen.getByTestId("value"))
      .toHaveTextContent("123456");
    await expect
      .element(screen.getByLabelText("Character 6 of 6"))
      .toHaveValue("6");
  });

  it("offers one-time-code autofill on the first box", async () => {
    const screen = await render(<Harness />);
    await expect
      .element(screen.getByLabelText("Character 1 of 6"))
      .toHaveAttribute("autocomplete", "one-time-code");
    await expect
      .element(screen.getByLabelText("Character 2 of 6"))
      .toHaveAttribute("autocomplete", "off");
  });
});
