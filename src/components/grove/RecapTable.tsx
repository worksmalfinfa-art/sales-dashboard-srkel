import React from "react";
import Badge from "@/components/ui/badge/Badge";

function delta(value: number | null) {
  if (value === null) return <Badge color="light">baru</Badge>;
  const color = value >= 0 ? "success" : value <= -10 ? "error" : "warning";
  return <Badge color={color}>{`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`}</Badge>;
}

/**
 * Weekly / monthly recap card: period rows with a trailing delta badge.
 * Deltas are computed on avg-per-trading-day upstream, so clipped edge
 * periods still compare fairly.
 */
export default function RecapTable({
  title, subtitle, headers, rows,
}: {
  title: string; subtitle?: string;
  headers: string[];
  rows: { cells: string[]; delta: number | null; tag?: string }[];
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-5 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">{subtitle}</p>
      ) : null}
      <div className="mt-4 max-w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-y border-gray-100 dark:border-gray-800">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`py-2.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
              <th className="py-2.5 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                ±
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={ri}
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                {r.cells.map((c, ci) => (
                  <td
                    key={ci}
                    className={`py-3 text-theme-sm ${
                      ci === 0
                        ? "text-left font-medium text-gray-800 dark:text-white/90"
                        : "text-right text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {c}
                    {ci === 0 && r.tag ? (
                      <span className="ml-2 align-middle">
                        <Badge color="light">{r.tag}</Badge>
                      </span>
                    ) : null}
                  </td>
                ))}
                <td className="py-3 text-right">{delta(r.delta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
