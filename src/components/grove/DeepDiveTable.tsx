"use client";
import React, { useMemo, useState } from "react";

export type DeepCol = {
  key: string; label: string;
  kind?: "money" | "num" | "text";
};

const fmt = (v: number | string, kind: DeepCol["kind"]) => {
  if (typeof v === "string") return v;
  if (kind === "money") return `Rp ${Math.round(v).toLocaleString("id-ID")}`;
  return Math.round(v).toLocaleString("id-ID");
};

/**
 * Sortable daily table, capped in height with a sticky header — the deep
 * dive can span months without swallowing the page.
 */
export default function DeepDiveTable({
  title, subtitle, cols, rows,
}: {
  title: string; subtitle?: string;
  cols: DeepCol[];
  rows: Record<string, number | string>[];
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: cols[0].key, dir: 1,
  });

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      const x = a[key], y = b[key];
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }, [rows, sort]);

  const toggle = (key: string) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 1 ? -1 : 1 }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">{subtitle}</p>
      ) : null}
      <div className="custom-scrollbar mt-4 max-h-[430px] max-w-full overflow-auto">
        <table className="w-full min-w-[560px]">
          <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr className="border-y border-gray-100 dark:border-gray-800">
              {cols.map((c, i) => (
                <th
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  className={`cursor-pointer select-none py-2.5 text-theme-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/80 ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {c.label}
                  <span className="ml-1 inline-block w-3 text-gray-400">
                    {sort.key === c.key ? (sort.dir === 1 ? "↑" : "↓") : ""}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, ri) => (
              <tr
                key={ri}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                {cols.map((c, ci) => (
                  <td
                    key={c.key}
                    className={`py-2.5 text-theme-sm ${
                      ci === 0
                        ? "text-left font-medium text-gray-800 dark:text-white/90"
                        : "text-right text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {fmt(r[c.key], c.kind)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-theme-xs text-gray-400">
        {rows.length} hari · klik judul kolom untuk mengurutkan
      </p>
    </div>
  );
}
