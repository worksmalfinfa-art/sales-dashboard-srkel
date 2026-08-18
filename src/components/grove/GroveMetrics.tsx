import React from "react";

type Metric = { label: string; value: string; note?: string };

/**
 * KPI row in the template's own card idiom (rounded-2xl, hairline border,
 * dark-mode variants). Server component: values arrive already formatted.
 */
export default function GroveMetrics({ items }: { items: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {items.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {m.label}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {m.value}
          </h4>
          {m.note ? (
            <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
              {m.note}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
