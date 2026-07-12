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
      <summary className="flex list-none items-center text-gray-700 dark:text-gray-400">
        <span className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full font-medium">
          {initials(name)}
        </span>
        <span className="mr-1 hidden text-sm font-medium sm:block">{name}</span>
        <svg
          className="transition-transform group-open:rotate-180"
          fill="none"
          height="20"
          viewBox="0 0 18 20"
          width="18"
        >
          <path
            d="m4.312 8.656 4.688 4.688 4.688-4.688"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </summary>
      <div className="shadow-theme-lg dark:bg-gray-dark absolute right-0 z-50 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
          {role}
        </span>
        {meta ? (
          <span className="mt-1 block text-xs text-gray-400">{meta}</span>
        ) : null}
        <div className="mt-4 flex flex-col gap-1 border-t border-gray-200 pt-3 dark:border-gray-800">
          {actions?.map((action, index) => (
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
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
