"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Modal,
} from "@template/ui-core";
import { useState } from "react";
import { PasswordChangeForm } from "./password-change-form";

export function PasswordChangeCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Confirm your current password before choosing a new one.
        </CardDescription>
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              Account password
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose a strong, unique password for this account.
            </p>
          </div>
          <button
            className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white"
            onClick={() => setOpen(true)}
            type="button"
          >
            Change password
          </button>
        </div>
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
