import type { Metadata } from "next";
import React from "react";
import GroveMetrics from "@/components/grove/GroveMetrics";
import ChartCard from "@/components/grove/ChartCard";
import { getPlayground, fmtRp, idNum } from "@/lib/grove";

export const metadata: Metadata = { title: "Playground — GROVE" };
export const revalidate = 300;

export default async function PlaygroundPage() {
  const d = await getPlayground();

  if (!d.configured || !d.daily.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Belum ada data Playground
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {d.configured
            ? "Upload CSV Playground melalui aplikasi pengelolaan."
            : "Isi kredensial Supabase di .env.local lebih dulu."}
        </p>
      </div>
    );
  }

  const ratio = d.child ? d.comp / d.child : 0;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Dashboard Playground
        </h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Twist N&apos; Turns · {d.daily[0].date} – {d.daily.at(-1)?.date}
        </p>
      </div>

      <div className="col-span-12">
        <GroveMetrics
          items={[
            { label: "Nett Sales", value: fmtRp(d.nett),
              note: `${idNum(d.days)} hari beroperasi` },
            { label: "Transaksi", value: idNum(d.trx),
              note: d.days ? `${(d.trx / d.days).toFixed(1)} per hari` : undefined },
            { label: "Anak", value: idNum(d.child),
              note: d.trx ? `${(d.child / d.trx).toFixed(2)} per transaksi` : undefined },
            { label: "Rata / Transaksi", value: fmtRp(d.trx ? d.nett / d.trx : 0) },
          ]}
        />
      </div>

      <div className="col-span-12">
        <ChartCard
          title="Tren penjualan harian"
          subtitle="Nett sales Playground per hari"
          categories={d.dailyNett.map((x) => x.date.slice(5))}
          series={[{ name: "Nett Sales", data: d.dailyNett.map((x) => x.nett) }]}
          kind="area" tickAmount={12}
        />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <ChartCard
          title="Anak dan pendamping per hari"
          subtitle={`Rasio pendamping ${ratio.toFixed(2)} per anak · ${idNum(d.solo)} transaksi tanpa pendamping`}
          categories={d.daily.map((x) => x.date.slice(5))}
          series={[
            { name: "Anak", data: d.daily.map((x) => x.child) },
            { name: "Pendamping", data: d.daily.map((x) => x.comp) },
          ]}
          kind="bar" stacked money={false} tickAmount={12}
        />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <ChartCard
          title="Hari kerja vs akhir pekan"
          subtitle="Rata-rata per hari operasi — akhir pekan hanya dua hari dari tujuh, jadi total mentah tidak sebanding"
          categories={["Hari kerja", "Akhir pekan"]}
          series={[{
            name: "Rata-rata / hari",
            data: [Math.round(d.weekdayPerDay), Math.round(d.weekendPerDay)],
          }]}
          kind="bar"
          colors={["#465FFF", "#7A5AF8"]}
        />
      </div>
    </div>
  );
}
