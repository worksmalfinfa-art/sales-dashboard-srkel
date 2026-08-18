import React from "react";

const HUES = ["#465FFF", "#7A5AF8", "#0BA5EC", "#12B76A", "#F79009",
              "#EE46BC", "#6172F3", "#F04438", "#36BFFA", "#9E77ED"];

function hue(id: string): string {
  const digits = id.replace(/\D/g, "");
  const key = digits ? parseInt(digits, 10)
    : [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return HUES[key % HUES.length];
}

function initials(name: string): string {
  const p = name.replace(/'/g, " ").split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
}

type Row = { id: string; name: string; nett: string; visitors: string; share: number };

/**
 * Tenant leaderboard in the template's RecentOrders idiom. Colour is keyed on
 * tenant_id — colour means WHO, and a rename keeps the hue.
 */
export default function TenantTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Peringkat Tenant
        </h3>
        <span className="text-theme-sm text-gray-500 dark:text-gray-400">
          Diurutkan menurut nett sales
        </span>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-y border-gray-100 dark:border-gray-800">
              <th className="py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tenant</th>
              <th className="py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">Nett Sales</th>
              <th className="py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">Pengunjung</th>
              <th className="py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">Kontribusi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: hue(r.id) }}
                    >
                      {initials(r.name)}
                    </span>
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {r.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90 tabular-nums">
                  {r.nett}
                </td>
                <td className="py-3 text-right text-theme-sm text-gray-500 dark:text-gray-400 tabular-nums">
                  {r.visitors}
                </td>
                <td className="py-3 text-right">
                  <div className="ml-auto flex w-32 items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.min(r.share, 100)}%`, backgroundColor: hue(r.id) }}
                      />
                    </div>
                    <span className="text-theme-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {r.share.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
