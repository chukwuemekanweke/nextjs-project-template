import type { BadgeTone } from "@template/ui-core";

/*
 * Workbench-only preview data. It demonstrates layout (long names, numeric
 * alignment, row actions) and is never imported by application code. It is
 * deliberately generic: no payments, balances, verification or security
 * outcomes are simulated.
 */

export type TeamMemberFixture = Readonly<{
  email: string;
  id: string;
  lastActive: string;
  name: string;
  projects: number;
  role: string;
  status: Readonly<{ label: string; tone: BadgeTone }>;
}>;

export const teamMemberFixtures: readonly TeamMemberFixture[] = [
  {
    email: "ada.okafor@example.com",
    id: "member-1",
    lastActive: "25 Nov 2026",
    name: "Ada Okafor",
    projects: 12,
    role: "Owner",
    status: { label: "Active", tone: "success" },
  },
  {
    email: "tunde.balogun@example.com",
    id: "member-2",
    lastActive: "24 Nov 2026",
    name: "Tunde Balogun",
    projects: 4,
    role: "Editor",
    status: { label: "Invited", tone: "warning" },
  },
  {
    email: "chiamaka.nwosu-adeyemi.long.address@example.com",
    id: "member-3",
    lastActive: "02 Oct 2026",
    name: "Chiamaka Nwosu-Adeyemi",
    projects: 0,
    role: "Viewer",
    status: { label: "Deactivated", tone: "neutral" },
  },
];

/** Illustrative weekly series for chart-frame previews (unitless). */
export const weeklySeriesFixture: readonly number[] = [
  32, 41, 38, 52, 48, 61, 58,
];
