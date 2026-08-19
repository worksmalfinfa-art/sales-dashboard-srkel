"use client";
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import flatpickr from "flatpickr";
import { Indonesian } from "flatpickr/dist/l10n/id";
import "flatpickr/dist/flatpickr.css";

const field =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium " +
  "text-gray-700 focus:border-brand-300 focus:outline-none " +
  "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Tenant select, quick-range presets, and ONE calendar input covering the
 * whole range (flatpickr range mode) — dates are picked, never typed.
 * Every state is still a shareable URL via query params.
 */
export default function FilterBar({
  path, from, to, min, max, tenant = null, tenants,
}: {
  path: string; from: string; to: string; min: string; max: string;
  tenant?: string | null;
  tenants?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = (nf: string, nt: string, nten: string) => {
    const q = new URLSearchParams({ dari: nf, sampai: nt });
    if (nten) q.set("tenant", nten);
    router.push(`${path}?${q.toString()}`);
  };

  useEffect(() => {
    if (!inputRef.current) return;
    const fp = flatpickr(inputRef.current, {
      mode: "range",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "j M Y",
      altInputClass: `${field} min-w-[215px] cursor-pointer`,
      defaultDate: [from, to],
      minDate: min,
      maxDate: max,
      locale: Indonesian,
      onClose: (dates) => {
        if (dates.length === 2) apply(ymd(dates[0]), ymd(dates[1]), tenant ?? "");
      },
    });
    return () => fp.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, min, max, tenant]);

  const preset = (v: string) => {
    if (!v) return;
    if (v === "all") { apply(min, max, tenant ?? ""); return; }
    const days = parseInt(v, 10);
    const start = new Date(max + "T00:00:00");
    start.setDate(start.getDate() - (days - 1));
    const s = ymd(start);
    apply(s < min ? min : s, max, tenant ?? "");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tenants && tenants.length > 0 ? (
        <select
          aria-label="Tenant"
          className={field}
          value={tenant ?? ""}
          onChange={(e) => apply(from, to, e.target.value)}
        >
          <option value="">Semua tenant</option>
          {tenants.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      ) : null}
      <select
        aria-label="Rentang cepat"
        className={field}
        defaultValue=""
        onChange={(e) => { preset(e.target.value); e.target.value = ""; }}
      >
        <option value="" disabled>Rentang cepat…</option>
        <option value="7">7 hari terakhir</option>
        <option value="30">30 hari terakhir</option>
        <option value="90">90 hari terakhir</option>
        <option value="all">Semua data</option>
      </select>
      <input
        ref={inputRef}
        aria-label="Rentang tanggal"
        readOnly
        className={field}
      />
    </div>
  );
}
