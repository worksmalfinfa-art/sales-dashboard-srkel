import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side data layer for GROVE.
 *
 * Runs only on the server (enforced by the server-only import), so the
 * service_role key never reaches a browser — the same security model the
 * Streamlit app used, carried over unchanged.
 *
 * PostgREST caps every response at 1000 rows regardless of the limit asked
 * for, so full-table reads page explicitly. Skipping that would silently
 * truncate every table at its first page — a failure that looks like missing
 * data rather than an error.
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = Boolean(url && key);

const PAGE = 1000;

async function fetchAll<T>(table: string, orderCol?: string): Promise<T[]> {
  if (!url || !key) return [];
  const sb = createClient(url, key);
  const rows: T[] = [];
  for (let start = 0; ; start += PAGE) {
    let q = sb.from(table).select("*").range(start, start + PAGE - 1);
    if (orderCol) q = q.order(orderCol);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export type SalesRow = {
  tenant_id: string; tenant_name: string; category: string;
  unit_code: string | null; sales_date: string; sales_hour: string;
  pax_total: number; subtotal: number; discount_total: number; nett_sales: number;
};

export type PlaygroundRow = {
  order_id: string; sales_date: string; nett_sales: number;
  child_total: number; companion_total: number;
};

export type MasterData = {
  configured: boolean;
  rangeStart: string; rangeEnd: string;
  grand: number; fnbNett: number; pgNett: number; visitors: number;
  fnbPax: number; pgChild: number; pgComp: number; pgTrx: number;
  daily: { date: string; fnb: number; pg: number }[];
  monthly: { month: string; fnb: number; pg: number }[];
  tenants: { id: string; name: string; nett: number; visitors: number; share: number }[];
};

/** Demo numbers so the page previews before the env is filled in. */
function demo(): MasterData {
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 2, 8 + i);
    return {
      date: d.toISOString().slice(0, 10),
      fnb: 9_000_000 + Math.round(6_000_000 * Math.abs(Math.sin(i / 3.1))),
      pg: 2_000_000 + Math.round(1_600_000 * Math.abs(Math.sin(i / 2.3 + 1))),
    };
  });
  const t = [
    ["T001", "Ruuang Kopi", 142_850_000, 2334], ["T002", "Omonyo", 119_400_000, 1349],
    ["T900", "Twist N' Turns", 78_712_400, 1292], ["T003", "Sliced Pizzeria", 74_220_000, 1040],
    ["T004", "Mr Roastman", 56_180_000, 1149], ["T005", "DOD Cafe", 32_140_000, 778],
  ] as const;
  const grand = t.reduce((s, x) => s + x[2], 0);
  return {
    configured: false,
    rangeStart: daily[0].date, rangeEnd: daily.at(-1)!.date,
    grand, fnbNett: grand - 78_712_400, pgNett: 78_712_400,
    visitors: t.reduce((s, x) => s + x[3], 0),
    fnbPax: 6650, pgChild: 862, pgComp: 430, pgTrx: 340,
    daily,
    monthly: [
      { month: "2026-01", fnb: 401_000_000, pg: 61_000_000 },
      { month: "2026-02", fnb: 421_000_000, pg: 64_500_000 },
      { month: "2026-03", fnb: 424_790_000, pg: 78_712_400 },
    ],
    tenants: t.map(([id, name, nett, visitors]) => ({
      id, name, nett, visitors, share: (nett / grand) * 100,
    })),
  };
}

export async function getMasterData(): Promise<MasterData> {
  if (!isConfigured) return demo();

  const [sales, pg] = await Promise.all([
    fetchAll<SalesRow>("v_sales_enriched", "sales_date"),
    fetchAll<PlaygroundRow>("playground_sales", "sales_date"),
  ]);

  const day = (s: string) => s.slice(0, 10);
  const month = (s: string) => s.slice(0, 7);

  const fnbNett = sales.reduce((s, r) => s + (r.nett_sales || 0), 0);
  const pgNett = pg.reduce((s, r) => s + (r.nett_sales || 0), 0);
  const fnbPax = sales.reduce((s, r) => s + (r.pax_total || 0), 0);
  const pgChild = pg.reduce((s, r) => s + (r.child_total || 0), 0);
  const pgComp = pg.reduce((s, r) => s + (r.companion_total || 0), 0);

  const dailyMap = new Map<string, { fnb: number; pg: number }>();
  const monthlyMap = new Map<string, { fnb: number; pg: number }>();
  const add = (m: Map<string, { fnb: number; pg: number }>, k: string,
               f: number, p: number) => {
    const cur = m.get(k) ?? { fnb: 0, pg: 0 };
    cur.fnb += f; cur.pg += p; m.set(k, cur);
  };
  for (const r of sales) {
    add(dailyMap, day(r.sales_date), r.nett_sales || 0, 0);
    add(monthlyMap, month(r.sales_date), r.nett_sales || 0, 0);
  }
  for (const r of pg) {
    add(dailyMap, day(r.sales_date), 0, r.nett_sales || 0);
    add(monthlyMap, month(r.sales_date), 0, r.nett_sales || 0);
  }
  const daily = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
  const monthly = [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({ month: m, ...v }));

  const byTenant = new Map<string, { name: string; nett: number; visitors: number }>();
  for (const r of sales) {
    const cur = byTenant.get(r.tenant_id) ?? { name: r.tenant_name, nett: 0, visitors: 0 };
    cur.nett += r.nett_sales || 0; cur.visitors += r.pax_total || 0;
    byTenant.set(r.tenant_id, cur);
  }
  if (pg.length) {
    byTenant.set("T900", {
      name: "Twist N' Turns", nett: pgNett, visitors: pgChild + pgComp,
    });
  }
  const grand = fnbNett + pgNett;
  const tenants = [...byTenant.entries()]
    .map(([id, t]) => ({ id, ...t, share: grand ? (t.nett / grand) * 100 : 0 }))
    .sort((a, b) => b.nett - a.nett);

  return {
    configured: true,
    rangeStart: daily[0]?.date ?? "", rangeEnd: daily.at(-1)?.date ?? "",
    grand, fnbNett, pgNett,
    visitors: fnbPax + pgChild + pgComp,
    fnbPax, pgChild, pgComp, pgTrx: pg.length,
    daily, monthly, tenants,
  };
}

export function fmtRp(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
  return `Rp ${Math.round(v).toLocaleString("id-ID")}`;
}

export function idNum(v: number): string {
  return Math.round(v).toLocaleString("id-ID");
}
