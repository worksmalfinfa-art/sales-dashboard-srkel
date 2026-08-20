"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import LazyMount from "./LazyMount";

/**
 * Month target attainment: one radial gauge for the property total, then a
 * progress row per tenant that has a target set.
 */
export default function TargetCard({
  pct, totalLabel, actualLabel, month,
  perTenant,
}: {
  pct: number; totalLabel: string; actualLabel: string; month: string;
  perTenant: { name: string; target: string; actual: string; pct: number }[];
}) {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif", type: "radialBar",
      sparkline: { enabled: true },
      animations: { enabled: false },
      // Safari iOS memicu window-resize setiap address bar menyusut saat
      // scroll; tanpa ini semua chart digambar ulang di tiap scroll.
      redrawOnWindowResize: false, redrawOnParentResize: true,
    },
    colors: ["#465FFF"],
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        hollow: { size: "70%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "30px", fontWeight: 600, offsetY: -32,
            color: "#101828",
            formatter: (v: number) => `${v.toFixed(1)}%`,
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Pencapaian target
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Realisasi {month}: {actualLabel} dari target {totalLabel}
      </p>
      <div className="mx-auto -mb-10 mt-2 w-full max-w-[300px]">
        <LazyMount height={240}>
          <Chart
            options={options}
            series={[Math.min(100, Math.round(pct * 10) / 10)]}
            type="radialBar"
            height={240}
          />
        </LazyMount>
      </div>
      <div className="mt-4 space-y-4">
        {perTenant.map((t) => (
          <div key={t.name}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {t.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.actual} / {t.target} · {t.pct.toFixed(0)}%
              </p>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(2, t.pct))}%`,
                  backgroundColor: t.pct >= 100 ? "#12B76A"
                    : t.pct >= 70 ? "#465FFF" : "#F79009",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
