import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  KeyIcon,
  KeyValueList,
  LaptopIcon,
  ListRow,
  Panel,
  Stat,
  StatGrid,
  UsersIcon,
  ActivityIcon,
  FileTextIcon,
  IconTile,
} from "@template/ui-core";
import { teamMemberFixtures } from "./__fixtures__/team-members";

const meta = {
  title: "Surfaces/Gallery",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Card anatomy, panel, statistics, key-value list and list rows. */
export const AllSurfaces: Story = {
  render: () => (
    <div className="max-w-content flex flex-col gap-6" data-gallery>
      <StatGrid>
        <Stat
          delta={{ label: "+8% vs last week", trend: "up" }}
          icon={<UsersIcon />}
          label="Team members"
          value="24"
        />
        <Stat
          delta={{ label: "−2 vs last week", trend: "down" }}
          icon={<ActivityIcon />}
          label="Active projects"
          value="11"
        />
        <Stat
          icon={<FileTextIcon />}
          label="Documents"
          meta="Updated today"
          value="1,204"
        />
        <Stat
          delta={{ label: "No change", trend: "neutral" }}
          icon={<KeyIcon />}
          label="API keys"
          value="3"
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle as="h3">Workspace details</CardTitle>
            <CardDescription>
              Header, body and footer use card tokens.
            </CardDescription>
          </div>
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <KeyValueList
            items={[
              { label: "Workspace", value: "Acme Studio" },
              { label: "Owner", value: "Ada Okafor" },
              {
                label: "Contact email",
                value: "chiamaka.nwosu-adeyemi.long.address@example.com",
              },
              { label: "Region", value: "Europe (Frankfurt)" },
            ]}
          />
          <Panel>
            <p className="text-small text-fg-muted">
              A soft panel holds secondary information inside a card.
            </p>
          </Panel>
        </CardContent>
        <CardFooter>
          <Button variant="secondary">Cancel</Button>
          <Button>Save</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h3">Team</CardTitle>
        </CardHeader>
        <ul>
          {teamMemberFixtures.map((member) => (
            <ListRow
              actions={
                <Button size="sm" variant="secondary">
                  Manage
                </Button>
              }
              as="li"
              description={member.email}
              key={member.id}
              leading={<Avatar decorative name={member.name} />}
              meta={member.lastActive}
              title={member.name}
            >
              <Badge className="mt-1.5" tone={member.status.tone}>
                {member.status.label}
              </Badge>
            </ListRow>
          ))}
          <ListRow
            as="li"
            description="Last seen 2 hours ago"
            leading={
              <IconTile tone="neutral">
                <LaptopIcon />
              </IconTile>
            }
            title="Row with icon tile"
          />
        </ul>
      </Card>
    </div>
  ),
};
