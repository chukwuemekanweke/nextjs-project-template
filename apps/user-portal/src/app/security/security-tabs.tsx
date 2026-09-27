import { Tabs } from "@template/ui-core";
import type { ReactNode } from "react";

type SecurityTab = "general" | "devices";

export function SecurityTabs({
  devices,
  general,
}: Readonly<{ devices: ReactNode; general: ReactNode }>) {
  return (
    <Tabs<SecurityTab>
      ariaLabel="Security sections"
      defaultValue="general"
      items={[
        { content: general, label: "General", value: "general" },
        { content: devices, label: "Devices", value: "devices" },
      ]}
      panelClassName="space-y-6 sm:mt-8 sm:space-y-8"
    />
  );
}
