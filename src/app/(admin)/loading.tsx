import React from "react";

/**
 * Route-group skeleton: shown instantly on navigation while the server
 * fetches, so a click always gets immediate feedback.
 */
export default function Loading() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-2">
        <div className="h-6 w-56 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800/60" />
      </div>
      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-3 h-7 w-32 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
      <div className="col-span-12 h-80 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
      <div className="col-span-12 h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-7" />
      <div className="col-span-12 h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-5" />
    </div>
  );
}
