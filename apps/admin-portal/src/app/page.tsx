import type { Metadata } from "next";
import { AdminDashboard } from "./_dashboard/admin-dashboard";
import { productionAdminDashboard } from "./_dashboard/admin-dashboard-data";

export const metadata: Metadata = { title: "Operations overview" };

export default function Home() {
  return <AdminDashboard data={productionAdminDashboard} />;
}
