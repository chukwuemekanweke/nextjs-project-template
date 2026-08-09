"use client";

import { useApiQueryClient } from "@template/api-react/query-client";
import { useState } from "react";
import { logoutPortalSession } from "@/lib/logout";

export function LogoutButton() {
  const queryClient = useApiQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    await logoutPortalSession({
      cancelPrivateRequests: () => queryClient.cancelQueries(),
      clearPrivateData: () => queryClient.clear(),
    });
  }

  return (
    <button
      aria-busy={isLoggingOut}
      className="w-full text-left disabled:cursor-wait disabled:opacity-60"
      disabled={isLoggingOut}
      onClick={() => void handleLogout()}
      type="button"
    >
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
