import type { Metadata } from "next";
import React from "react";
import GroveMetrics from "@/components/grove/GroveMetrics";
import ChartCard from "@/components/grove/ChartCard";
import TenantTable from "@/components/grove/TenantTable";
import FilterBar from "@/components/grove/FilterBar";
import HourHeatmap from "@/components/grove/HourHeatmap";
import SegmentBreakdown from "@/components/grove/SegmentBreakdown";
import RecapTable from "@/components/grove/RecapTable";
import DeepDiveTable from "@/components/grove/DeepDiveTable";
import ExportMenu from "@/components/grove/ExportMenu";
import { getFnb, fmtRp, idNum } from "@/lib/grove";

export const metadata: Metadata = { title: "Dashboard F&B — GROVE" };
export const revalidate = 300;

export default async function FnbPage({
  searchParams,
}: { searchParams: Promise<{ dari?: string; sampai?: string; tenant?: string }> }) {
  const { dari, sampai, tenant } = await searchParams;
  const d = await getFnb({ from: dari, to: sampai, tenant });

  if (!d.configured || !d.dataMin) {
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

  const tenantName = d.tenant
    ? d.tenantOptions.find((t) => t.id === d.tenant)?.name ?? d.tenant
    : "Seluruh tenant ESB";

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Dashboard F&amp;B
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {tenantName} · {d.from} – {d.to}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            path="/fnb" from={d.from} to={d.to} min={d.dataMin} max={d.dataMax}
            tenant={d.tenant} tenants={d.tenantOptions}
          />
          <ExportMenu dataset="fnb" />
        </div>
      </div>

      {d.daily.length === 0 ? (
        <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">
            Tidak ada transaksi pada rentang atau tenant yang dipilih.
          </p>
        </div>
      ) : (
        <>
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
              subtitle={`Nett sales per hari · ${tenantName}`}
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

          <div className="col-span-12 xl:col-span-8">
            <HourHeatmap hours={d.heatHours} rows={d.heat} />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <SegmentBreakdown
              rows={d.segments.map((s) => ({
                name: s.name, range: s.range, nett: fmtRp(s.nett),
                pax: idNum(s.pax), share: s.share,
              }))}
            />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <RecapTable
              title="Rekap mingguan"
              subtitle="Mengikuti rentang filter · ± membandingkan rata-rata per hari berdagang minggu sebelumnya"
              headers={["Minggu", "Hari", "Nett", "Rata / hari"]}
              rows={d.weekly.map((w) => ({
                cells: [w.label, idNum(w.days), fmtRp(w.nett), fmtRp(w.avgDay)],
                delta: w.wow,
              }))}
            />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <RecapTable
              title="Ikhtisar bulanan"
              subtitle={`Seluruh riwayat ${d.tenant ? tenantName : "F&B"} (maks 12 bulan) — tidak mengikuti filter tanggal`}
              headers={["Bulan", "Hari", "Nett", "Pax", "Rata / hari"]}
              rows={d.monthly.map((m) => ({
                cells: [m.label, idNum(m.days), fmtRp(m.nett), idNum(m.vol), fmtRp(m.avgDay)],
                delta: m.mom,
                tag: m.partial ? "berjalan" : undefined,
              }))}
            />
          </div>

          <div className="col-span-12">
            <DeepDiveTable
              title="Rincian harian"
              subtitle={`Setiap hari berdagang dalam rentang · ${tenantName}`}
              cols={[
                { key: "date", label: "Tanggal", kind: "text" },
                { key: "dow", label: "Hari", kind: "text" },
                { key: "nett", label: "Nett Sales", kind: "money" },
                { key: "pax", label: "Pax", kind: "num" },
                { key: "avgPax", label: "Rata / Pax", kind: "money" },
              ]}
              rows={d.deep}
            />
          </div>

          {d.tenants.length > 1 ? (
            <div className="col-span-12">
              <TenantTable
                rows={d.tenants.map((t) => ({
                  id: t.id, name: t.name, nett: fmtRp(t.nett),
                  visitors: idNum(t.pax), share: t.share,
                }))}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
