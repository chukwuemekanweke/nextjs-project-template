import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  Badge,
  Chip,
  CircleCheckIcon,
  CreditCardIcon,
  Divider,
  IconTile,
  Progress,
  ShieldCheckIcon,
  Spinner,
  TriangleAlertIcon,
  UsersIcon,
  WalletIcon,
} from "@template/ui-core";
import { Gallery, Specimen } from "../support/specimen";

const meta = {
  title: "Indicators/Gallery",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Badges, chips, avatars, icon tiles, progress, spinner and dividers. */
export const AllIndicators: Story = {
  render: () => (
    <Gallery>
      <Specimen title="Badge tones (`.badge`)">
        <Badge tone="success">Active</Badge>
        <Badge tone="warning">Pending</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="info">In progress</Badge>
        <Badge>Expired</Badge>
        <Badge dot={false} tone="info">
          Without dot
        </Badge>
      </Specimen>
      <Specimen title="Chips (`.chip`)">
        <Chip>Owner</Chip>
        <Chip>Billing</Chip>
        <Chip onRemove={() => undefined} removeLabel="Remove filter Status">
          Status: Active
        </Chip>
      </Specimen>
      <Specimen title="Avatars (`.avatar`)">
        <Avatar name="Ada Okafor" size="sm" />
        <Avatar name="Ada Okafor" />
        <Avatar name="Tunde Balogun" size="lg" />
        <Avatar name="Broken Image" src="/missing-avatar.png" />
      </Specimen>
      <Specimen title="Icon tiles (`.ico`)">
        <IconTile>
          <WalletIcon />
        </IconTile>
        <IconTile tone="success">
          <CircleCheckIcon />
        </IconTile>
        <IconTile tone="warning">
          <TriangleAlertIcon />
        </IconTile>
        <IconTile tone="danger">
          <ShieldCheckIcon />
        </IconTile>
        <IconTile tone="neutral">
          <UsersIcon />
        </IconTile>
        <IconTile size="lg">
          <CreditCardIcon />
        </IconTile>
      </Specimen>
      <Specimen title="Progress (`.progress`)">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Progress label="Storage used" value={35} />
          <Progress label="Profile complete" tone="success" value={80} />
          <Progress label="Quota" tone="warning" value={92} />
        </div>
      </Specimen>
      <Specimen title="Spinner">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </Specimen>
      <Specimen title="Divider (`.divider`, `.or`)">
        <div className="flex w-full max-w-md flex-col gap-4">
          <Divider />
          <Divider label="or" />
        </div>
      </Specimen>
    </Gallery>
  ),
};
