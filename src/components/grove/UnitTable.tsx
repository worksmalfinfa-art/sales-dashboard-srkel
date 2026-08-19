import React from "react";
import Badge from "@/components/ui/badge/Badge";

/**
 * Unit occupancy for the selected month: which unit houses which tenant,
 * the lease period, and the unit's attributed nett for that month.
 */
export default function UnitTable({
  occupied, total, rows,
}: {
  occupied: number; total: number;
  rows: {
    unit: string; floor: string | null; tenant: string | null;
    period: string | null; nett: string;
  }[];
}) {
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-5 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Okupansi unit
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {occupied} dari {total} unit terisi pada bulan terpilih
          </p>
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-2 rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="custom-scrollbar mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-y border-gray-100 dark:border-gray-800">
              <th className="py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Unit</th>
              <th className="py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tenant</th>
              <th className="py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Periode sewa</th>
              <th className="py-2.5 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">Nett bulan ini</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.unit} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {r.unit}
                  {r.floor ? (
                    <span className="ml-1 text-theme-xs font-normal text-gray-400">
                      · {r.floor}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {r.tenant ?? <Badge color="light">Kosong</Badge>}
                </td>
                <td className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {r.period ?? "—"}
                </td>
                <td className="py-3 text-right text-theme-sm text-gray-500 dark:text-gray-400">
                  {r.nett}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
