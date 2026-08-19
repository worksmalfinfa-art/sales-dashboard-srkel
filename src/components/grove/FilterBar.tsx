"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const field =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium " +
  "text-gray-700 focus:border-brand-300 focus:outline-none " +
  "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300";

/**
 * Date range plus optional tenant filter, driving the server page through
 * query params so every state is a shareable URL.
 */
export default function FilterBar({
  path, from, to, min, max, tenant = null, tenants,
}: {
  path: string; from: string; to: string; min: string; max: string;
  tenant?: string | null;
  tenants?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [ten, setTen] = useState(tenant ?? "");

  const apply = (nf: string, nt: string, nten: string) => {
    const q = new URLSearchParams({ dari: nf, sampai: nt });
    if (nten) q.set("tenant", nten);
    router.push(`${path}?${q.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tenants && tenants.length > 0 ? (
        <select
          aria-label="Tenant"
          className={field}
          value={ten}
          onChange={(e) => { setTen(e.target.value); apply(f, t, e.target.value); }}
        >
          <option value="">Semua tenant</option>
          {tenants.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      ) : null}
      <input
        aria-label="Dari tanggal"
        type="date" className={field}
        value={f} min={min} max={max}
        onChange={(e) => { setF(e.target.value); if (e.target.value) apply(e.target.value, t, ten); }}
      />
      <span className="text-sm text-gray-400">–</span>
      <input
        aria-label="Sampai tanggal"
        type="date" className={field}
        value={t} min={min} max={max}
        onChange={(e) => { setT(e.target.value); if (e.target.value) apply(f, e.target.value, ten); }}
      />
    </div>
  );
}
