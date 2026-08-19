import React from "react";

const BAR_HUES = ["#465FFF", "#7A5AF8", "#0BA5EC", "#98A2B3"];

/**
 * Time-segment contribution as labelled progress rows — the template's
 * "traffic sources" widget idiom, not a chart.
 */
export default function SegmentBreakdown({
  rows,
}: {
  rows: { name: string; range: string; nett: string; pax: string; share: number }[];
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Segmen waktu
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Kontribusi nett sales per jam sibuk
      </p>
      <div className="mt-5 flex flex-1 flex-col justify-between gap-5">
        {rows.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {s.name}
                </p>
                <p className="text-xs text-gray-400">{s.range} · {s.pax} pax</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {s.nett}
                </p>
                <p className="text-xs text-gray-400">{s.share.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(2, s.share))}%`,
                  backgroundColor: BAR_HUES[i % BAR_HUES.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
