import type { Metadata } from "next";
import React from "react";
import GroveMetrics from "@/components/grove/GroveMetrics";
import SalesChart from "@/components/grove/SalesChart";
import ContributionDonut from "@/components/grove/ContributionDonut";
import TenantTable from "@/components/grove/TenantTable";
import { getMasterData, fmtRp, idNum } from "@/lib/grove";

export const metadata: Metadata = {
  title: "GROVE Sales Analytics",
  description: "Master dashboard — GROVE at CIBIS",
};

// Data changes only when a new file is uploaded, so a 5-minute cache spares
// Supabase a full-table read on every page view.
export const revalidate = 300;

export default async function MasterDashboard() {
  const d = await getMasterData();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {!d.configured && (
        <div className="col-span-12 rounded-2xl border border-warning-500/40 bg-warning-50 p-4 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
          <b>Mode demo.</b> Isi <code>SUPABASE_URL</code> dan{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> di <code>.env.local</code>{" "}
          (lihat <code>.env.local.example</code>), lalu restart — halaman ini
          akan beralih ke data asli.
        </div>
      )}

      <div className="col-span-12">
        <GroveMetrics
          items={[
            { label: "Total Nett Sales", value: fmtRp(d.grand),
              note: `${d.rangeStart} – ${d.rangeEnd}` },
            { label: "F&B", value: fmtRp(d.fnbNett),
              note: d.grand ? `${((d.fnbNett / d.grand) * 100).toFixed(1)}% dari total` : undefined },
            { label: "Playground", value: fmtRp(d.pgNett),
              note: d.grand ? `${((d.pgNett / d.grand) * 100).toFixed(1)}% dari total` : undefined },
            { label: "Pengunjung", value: idNum(d.visitors),
              note: `${idNum(d.fnbPax)} pax · ${idNum(d.pgChild + d.pgComp)} playground` },
          ]}
        />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <SalesChart daily={d.daily} monthly={d.monthly} />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <ContributionDonut
          fnb={d.fnbNett}
          pg={d.pgNett}
          total={fmtRp(d.grand)}
          rows={[
            { name: "F&B", value: fmtRp(d.fnbNett),
              share: d.grand ? (d.fnbNett / d.grand) * 100 : 0 },
            { name: "Playground", value: fmtRp(d.pgNett),
              share: d.grand ? (d.pgNett / d.grand) * 100 : 0 },
          ]}
        />
      </div>

      <div className="col-span-12">
        <TenantTable
          rows={d.tenants.map((t) => ({
            id: t.id, name: t.name,
            nett: fmtRp(t.nett), visitors: idNum(t.visitors), share: t.share,
          }))}
        />
      </div>
    </div>
  );
}
