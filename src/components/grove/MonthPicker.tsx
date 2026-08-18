"use client";
import React from "react";
import { useRouter } from "next/navigation";

/** Month dropdown that reloads the server page with ?bulan=YYYY-MM. */
export default function MonthPicker({
  months, value,
}: { months: string[]; value: string }) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(`/performa?bulan=${e.target.value}`)}
      className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:border-brand-300 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
    >
      {[...months].reverse().map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}
