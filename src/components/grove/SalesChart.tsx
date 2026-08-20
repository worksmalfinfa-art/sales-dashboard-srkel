"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import LazyMount from "./LazyMount";

type Daily = { date: string; fnb: number; pg: number };
type Monthly = { month: string; fnb: number; pg: number };

/**
 * The hero statistics chart: gradient area for the daily view, grouped bars
 * for the monthly one, switched by the same pill control the template uses.
 */
export default function SalesChart({
  daily, monthly,
}: { daily: Daily[]; monthly: Monthly[] }) {
  const [mode, setMode] = useState<"daily" | "monthly">("daily");

  const base: ApexOptions = {
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      // Safari iOS memicu window-resize setiap address bar menyusut saat
      // scroll; tanpa ini semua chart digambar ulang di tiap scroll.
      redrawOnWindowResize: false, redrawOnParentResize: true,
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#F2F4F7",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: true, position: "top", horizontalAlign: "right",
      fontFamily: "Outfit, sans-serif",
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#667085"] },
        formatter: (v: number) =>
          v >= 1_000_000 ? `${Math.round(v / 1_000_000)} Jt` : `${Math.round(v / 1000)} rb`,
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}` },
    },
  };

  const options: ApexOptions =
    mode === "daily"
      ? {
          ...base,
          chart: { ...base.chart, type: "area", height: 310 },
          stroke: { curve: "smooth", width: [2, 2] },
          fill: {
            type: "gradient",
            gradient: { opacityFrom: 0.35, opacityTo: 0 },
          },
          xaxis: {
            type: "category",
            categories: daily.map((d) => d.date.slice(5)),
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { fontSize: "11px", colors: "#667085" } },
            tickAmount: 10,
          },
        }
      : {
          ...base,
          chart: { ...base.chart, type: "bar", height: 310 },
          plotOptions: {
            bar: { columnWidth: "45%", borderRadius: 5, borderRadiusApplication: "end" },
          },
          stroke: { show: false },
          xaxis: {
            type: "category",
            categories: monthly.map((m) => m.month),
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { fontSize: "11px", colors: "#667085" } },
          },
        };

  const series =
    mode === "daily"
      ? [
          { name: "F&B", data: daily.map((d) => d.fnb) },
          { name: "Playground", data: daily.map((d) => d.pg) },
        ]
      : [
          { name: "F&B", data: monthly.map((m) => m.fnb) },
          { name: "Playground", data: monthly.map((m) => m.pg) },
        ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistik Penjualan
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Nett sales F&amp;B dan Playground
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {(["daily", "monthly"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${
                  mode === m
                    ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {m === "daily" ? "Harian" : "Bulanan"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[650px] xl:min-w-full">
          <LazyMount height={310}>
            <Chart options={options} series={series} type={mode === "daily" ? "area" : "bar"} height={310} />
          </LazyMount>
        </div>
      </div>
    </div>
  );
}
