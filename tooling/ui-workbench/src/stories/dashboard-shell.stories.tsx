import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AccountSummary,
  Breadcrumbs,
  DashboardBrand,
  DashboardHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardSidebarNav,
  DashboardTopbar,
  MobileNavDrawer,
  MobileTabBar,
  ProfileMenu,
  type BreadcrumbItem,
  type DashboardNavGroup,
} from "@template/dashboard-ui";
import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  cn,
  DarkModeSwitch,
  LogOutIcon,
  ShieldIcon,
  UserIcon,
} from "@template/ui-core";
import {
  adminAccountFixture,
  adminReferenceNavigation,
  longAccountFixture,
  longNavigationLabelsFixture,
  userAccountFixture,
  userReferenceNavigation,
  userReferenceTabs,
} from "./__fixtures__/dashboard-navigation";

type Portal = "user" | "admin";

type ShellPreviewProps = {
  activeHref?: string;
  collapsed?: boolean;
  long?: boolean;
  menuOpen?: boolean;
  portal: Portal;
};

const sidebarAction = cn(
  buttonVariants({ fullWidth: true, variant: "ghost" }),
  "justify-start",
);

function SignOut({ className }: { className?: string }) {
  return (
    <button className={className} type="button">
      <LogOutIcon />
      Sign out
    </button>
  );
}

/**
 * The shared shell composed as each portal composes it, with the complete
 * reference navigation from workbench fixtures. Page content is a neutral
 * placeholder: page redesigns belong to their own tickets.
 */
function ShellPreview({
  activeHref,
  collapsed = false,
  long = false,
  menuOpen = false,
  portal,
}: ShellPreviewProps) {
  const admin = portal === "admin";
  const home = admin ? "/" : "/dashboard";
  const current = activeHref ?? home;
  const account = long
    ? { detail: longAccountFixture.email, name: longAccountFixture.name }
    : admin
      ? adminAccountFixture
      : { detail: userAccountFixture.email, name: userAccountFixture.name };
  const groups: readonly DashboardNavGroup[] = admin
    ? adminReferenceNavigation
    : [{ items: userReferenceNavigation }];
  const navGroups = long ? [...groups, longNavigationLabelsFixture] : groups;
  const crumbs: readonly BreadcrumbItem[] = long
    ? [
        { href: "/billing", label: "Billing" },
        { href: "/billing/history", label: "History" },
        {
          label: "Purchase 7f3c2a91-4b6e-4c2d-9a10-quarterly-renewal-reference",
        },
      ]
    : admin
      ? [{ label: "Dashboard" }]
      : [{ label: "Overview" }];

  const brand = (
    <DashboardBrand
      badge={admin ? "Admin" : undefined}
      href={home}
      name="Template"
    />
  );
  const navigation = (
    <DashboardSidebarNav
      activeHref={current}
      ariaLabel={admin ? "Admin navigation" : "User navigation"}
      groups={navGroups}
    />
  );

  return (
    <DashboardShell
      defaultExpanded={!collapsed}
      defaultMobileOpen={menuOpen}
      mobileNav={
        <MobileNavDrawer
          brand={brand}
          footer={
            <>
              {admin ? (
                <AccountSummary className="px-2 py-1" {...account} />
              ) : null}
              <DarkModeSwitch className={admin ? "px-2" : undefined} />
              <SignOut className={sidebarAction} />
            </>
          }
          header={
            admin ? undefined : (
              <AccountSummary
                className="border-border bg-surface-2 rounded-lg border p-3"
                {...account}
              />
            )
          }
          title={admin ? "Admin menu" : "Menu"}
        >
          {navigation}
        </MobileNavDrawer>
      }
      sidebar={
        <DashboardSidebar
          brand={brand}
          brandMark={<DashboardBrand compact href={home} name="Template" />}
          footer={
            <>
              {admin ? null : (
                <div className="border-border bg-surface-2 text-small flex flex-col gap-2 rounded-lg border p-4">
                  <span className="text-fg font-semibold">Need help?</span>
                  <span className="text-fg-muted">
                    Email{" "}
                    <a
                      className="text-brand-ink"
                      href="mailto:support@example.com"
                    >
                      support@example.com
                    </a>{" "}
                    and our team will help.
                  </span>
                </div>
              )}
              <SignOut className={sidebarAction} />
            </>
          }
        >
          {navigation}
        </DashboardSidebar>
      }
      tabBar={
        admin ? undefined : (
          <MobileTabBar
            activeHref={current}
            ariaLabel="Primary"
            items={userReferenceTabs}
          />
        )
      }
      topbar={
        <DashboardTopbar
          actions={
            <ProfileMenu
              actions={[
                <a href="#profile" key="profile">
                  <UserIcon />
                  View profile
                </a>,
                <a href="#security" key="security">
                  <ShieldIcon />
                  Security and sessions
                </a>,
                <SignOut key="sign-out" />,
              ]}
              name={account.name}
              role={account.detail}
            />
          }
          brand={
            <DashboardBrand
              badge={admin ? "Admin" : undefined}
              href={home}
              name="Template"
              size="sm"
            />
          }
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
      }
    >
      <div className="flex flex-col gap-6" data-shell-content>
        <DashboardHeader
          description={
            admin
              ? "Platform health across users, payments and subscriptions."
              : "Here is the state of your account today."
          }
          title={
            admin
              ? "Operations overview"
              : `Good morning, ${account.name.split(" ")[0]}`
          }
        />
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
          {["First section", "Second section", "Third section"].map((title) => (
            <Card key={title}>
              <CardContent>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  Page content is owned by each screen ticket; this placeholder
                  shows the shell content area.
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

const meta = {
  args: { portal: "user" },
  argTypes: {
    activeHref: { control: "text" },
    portal: { control: "inline-radio", options: ["user", "admin"] },
  },
  component: ShellPreview,
  parameters: { bare: true, layout: "fullscreen" },
  title: "Dashboard/Shell",
} satisfies Meta<typeof ShellPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `3-user-portal/UserDashboard.html` (desktop) and `UserDashboardMobile.html`. */
export const UserPortal: Story = {};

export const UserCollapsed: Story = { args: { collapsed: true } };

/** `3-user-portal/UserMobileMenuMobile.html` (use the phone viewport). */
export const UserMenuOpen: Story = { args: { menuOpen: true } };

/** `4-admin-portal/AdminDashboard.html` and `AdminDashboardMobile.html`. */
export const AdminPortal: Story = { args: { portal: "admin" } };

export const AdminCollapsed: Story = {
  args: { collapsed: true, portal: "admin" },
};

/** `4-admin-portal/AdminMobileMenuMobile.html` (use the phone viewport). */
export const AdminMenuOpen: Story = {
  args: { menuOpen: true, portal: "admin" },
};

/** Active nested route under an overlapping item. */
export const UserActiveNested: Story = {
  args: { activeHref: "/billing/history" },
};

/** Long identity, breadcrumb and navigation labels; long admin navigation. */
export const LongContent: Story = { args: { long: true, portal: "admin" } };
