"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import LazyMount from "./LazyMount";

/**
 * Hour-of-day × day-of-week heatmap. Rows arrive Sen..Min; ApexCharts draws
 * the first series at the bottom, so we reverse to keep Senin on top.
 */
export default function HourHeatmap({
  hours, rows,
}: {
  hours: string[];
  rows: { day: string; cells: number[] }[];
}) {
  const series = [...rows].reverse().map((r) => ({
    name: r.day,
    data: r.cells.map((v, i) => ({ x: hours[i], y: v })),
  }));

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif", type: "heatmap",
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: ["#465FFF"],
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#ffffff"] },
    plotOptions: {
      heatmap: {
        radius: 4,
        shadeIntensity: 0.6,
        colorScale: { min: 0 },
      },
    },
    grid: { borderColor: "transparent" },
    legend: { show: false },
    xaxis: {
      type: "category",
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#667085" } },
    },
    yaxis: { labels: { style: { fontSize: "12px", colors: ["#667085"] } } },
    tooltip: {
      y: {
        formatter: (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Peta panas jam × hari
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Rata-rata nett sales per hari berdagang — semakin pekat, semakin ramai
      </p>
      <div className="mt-4 max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[560px] xl:min-w-full">
          <LazyMount height={300}>
            <Chart options={options} series={series} type="heatmap" height={300} />
          </LazyMount>
        </div>
      </div>
    </div>
  );
}
