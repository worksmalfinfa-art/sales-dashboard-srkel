"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * Revenue contribution donut with the grand total in its centre, plus a
 * per-source list underneath — the template's MonthlyTarget card, refilled
 * with GROVE's F&B / Playground split.
 */
export default function ContributionDonut({
  fnb, pg, total, rows,
}: {
  fnb: number; pg: number; total: string;
  rows: { name: string; value: string; share: number }[];
}) {
  const options: ApexOptions = {
    colors: ["#465FFF", "#9CB9FF"],
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels: ["F&B", "Playground"],
    stroke: { width: 3, colors: ["#fff"] },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "78%",
          labels: {
            show: true,
            total: {
              show: true, label: "Total", fontSize: "13px", color: "#667085",
              formatter: () => total,
            },
            value: { fontSize: "18px", fontWeight: 600, color: "#101828" },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}` },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Kontribusi Pendapatan
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Porsi tiap sumber terhadap total
      </p>
      <div className="mt-4">
        <Chart options={options} series={[fnb, pg]} type="donut" height={230} />
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {r.name}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {r.share.toFixed(1)}% dari total
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {r.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
