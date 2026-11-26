import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AuthHeading,
  AuthLayout,
  AuthPanel,
  DashboardBrand,
} from "@template/dashboard-ui";
import {
  Button,
  Chip,
  FormField,
  IconTile,
  Input,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  Steps,
} from "@template/ui-core";

/*
 * Layout mechanics only: placeholder fields, no authentication outcomes.
 * Portal sign-in screens are tested in their apps (`testing-strategy`).
 */

const highlights = [
  { icon: <ShieldCheckIcon />, label: "Highlight one" },
  { icon: <LockIcon />, label: "Highlight two" },
];

function PlaceholderForm() {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <FormField inputId="story-field-1" label="Field label">
        <Input id="story-field-1" />
      </FormField>
      <FormField inputId="story-field-2" label="Another field">
        <Input id="story-field-2" />
      </FormField>
      <Button fullWidth type="submit">
        Primary action
      </Button>
    </form>
  );
}

type AuthPreviewProps = {
  panel?: boolean;
  variant: "form" | "steps" | "eyebrow";
};

function AuthPreview({ panel = true, variant }: AuthPreviewProps) {
  return (
    <AuthLayout
      brand={<DashboardBrand href="#" name="Template" />}
      footer="© 2026 Organization name"
      panel={
        panel ? (
          <AuthPanel
            description="A short supporting sentence for the brand panel."
            highlights={highlights}
            title="Brand panel title"
          />
        ) : undefined
      }
    >
      {variant === "steps" ? (
        <Steps
          current="two"
          steps={[
            { id: "one", label: "First" },
            { id: "two", label: "Second" },
            { id: "three", label: "Third" },
          ]}
        />
      ) : null}
      <AuthHeading
        description="Supporting copy for this step of the flow."
        eyebrow={variant === "eyebrow" ? <Chip>Portal chip</Chip> : undefined}
        icon={
          variant === "steps" ? (
            <IconTile className="size-14 rounded-[14px]" size="lg">
              <MailIcon />
            </IconTile>
          ) : undefined
        }
        title="Page heading"
      />
      <PlaceholderForm />
    </AuthLayout>
  );
}

const meta = {
  args: { variant: "form" },
  argTypes: {
    panel: { control: "boolean" },
    variant: { control: "inline-radio", options: ["form", "steps", "eyebrow"] },
  },
  component: AuthPreview,
  parameters: { bare: true, layout: "fullscreen" },
  title: "Layout/Auth layout",
} satisfies Meta<typeof AuthPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `2-authentication/AuthSignIn.html` structure; the panel shows from `lg`. */
export const Default: Story = {};

/** Steps and icon tile, as in `AuthConfirmEmail.html`. */
export const WithSteps: Story = { args: { variant: "steps" } };

/** Portal chip above the heading, as in `AdminSignIn.html`. */
export const WithEyebrow: Story = { args: { variant: "eyebrow" } };

export const WithoutPanel: Story = { args: { panel: false } };
