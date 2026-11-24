"use client";

import {
  Card,
  CardContent,
  KeyIcon,
  Modal,
  SectionHeader,
  SettingsRow,
  buttonClassName,
} from "@template/ui-core";
import { useState } from "react";
import { PasswordChangeForm } from "./password-change-form";

export function PasswordChangeCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent>
        <SectionHeader
          description="Confirm your current password before choosing a new one."
          icon={<KeyIcon className="h-6 w-6" />}
          title="Change password"
        />
        <SettingsRow
          actions={
            <button
              className={buttonClassName()}
              onClick={() => setOpen(true)}
              type="button"
            >
              Change password
            </button>
          }
          className="mt-5"
          description="Choose a strong, unique password for this account."
          title="Account password"
        />
        <Modal
          description="Enter your current password, then choose and confirm a new one."
          onClose={() => setOpen(false)}
          open={open}
          title="Change password"
        >
          <PasswordChangeForm />
        </Modal>
      </CardContent>
    </Card>
  );
}
