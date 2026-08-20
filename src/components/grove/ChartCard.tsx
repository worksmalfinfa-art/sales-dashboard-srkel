"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import LazyMount from "./LazyMount";

type Series = { name: string; data: number[] };

/**
 * One chart in one card, in the template's idiom. Kind picks the ApexCharts
 * shape; everything else (grid, type, tooltip money format) is shared so all
 * pages draw in the same language.
 */
export default function ChartCard({
  title, subtitle, categories, series, kind = "area", stacked = false,
  height = 290, colors = ["#465FFF", "#9CB9FF"], money = true, tickAmount,
}: {
  title: string; subtitle?: string; categories: string[]; series: Series[];
  kind?: "area" | "bar"; stacked?: boolean; height?: number;
  colors?: string[]; money?: boolean; tickAmount?: number;
}) {
  const options: ApexOptions = {
    colors,
    chart: {
      fontFamily: "Outfit, sans-serif", type: kind, stacked,
      toolbar: { show: false }, zoom: { enabled: false },
      // Phone main threads choke on chart draw animations; taps queue
      // behind them and the UI reads as laggy.
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
      show: series.length > 1, position: "top", horizontalAlign: "right",
      fontFamily: "Outfit, sans-serif",
    },
    stroke: kind === "area"
      ? { curve: "smooth", width: 2 }
      : { show: false },
    fill: kind === "area"
      ? { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0 } }
      : { opacity: 1 },
    plotOptions: kind === "bar"
      ? { bar: { columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" } }
      : {},
    xaxis: {
      type: "category", categories,
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#667085" } },
      tickAmount,
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#667085"] },
        formatter: money
          ? (v: number) =>
              v >= 1_000_000 ? `${Math.round(v / 1_000_000)} Jt` : `${Math.round(v / 1000)} rb`
          : (v: number) => `${Math.round(v)}`,
      },
    },
    tooltip: {
      y: {
        formatter: money
          ? (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}`
          : (v: number) => Math.round(v).toLocaleString("id-ID"),
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">{subtitle}</p>
      ) : null}
      <div className="mt-4 max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[560px] xl:min-w-full">
          <LazyMount height={height}>
            <Chart options={options} series={series} type={kind} height={height} />
          </LazyMount>
        </div>
      </div>
    </div>
  );
}
