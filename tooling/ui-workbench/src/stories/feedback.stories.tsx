import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  KeyIcon,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonText,
} from "@template/ui-core";
import { Gallery, Specimen } from "../support/specimen";

const meta = {
  title: "Feedback/Gallery",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Alerts in every tone (`.alert`, `.a-info/ok/warn/bad`). */
export const Alerts: Story = {
  render: () => (
    <Gallery>
      <div className="grid gap-3 md:grid-cols-2">
        <Alert variant="info">Your workspace was updated.</Alert>
        <Alert variant="success">Changes saved.</Alert>
        <Alert variant="warning">Your session expires in 5 minutes.</Alert>
        <Alert variant="error">We could not save your changes.</Alert>
        <Alert
          action={
            <Button size="sm" variant="secondary">
              Retry
            </Button>
          }
          title="Sync paused"
          variant="warning"
        >
          We will retry automatically when you are back online.
        </Alert>
        <Alert onDismiss={() => undefined} variant="info">
          Dismissible alert with a labelled close button.
        </Alert>
      </div>
    </Gallery>
  ),
};

/** Loading placeholders; pulsing stops under reduced motion. */
export const LoadingPlaceholders: Story = {
  render: () => (
    <Gallery>
      <Specimen title="Primitives">
        <div className="flex w-full max-w-md items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <SkeletonText className="flex-1" lines={2} />
        </div>
      </Specimen>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard label="Loading profile" />
        <Card>
          <SkeletonList label="Loading sessions" rows={3} />
        </Card>
      </div>
    </Gallery>
  ),
};

/** Empty and error states with actions. */
export const EmptyAndError: Story = {
  render: () => (
    <Gallery>
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState
          action={<Button size="sm">Add passkey</Button>}
          description="Passkeys let you sign in with your fingerprint, face or screen lock."
          icon={<KeyIcon />}
          secondaryAction={
            <Button size="sm" variant="ghost">
              Learn more
            </Button>
          }
          title="No passkeys yet"
        />
        <Card>
          <ErrorState
            action={
              <Button size="sm" variant="ghost">
                Back to dashboard
              </Button>
            }
            onRetry={() => undefined}
          />
        </Card>
      </div>
    </Gallery>
  ),
};
