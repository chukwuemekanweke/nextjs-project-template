import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Checkbox,
  CreditCardIcon,
  FormField,
  IconTile,
  Input,
  OtpInput,
  PasswordInput,
  Radio,
  RadioCard,
  RadioGroup,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
  WalletIcon,
} from "@template/ui-core";
import { useState } from "react";
import { Gallery, Specimen } from "../support/specimen";

const meta = {
  title: "Forms/Gallery",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function OtpDemo() {
  const [value, setValue] = useState("4821");
  return (
    <FormField inputId="otp-demo-0" label="Verification code">
      <OtpInput
        id="otp-demo"
        normalize={(code) => code.replace(/\D/g, "")}
        onChange={setValue}
        value={value}
      />
    </FormField>
  );
}

/** Text controls in every reference state (`.field`, `.input`, `.err-t`). */
export const TextControls: Story = {
  render: () => (
    <Gallery>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField inputId="f-default" label="Default">
          <Input defaultValue="Ada Okafor" id="f-default" />
        </FormField>
        <FormField inputId="f-placeholder" label="Placeholder" required>
          <Input id="f-placeholder" placeholder="you@example.com" required />
        </FormField>
        <FormField
          descriptionId="f-hint-d"
          hint="Shown on invoices."
          inputId="f-hint"
          label="With hint"
        >
          <Input aria-describedby="f-hint-d" id="f-hint" />
        </FormField>
        <FormField inputId="f-readonly" label="Read-only">
          <Input defaultValue="ada@example.com" id="f-readonly" readOnly />
        </FormField>
        <FormField inputId="f-disabled" label="Disabled">
          <Input defaultValue="Locked value" disabled id="f-disabled" />
        </FormField>
        <FormField
          descriptionId="f-error-d"
          error="Enter a valid email address."
          inputId="f-error"
          label="Error"
        >
          <Input
            aria-describedby="f-error-d"
            aria-invalid
            defaultValue="abc"
            id="f-error"
          />
        </FormField>
        <FormField inputId="f-select" label="Country">
          <Select defaultValue="ng" id="f-select">
            <option value="ng">Nigeria</option>
            <option value="gh">Ghana</option>
            <option value="ke">Kenya</option>
          </Select>
        </FormField>
        <FormField inputId="f-password" label="Password">
          <PasswordInput defaultValue="correct-horse" id="f-password" />
        </FormField>
        <FormField inputId="f-search" label="Search">
          <SearchInput id="f-search" placeholder="Search members" />
        </FormField>
      </div>
      <FormField inputId="f-textarea" label="Notes">
        <Textarea
          id="f-textarea"
          placeholder="Anything we should know?"
          rows={3}
        />
      </FormField>
      <OtpDemo />
    </Gallery>
  ),
};

/** Checkboxes, radios, radio cards, switches and the segmented control. */
export const ChoiceControls: Story = {
  render: () => (
    <Gallery>
      <Specimen title="Checkbox (`.check`)">
        <div className="flex flex-col gap-3">
          <Checkbox defaultChecked label="Email me product updates" />
          <Checkbox
            description="We will only contact you about security events."
            label="Security alerts"
          />
          <Checkbox disabled label="Disabled option" />
        </div>
      </Specimen>
      <Specimen title="Radio group">
        <RadioGroup legend="Notification frequency">
          <Radio defaultChecked label="Immediately" name="freq" />
          <Radio label="Daily digest" name="freq" />
          <Radio disabled label="Weekly (unavailable)" name="freq" />
        </RadioGroup>
      </Specimen>
      <Specimen title="Radio cards">
        <RadioGroup
          className="w-full max-w-2xl"
          error="Choose a method to continue."
          legend="Method"
          orientation="horizontal"
        >
          <RadioCard
            defaultChecked
            description="Pay with a saved card."
            label="Card"
            leading={
              <IconTile size="sm">
                <CreditCardIcon />
              </IconTile>
            }
            name="method"
          />
          <RadioCard
            description="Transfer from your bank."
            label="Bank transfer"
            leading={
              <IconTile size="sm">
                <WalletIcon />
              </IconTile>
            }
            name="method"
          />
        </RadioGroup>
      </Specimen>
      <Specimen title="Switch (`.switch`)">
        <div className="flex items-center gap-2">
          <Switch aria-label="On" defaultChecked />
          <Switch aria-label="Off" />
          <Switch aria-label="Disabled" disabled />
        </div>
      </Specimen>
      <Specimen title="Segmented control (`.seg`)">
        <SegmentedControl
          aria-label="Billing interval"
          options={[
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
          ]}
        />
      </Specimen>
    </Gallery>
  ),
};
