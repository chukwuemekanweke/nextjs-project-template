"use client";

import { useApiQueryClient } from "@template/api-react/query-client";
import { LogOutIcon } from "@template/ui-core";
import { useState, type ComponentProps } from "react";
import { logoutPortalSession } from "@/lib/logout";

/**
 * Signs out and clears private client state. Extra props (class names, and
 * the role, handlers and ref a menu item passes through `asChild`) are
 * applied to the button.
 */
export function LogoutButton({
  className,
  onClick,
  ...props
}: Omit<ComponentProps<"button">, "children" | "type">) {
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
      {...props}
      aria-busy={isLoggingOut}
      className={[
        "disabled:cursor-wait disabled:opacity-60",
        className ?? "w-full text-left",
      ].join(" ")}
      disabled={isLoggingOut}
      onClick={(event) => {
        onClick?.(event);
        void handleLogout();
      }}
      type="button"
    >
      <LogOutIcon />
      {isLoggingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
