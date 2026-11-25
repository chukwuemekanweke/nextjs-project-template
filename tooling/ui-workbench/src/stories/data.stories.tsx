import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  ErrorState,
  Pager,
  UsersIcon,
  type DataTableMobileLayout,
  type TableColumn,
} from "@template/ui-core";
import {
  teamMemberFixtures,
  type TeamMemberFixture,
} from "./__fixtures__/team-members";

const columns: readonly TableColumn<TeamMemberFixture>[] = [
  {
    cell: (member) => (
      <span className="flex items-center gap-3">
        <Avatar decorative name={member.name} size="sm" />
        <span className="min-w-0">
          <b className="text-fg block font-medium">{member.name}</b>
          <span className="text-small">{member.email}</span>
        </span>
      </span>
    ),
    header: "Member",
  },
  { cell: (member) => member.role, header: "Role" },
  {
    cell: (member) => (
      <Badge tone={member.status.tone}>{member.status.label}</Badge>
    ),
    header: "Status",
  },
  { align: "right", cell: (member) => member.projects, header: "Projects" },
  { cell: (member) => member.lastActive, header: "Last active" },
  {
    align: "right",
    cell: (member) => (
      <Button
        aria-label={`Manage ${member.name}`}
        size="sm"
        variant="secondary"
      >
        Manage
      </Button>
    ),
    header: "Actions",
    mobileLabel: "",
  },
];

type TableArgs = {
  loading: boolean;
  mobileLayout: DataTableMobileLayout;
  state: "rows" | "empty" | "error";
};

function TableDemo({ loading, mobileLayout, state }: TableArgs) {
  return (
    <Card className="max-w-content" data-gallery>
      <CardHeader>
        <CardTitle as="h3">Team members</CardTitle>
      </CardHeader>
      <DataTable
        caption="Team members"
        columns={columns}
        empty={
          <EmptyState
            description="Invite people to collaborate in this workspace."
            icon={<UsersIcon />}
            title="No members yet"
          />
        }
        error={
          state === "error" ? (
            <ErrorState
              description="Members could not be loaded."
              onRetry={() => undefined}
            />
          ) : undefined
        }
        keyField={(member) => member.id}
        loading={loading}
        mobileLayout={mobileLayout}
        rows={state === "empty" ? [] : teamMemberFixtures}
        variant="embedded"
      />
      <Pager
        onPageChange={() => undefined}
        page={1}
        pageSize={3}
        totalItems={state === "empty" ? 0 : 3}
        totalPages={1}
      />
    </Card>
  );
}

const meta = {
  args: { loading: false, mobileLayout: "stack", state: "rows" },
  argTypes: {
    mobileLayout: { control: "inline-radio", options: ["stack", "scroll"] },
    state: { control: "inline-radio", options: ["rows", "empty", "error"] },
  },
  component: TableDemo,
  title: "Data/DataTable",
} satisfies Meta<typeof TableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rows; stacked labelled blocks below `md` (`.tp.m .tbl`). */
export const Rows: Story = {};

/** Default phone behaviour: horizontal scroll inside the container. */
export const ScrollOnPhones: Story = { args: { mobileLayout: "scroll" } };

export const Loading: Story = { args: { loading: true } };

export const Empty: Story = { args: { state: "empty" } };

export const LoadError: Story = { args: { state: "error" } };

/** Pager at the first, a middle and the last page. */
export const PagerStates: Story = {
  render: () => (
    <Card className="max-w-content" data-gallery>
      <Pager
        onPageChange={() => undefined}
        page={1}
        pageSize={10}
        totalItems={42}
        totalPages={5}
      />
      <Pager
        onPageChange={() => undefined}
        page={3}
        pageSize={10}
        totalItems={42}
        totalPages={5}
      />
      <Pager
        onPageChange={() => undefined}
        page={5}
        pageSize={10}
        totalItems={42}
        totalPages={5}
      />
      <Pager loading onPageChange={() => undefined} page={2} totalPages={5} />
    </Card>
  ),
};
