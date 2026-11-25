import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowRightIcon,
  Button,
  CloseIcon,
  IconButton,
  MenuIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from "@template/ui-core";
import { Gallery, Specimen } from "../support/specimen";

const meta = {
  args: { children: "Save changes" },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "dangerOutline"],
    },
  },
  component: Button,
  title: "Actions/Button",
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground: change variant, size, loading and disabled. */
export const Playground: Story = {};

/** Every reference variant and state (`.btn-p/s/g/d/dg`, `.btn-sm`). */
export const AllVariants: Story = {
  render: () => (
    <Gallery>
      <Specimen title="Variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Destructive</Button>
        <Button variant="dangerOutline">Danger outline</Button>
      </Specimen>
      <Specimen title="Small">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="ghost">
          Ghost
        </Button>
        <Button size="sm" variant="danger">
          Destructive
        </Button>
        <Button size="sm" variant="dangerOutline">
          Danger outline
        </Button>
      </Specimen>
      <Specimen title="Icons">
        <Button leadingIcon={<PlusIcon />}>Add passkey</Button>
        <Button trailingIcon={<ArrowRightIcon />} variant="secondary">
          Continue
        </Button>
        <Button leadingIcon={<TrashIcon />} variant="dangerOutline">
          Remove
        </Button>
      </Specimen>
      <Specimen title="States">
        <Button disabled>Disabled</Button>
        <Button disabled variant="secondary">
          Disabled
        </Button>
        <Button loading>Saving</Button>
        <Button loading variant="secondary">
          Refreshing
        </Button>
        <Button asChild variant="secondary">
          <a href="#billing">Link as button</a>
        </Button>
      </Specimen>
      <Specimen title="Full width">
        <div className="w-full max-w-sm">
          <Button fullWidth>Sign in</Button>
        </div>
      </Specimen>
      <Specimen title="Icon buttons">
        <IconButton icon={<MenuIcon />} label="Open navigation" />
        <IconButton icon={<CloseIcon />} label="Close" variant="ghost" />
        <IconButton icon={<RefreshIcon />} label="Refresh" size="sm" />
        <IconButton disabled icon={<TrashIcon />} label="Delete" />
      </Specimen>
    </Gallery>
  ),
};
