import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  ConfirmDialog,
  Dialog,
  FormField,
  Input,
  Tabs,
} from "@template/ui-core";
import { useState } from "react";

const meta = {
  title: "Overlays and navigation/Gallery",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo({
  dismissible = true,
  long = false,
}: {
  dismissible?: boolean;
  long?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        description="Choose a name you will recognise on this device."
        dismissible={dismissible}
        footer={
          <>
            <Button onClick={() => setOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
        onOpenChange={setOpen}
        open={open}
        title="Rename passkey"
      >
        <FormField inputId="dialog-name" label="Name">
          <Input defaultValue="Work laptop" id="dialog-name" />
        </FormField>
        {long
          ? Array.from({ length: 12 }, (_, index) => (
              <p className="text-fg-muted mt-4" key={index}>
                Long content paragraph {index + 1}. The body scrolls while the
                header and footer stay in place.
              </p>
            ))
          : null}
      </Dialog>
    </>
  );
}

/** Desktop card near the top; bottom sheet on phones (`.modal`). */
export const DialogOpen: Story = { render: () => <DialogDemo /> };

/** Escape and the close button are disabled while an operation runs. */
export const DialogNonDismissible: Story = {
  render: () => <DialogDemo dismissible={false} />,
};

export const DialogLongContent: Story = {
  render: () => <DialogDemo long />,
};

function ConfirmDemo({ pending = false }: { pending?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="dangerOutline">
        Remove passkey
      </Button>
      <ConfirmDialog
        confirmLabel="Remove passkey"
        description="You will no longer be able to sign in with “Work laptop”."
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        open={open}
        pending={pending}
        title="Remove this passkey?"
      />
    </>
  );
}

/** Destructive confirmation (`ConfirmDialog`). */
export const ConfirmDestructive: Story = { render: () => <ConfirmDemo /> };

export const ConfirmPending: Story = {
  render: () => <ConfirmDemo pending />,
};

/** Underline tabs with a disabled tab and many items (scrolls on phones). */
export const TabsGallery: Story = {
  render: () => (
    <div className="max-w-content" data-gallery>
      <Tabs
        ariaLabel="Security sections"
        defaultValue="overview"
        items={[
          {
            content: <p>Overview content.</p>,
            label: "Overview",
            value: "overview",
          },
          {
            content: <p>Password content.</p>,
            label: "Password",
            value: "password",
          },
          {
            content: <p>Two-factor content.</p>,
            label: "Two-factor",
            value: "2fa",
          },
          {
            content: <p>Passkeys content.</p>,
            label: "Passkeys",
            value: "passkeys",
          },
          {
            content: <p>Sessions content.</p>,
            disabled: true,
            label: "Sessions (disabled)",
            value: "sessions",
          },
          {
            content: <p>Activity content.</p>,
            label: "Activity",
            value: "activity",
          },
        ]}
      />
    </div>
  ),
};
