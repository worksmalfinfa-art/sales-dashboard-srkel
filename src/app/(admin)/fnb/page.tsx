import type { Metadata } from "next";
import React from "react";
import GroveMetrics from "@/components/grove/GroveMetrics";
import ChartCard from "@/components/grove/ChartCard";
import TenantTable from "@/components/grove/TenantTable";
import { getFnb, fmtRp, idNum } from "@/lib/grove";

export const metadata: Metadata = { title: "Dashboard F&B — GROVE" };
export const revalidate = 300;

export default async function FnbPage() {
  const d = await getFnb();

  if (!d.configured || !d.daily.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Belum ada data F&amp;B
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {d.configured
            ? "Upload file ESB melalui aplikasi pengelolaan."
            : "Isi kredensial Supabase di .env.local lebih dulu."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Dashboard F&amp;B
        </h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Seluruh tenant ESB · {d.daily[0].date} – {d.daily.at(-1)?.date}
        </p>
      </div>

      <div className="col-span-12">
        <GroveMetrics
          items={[
            { label: "Nett Sales", value: fmtRp(d.nett),
              note: `${idNum(d.days)} hari berdagang` },
            { label: "Pax", value: idNum(d.pax),
              note: d.days ? `${idNum(d.pax / d.days)} per hari` : undefined },
            { label: "Rata / Pax", value: fmtRp(d.pax ? d.nett / d.pax : 0),
              note: "nett dibagi jumlah pax" },
            { label: "Diskon", value: fmtRp(d.disc),
              note: d.sub ? `${((d.disc / d.sub) * 100).toFixed(1)}% dari subtotal` : undefined },
          ]}
        />
      </div>

      <div className="col-span-12">
        <ChartCard
          title="Tren penjualan harian"
          subtitle="Nett sales seluruh tenant F&B per hari"
          categories={d.daily.map((x) => x.date.slice(5))}
          series={[{ name: "Nett Sales", data: d.daily.map((x) => x.nett) }]}
          kind="area" tickAmount={12}
        />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <ChartCard
          title="Penjualan per jam"
          subtitle="Akumulasi nett sales menurut jam operasional"
          categories={d.hourly.map((x) => x.hour)}
          series={[{ name: "Nett Sales", data: d.hourly.map((x) => x.nett) }]}
          kind="bar"
        />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <ChartCard
          title="Rata-rata per hari dalam seminggu"
          subtitle="Hanya hari berdagang yang dihitung"
          categories={d.dow.map((x) => x.day)}
          series={[{ name: "Rata-rata", data: d.dow.map((x) => Math.round(x.avg)) }]}
          kind="bar"
        />
      </div>

      <div className="col-span-12">
        <TenantTable
          rows={d.tenants.map((t) => ({
            id: t.id, name: t.name, nett: fmtRp(t.nett),
            visitors: idNum(t.pax), share: t.share,
          }))}
        />
      </div>
    </div>
  );
}
