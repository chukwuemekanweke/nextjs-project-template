import { ChevronDownIcon } from "@template/ui-core";
import type { ReactNode } from "react";

export function ProfileMenu({
  name,
  role,
  meta,
  actions,
}: Readonly<{
  name: string;
  role: string;
  meta?: string;
  actions?: readonly ReactNode[];
}>) {
  return (
    <details className="group relative">
      <summary
        aria-label={`Account menu for ${name}`}
        className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-1 pr-1 pl-1 text-gray-700 transition-colors hover:bg-gray-100 sm:pr-2 dark:text-gray-300 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
        >
          {initials(name)}
        </span>
        <span className="hidden text-sm font-medium sm:block">{name}</span>
        <ChevronDownIcon className="hidden h-4 w-4 text-gray-500 transition-transform group-open:rotate-180 sm:block" />
      </summary>
      <div className="shadow-theme-lg absolute right-0 z-50 mt-2 flex w-[260px] flex-col rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <span className="block px-1 text-sm font-semibold text-gray-900 dark:text-white/90">
          {name}
        </span>
        <span className="mt-0.5 block px-1 text-xs text-gray-600 dark:text-gray-400">
          {role}
        </span>
        {meta ? (
          <span className="mt-1 block px-1 text-xs text-gray-500">{meta}</span>
        ) : null}
        <div className="mt-3 flex flex-col gap-1 border-t border-gray-200 pt-3 dark:border-gray-800">
          {actions?.map((action, index) => (
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              key={index}
            >
              {action}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
