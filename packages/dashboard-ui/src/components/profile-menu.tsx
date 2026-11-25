"use client";

import {
  Avatar,
  ChevronDownIcon,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@template/ui-core";
import type { ReactElement } from "react";

/**
 * Avatar with a name and secondary line (reference identity blocks in the
 * top bar, sidebar footer and drawer). Values come from the application's
 * authenticated account; long values truncate with the full text in `title`.
 */
export function AccountSummary({
  avatarSrc,
  className,
  detail,
  meta,
  name,
}: Readonly<{
  avatarSrc?: string | null;
  className?: string;
  /** Secondary line, for example an email address or a role. */
  detail?: string;
  /** Optional third line. */
  meta?: string;
  name: string;
}>) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar decorative name={name} src={avatarSrc} />
      <div className="min-w-0 leading-tight">
        <p className="text-label text-fg truncate" title={name}>
          {name}
        </p>
        {detail ? (
          <p
            className="text-caption text-fg-subtle mt-0.5 truncate font-normal"
            title={detail}
          >
            {detail}
          </p>
        ) : null}
        {meta ? (
          <p className="text-caption text-fg-subtle mt-0.5 truncate font-normal">
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Top-bar account menu. The trigger shows the avatar, and from `md` the
 * name and `role` line (reference user top bar). The menu repeats the
 * identity and lists `actions`: each must be a single element that spreads
 * the props it receives onto a link or button (for example `next/link` or
 * an app's sign-out button), so it becomes a keyboard-operable menu item.
 */
export function ProfileMenu({
  actions = [],
  avatarSrc,
  meta,
  name,
  role,
}: Readonly<{
  actions?: readonly ReactElement[];
  avatarSrc?: string | null;
  meta?: string;
  name: string;
  /** Secondary line: email address, role or portal name. */
  role: string;
}>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Account menu for ${name}`}
          className="hover:bg-hover data-[state=open]:bg-hover flex max-w-64 min-w-0 shrink items-center gap-2.5 rounded-md p-0.5 text-left transition-colors md:pr-2"
          type="button"
        >
          <Avatar decorative name={name} src={avatarSrc} />
          <span className="hidden min-w-0 leading-tight md:block">
            <span className="text-label text-fg block truncate">{name}</span>
            <span className="text-caption text-fg-subtle block truncate font-normal">
              {role}
            </span>
          </span>
          <ChevronDownIcon className="size-icon-xs text-fg-subtle hidden shrink-0 md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 max-w-[calc(100vw-1rem)]">
        <DropdownMenuLabel>
          <AccountSummary
            avatarSrc={avatarSrc}
            detail={role}
            meta={meta}
            name={name}
          />
        </DropdownMenuLabel>
        {actions.length > 0 ? <DropdownMenuSeparator /> : null}
        {actions.map((action, index) => (
          <DropdownMenuItem asChild key={action.key ?? index}>
            {action}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
