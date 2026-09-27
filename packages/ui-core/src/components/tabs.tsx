"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useId, useRef, useState } from "react";

export type TabItem<TValue extends string = string> = Readonly<{
  content: ReactNode;
  label: ReactNode;
  value: TValue;
}>;

export function Tabs<TValue extends string>({
  ariaLabel,
  className = "",
  defaultValue,
  items,
  panelClassName = "",
}: Readonly<{
  ariaLabel: string;
  className?: string;
  defaultValue: TValue;
  items: readonly TabItem<TValue>[];
  panelClassName?: string;
}>) {
  const [activeValue, setActiveValue] = useState<TValue>(defaultValue);
  const tabsId = useId();
  const tabRefs = useRef(new Map<TValue, HTMLButtonElement | null>());
  const activeIndex = items.findIndex((item) => item.value === activeValue);
  const activeItem = items[activeIndex];

  function selectTab(value: TValue) {
    setActiveValue(value);
    tabRefs.current.get(value)?.focus();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    const nextIndex = getNextTabIndex(currentIndex, event.key, items.length);
    if (nextIndex === undefined) return;
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    event.preventDefault();
    selectTab(nextItem.value);
  }

  if (!activeItem) return null;

  return (
    <div className={className}>
      <div
        aria-label={ariaLabel}
        className="border-b border-gray-200 dark:border-gray-800"
        role="tablist"
      >
        <div className="flex gap-6">
          {items.map((item, index) => {
            const selected = activeValue === item.value;
            return (
              <button
                aria-controls={`${tabsId}-panel-${index}`}
                aria-selected={selected}
                className={`relative border-b-2 px-1 pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  selected
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200"
                }`}
                id={`${tabsId}-tab-${index}`}
                key={item.value}
                onClick={() => selectTab(item.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(element) => {
                  tabRefs.current.set(item.value, element);
                }}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        aria-labelledby={`${tabsId}-tab-${activeIndex}`}
        className={["mt-6", panelClassName].join(" ")}
        id={`${tabsId}-panel-${activeIndex}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeItem.content}
      </div>
    </div>
  );
}

function getNextTabIndex(
  currentIndex: number,
  key: string,
  itemCount: number,
): number | undefined {
  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;
  if (key === "ArrowRight") return (currentIndex + 1) % itemCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + itemCount) % itemCount;
  return undefined;
}
