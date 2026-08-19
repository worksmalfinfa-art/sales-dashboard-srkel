import type { Metadata } from "next";
import React from "react";
import Badge from "@/components/ui/badge/Badge";
import GroveMetrics from "@/components/grove/GroveMetrics";
import MonthPicker from "@/components/grove/MonthPicker";
import TargetCard from "@/components/grove/TargetCard";
import UnitTable from "@/components/grove/UnitTable";
import { getPerformance, fmtRp, idNum } from "@/lib/grove";

export const metadata: Metadata = { title: "Performa Tenant — GROVE" };
export const revalidate = 300;

const HUES = ["#465FFF", "#7A5AF8", "#0BA5EC", "#12B76A", "#F79009",
              "#EE46BC", "#6172F3", "#F04438", "#36BFFA", "#9E77ED"];
const hue = (id: string) => {
  const d = id.replace(/\D/g, "");
  const k = d ? parseInt(d, 10) : [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return HUES[k % HUES.length];
};

function momBadge(mom: number | null) {
  if (mom === null) return <Badge color="light">baru</Badge>;
  const color = mom >= 0 ? "success" : mom <= -10 ? "error" : "warning";
  return <Badge color={color}>{`${mom >= 0 ? "+" : ""}${mom.toFixed(1)}%`}</Badge>;
}

export default async function PerformaPage({
  searchParams,
}: { searchParams: Promise<{ bulan?: string }> }) {
  const { bulan } = await searchParams;
  const d = await getPerformance(bulan);

  if (!d.configured || !d.tenants.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Belum ada data
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {d.configured
            ? "Belum ada transaksi yang bisa dianalisis."
            : "Isi kredensial Supabase di .env.local lebih dulu."}
        </p>
      </div>
    );
  }

  const basis = !d.prev
    ? "tidak ada periode pembanding"
    : d.cutoff
      ? `vs ${d.prev}, dibatasi tanggal 1–${d.cutoff} di kedua sisi`
      : `vs ${d.prev}, bulan penuh`;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Performa Tenant
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {d.month} · {basis}
          </p>
        </div>
        <MonthPicker months={d.months} value={d.month} />
      </div>

      <div className="col-span-12">
        <GroveMetrics
          items={[
            { label: "Nett Sales", value: fmtRp(d.totalNett),
              note: d.momTotal !== null
                ? `${d.momTotal >= 0 ? "+" : ""}${d.momTotal.toFixed(1)}% dari periode sebelumnya`
                : undefined },
            { label: "Pengunjung", value: idNum(d.totalVisitors) },
            { label: "Rata / Pengunjung", value: fmtRp(d.avgCheck) },
            { label: "Perlu Perhatian", value: String(d.falling.length),
              note: "tenant turun lebih dari 10%" },
          ]}
        />
      </div>

      {d.falling.length > 0 && (
        <div className="col-span-12 rounded-2xl border border-error-500/30 bg-error-50 p-5 dark:bg-error-500/10">
          <h3 className="font-semibold text-error-600 dark:text-error-400">
            Perlu perhatian
          </h3>
          <div className="mt-2 space-y-1">
            {d.falling.map((t) => (
              <p key={t.id} className="text-sm text-gray-700 dark:text-gray-300">
                <b>{t.name}</b> turun {Math.abs(t.mom ?? 0).toFixed(1)}% — {fmtRp(t.nett)}{" "}
                pada periode ini ({basis}).
              </p>
            ))}
          </div>
        </div>
      )}

      {d.target || d.occupancy ? (
        <>
          {d.target ? (
            <div className={`col-span-12 ${d.occupancy ? "xl:col-span-5" : ""}`}>
              <TargetCard
                pct={d.target.pct} month={d.month}
                totalLabel={fmtRp(d.target.total)}
                actualLabel={fmtRp(d.target.actual)}
                perTenant={d.target.perTenant.map((t) => ({
                  name: t.name, target: fmtRp(t.target),
                  actual: fmtRp(t.actual), pct: t.pct,
                }))}
              />
            </div>
          ) : null}
          {d.occupancy ? (
            <div className={`col-span-12 ${d.target ? "xl:col-span-7" : ""}`}>
              <UnitTable
                occupied={d.occupancy.occupied} total={d.occupancy.total}
                rows={d.occupancy.units.map((u) => ({
                  unit: u.unit, floor: u.floor, tenant: u.tenant,
                  period: u.period, nett: fmtRp(u.nett),
                }))}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {!d.target ? (
        <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada target untuk {d.month} — atur target bulanan per tenant
            melalui aplikasi pengelolaan agar kartu pencapaian tampil di sini.
          </p>
        </div>
      ) : null}

      <div className="col-span-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Peringkat tenant
          </h3>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-100 dark:border-gray-800">
                  {["Tenant", "Nett Sales", "MoM", "Rata / Pengunjung", "Pengunjung", "Kontribusi"]
                    .map((h, i) => (
                    <th key={h}
                        className={`py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${i ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {d.tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: hue(t.id) }} />
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {t.name}
                          </span>
                          {t.unit ? (
                            <span className="text-theme-xs text-gray-400">{t.unit}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90 tabular-nums">
                      {fmtRp(t.nett)}
                    </td>
                    <td className="py-3 text-right">{momBadge(t.mom)}</td>
                    <td className="py-3 text-right text-theme-sm text-gray-500 tabular-nums">
                      {fmtRp(t.avgCheck)}
                    </td>
                    <td className="py-3 text-right text-theme-sm text-gray-500 tabular-nums">
                      {idNum(t.visitors)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="ml-auto flex w-28 items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-1.5 rounded-full"
                               style={{ width: `${Math.min(t.share, 100)}%`,
                                        backgroundColor: hue(t.id) }} />
                        </div>
                        <span className="text-theme-xs text-gray-500 tabular-nums">
                          {t.share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
