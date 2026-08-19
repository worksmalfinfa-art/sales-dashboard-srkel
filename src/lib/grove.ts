import "server-only";
import { cache } from "react";
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

// ---------------------------------------------------------------------------
// Per-page datasets. React cache() keeps one request from pulling the same
// table three times when several sections need it.
// ---------------------------------------------------------------------------

const getSales = cache(() => fetchAll<SalesRow>("v_sales_enriched", "sales_date"));
const getPg = cache(() => fetchAll<PlaygroundRow>("playground_sales", "sales_date"));

export type PerfTenant = {
  id: string; name: string; nett: number; visitors: number;
  avgCheck: number; mom: number | null; share: number; unit: string | null;
};

export type PerfData = {
  configured: boolean;
  months: string[]; month: string; prev: string | null; cutoff: number | null;
  totalNett: number; totalVisitors: number; avgCheck: number;
  momTotal: number | null;
  tenants: PerfTenant[]; falling: PerfTenant[];
};

/**
 * Tenant performance for one month, compared against the month before.
 *
 * A month still in progress is never measured against a complete one: the
 * comparison is clipped to the same run of days on both sides. Six days of a
 * new month against thirty-one of the old reads as a collapse that never
 * happened, and a page that cries wolf is one people stop opening.
 */
export async function getPerformance(reqMonth?: string): Promise<PerfData> {
  const empty: PerfData = {
    configured: isConfigured, months: [], month: "", prev: null, cutoff: null,
    totalNett: 0, totalVisitors: 0, avgCheck: 0, momTotal: null,
    tenants: [], falling: [],
  };
  if (!isConfigured) return empty;

  const [sales, pg] = await Promise.all([getSales(), getPg()]);
  type U = { id: string; name: string; date: string; nett: number; vis: number; unit: string | null };
  const rows: U[] = [
    ...sales.map((r) => ({
      id: r.tenant_id, name: r.tenant_name, date: r.sales_date.slice(0, 10),
      nett: r.nett_sales || 0, vis: r.pax_total || 0, unit: r.unit_code,
    })),
    ...pg.map((r) => ({
      id: "T900", name: "Twist N' Turns", date: r.sales_date.slice(0, 10),
      nett: r.nett_sales || 0, vis: (r.child_total || 0) + (r.companion_total || 0),
      unit: null as string | null,
    })),
  ];
  if (!rows.length) return empty;

  const months = [...new Set(rows.map((r) => r.date.slice(0, 7)))].sort();
  const month = reqMonth && months.includes(reqMonth) ? reqMonth : months[months.length - 1];
  const mi = months.indexOf(month);
  const prev = mi > 0 ? months[mi - 1] : null;

  const inMonth = rows.filter((r) => r.date.slice(0, 7) === month);
  const lastDay = Math.max(...inMonth.map((r) => parseInt(r.date.slice(8, 10), 10)));
  const daysInMonth = new Date(
    parseInt(month.slice(0, 4), 10), parseInt(month.slice(5, 7), 10), 0).getDate();
  const cutoff = lastDay < daysInMonth ? lastDay : null;
  const inPrev = prev
    ? rows.filter((r) => r.date.slice(0, 7) === prev &&
        (cutoff === null || parseInt(r.date.slice(8, 10), 10) <= cutoff))
    : [];

  const agg = (list: U[]) => {
    const m = new Map<string, { name: string; nett: number; vis: number; unit: string | null }>();
    for (const r of list) {
      const cur = m.get(r.id) ?? { name: r.name, nett: 0, vis: 0, unit: r.unit };
      cur.nett += r.nett; cur.vis += r.vis;
      if (r.unit) cur.unit = r.unit;
      m.set(r.id, cur);
    }
    return m;
  };
  const cur = agg(inMonth), before = agg(inPrev);
  const totalNett = [...cur.values()].reduce((s, t) => s + t.nett, 0);
  const totalPrev = [...before.values()].reduce((s, t) => s + t.nett, 0);
  const totalVisitors = [...cur.values()].reduce((s, t) => s + t.vis, 0);

  const tenants: PerfTenant[] = [...cur.entries()].map(([id, t]) => {
    const p = before.get(id);
    return {
      id, name: t.name, nett: t.nett, visitors: t.vis,
      avgCheck: t.vis ? Math.round(t.nett / t.vis) : 0,
      mom: p && p.nett ? ((t.nett - p.nett) / p.nett) * 100 : null,
      share: totalNett ? (t.nett / totalNett) * 100 : 0,
      unit: t.unit,
    };
  }).sort((a, b) => b.nett - a.nett);

  return {
    configured: true, months, month, prev, cutoff,
    totalNett, totalVisitors,
    avgCheck: totalVisitors ? Math.round(totalNett / totalVisitors) : 0,
    momTotal: totalPrev ? ((totalNett - totalPrev) / totalPrev) * 100 : null,
    tenants,
    falling: tenants.filter((t) => t.mom !== null && (t.mom as number) < -10)
      .sort((a, b) => (a.mom ?? 0) - (b.mom ?? 0)),
  };
}

export type RangeOpts = { from?: string; to?: string; tenant?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve the active window from query params against the data's own span.
 *
 * Defaults to the last 30 days OF THE DATA, not of the calendar — the
 * Streamlit version once defaulted to "last 30 days of today" and opened
 * empty whenever the newest upload was older than a month, which reads as a
 * broken page rather than a filter. Bad params are ignored, an inverted
 * range is swapped rather than erroring.
 */
function resolveRange(dates: string[], opts: RangeOpts) {
  const min = dates[0], max = dates[dates.length - 1];
  let from = opts.from && DATE_RE.test(opts.from) ? opts.from : "";
  let to = opts.to && DATE_RE.test(opts.to) ? opts.to : "";
  if (!to) to = max;
  if (!from) {
    const d = new Date(to + "T00:00:00");
    d.setDate(d.getDate() - 29);
    const candidate = d.toISOString().slice(0, 10);
    from = candidate < min ? min : candidate;
  }
  if (from > to) [from, to] = [to, from];
  return { min, max, from, to };
}

export type FnbData = {
  configured: boolean;
  dataMin: string; dataMax: string; from: string; to: string;
  tenant: string | null;
  tenantOptions: { id: string; name: string }[];
  nett: number; pax: number; days: number; disc: number; sub: number;
  daily: { date: string; nett: number }[];
  hourly: { hour: string; nett: number }[];
  dow: { day: string; avg: number }[];
  tenants: { id: string; name: string; nett: number; pax: number; share: number }[];
};

export async function getFnb(opts: RangeOpts = {}): Promise<FnbData> {
  const emptyOut: FnbData = {
    configured: isConfigured, dataMin: "", dataMax: "", from: "", to: "",
    tenant: null, tenantOptions: [],
    nett: 0, pax: 0, days: 0, disc: 0, sub: 0,
    daily: [], hourly: [], dow: [], tenants: [],
  };
  if (!isConfigured) return emptyOut;
  const all = await getSales();
  if (!all.length) return emptyOut;

  const allDates = all.map((r) => r.sales_date.slice(0, 10)).sort();
  const { min, max, from, to } = resolveRange(allDates, opts);

  // The dropdown always lists every tenant, from the unfiltered set --
  // otherwise picking one tenant would make the others vanish from the list.
  const optMap = new Map<string, string>();
  for (const r of all) if (!optMap.has(r.tenant_id)) optMap.set(r.tenant_id, r.tenant_name);
  const tenantOptions = [...optMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const tenant = opts.tenant && optMap.has(opts.tenant) ? opts.tenant : null;

  const sales = all.filter((r) => {
    const d = r.sales_date.slice(0, 10);
    return d >= from && d <= to && (!tenant || r.tenant_id === tenant);
  });
  if (!sales.length) {
    return { ...emptyOut, configured: true, dataMin: min, dataMax: max,
             from, to, tenant, tenantOptions };
  }

  const nett = sales.reduce((s, r) => s + (r.nett_sales || 0), 0);
  const pax = sales.reduce((s, r) => s + (r.pax_total || 0), 0);

  const byDay = new Map<string, number>();
  const byHour = new Map<number, number>();
  // Average per weekday over trading days only; counting closed days would
  // drag the average toward zero.
  const dowSum = new Map<number, { total: number; days: Set<string> }>();
  for (const r of sales) {
    const d = r.sales_date.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + (r.nett_sales || 0));
    const h = parseInt(String(r.sales_hour).slice(0, 2), 10);
    if (!Number.isNaN(h)) byHour.set(h, (byHour.get(h) ?? 0) + (r.nett_sales || 0));
    const dow = new Date(d + "T00:00:00").getDay();
    const cur = dowSum.get(dow) ?? { total: 0, days: new Set<string>() };
    cur.total += r.nett_sales || 0; cur.days.add(d); dowSum.set(dow, cur);
  }
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const byTenant = new Map<string, { name: string; nett: number; pax: number }>();
  for (const r of sales) {
    const cur = byTenant.get(r.tenant_id) ?? { name: r.tenant_name, nett: 0, pax: 0 };
    cur.nett += r.nett_sales || 0; cur.pax += r.pax_total || 0;
    byTenant.set(r.tenant_id, cur);
  }

  return {
    configured: true, dataMin: min, dataMax: max, from, to, tenant, tenantOptions,
    nett, pax, days: byDay.size,
    disc: sales.reduce((s, r) => s + (r.discount_total || 0), 0),
    sub: sales.reduce((s, r) => s + (r.subtotal || 0), 0),
    daily: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, nett: v })),
    hourly: [...byHour.entries()].sort(([a], [b]) => a - b)
      .map(([h, v]) => ({ hour: String(h).padStart(2, "0") + ":00", nett: v })),
    dow: [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const x = dowSum.get(d);
      return { day: dayNames[d], avg: x && x.days.size ? x.total / x.days.size : 0 };
    }),
    tenants: [...byTenant.entries()]
      .map(([id, t]) => ({ id, ...t, share: nett ? (t.nett / nett) * 100 : 0 }))
      .sort((a, b) => b.nett - a.nett),
  };
}

export type PgData = {
  configured: boolean;
  dataMin: string; dataMax: string; from: string; to: string;
  nett: number; trx: number; child: number; comp: number; days: number;
  daily: { date: string; child: number; comp: number }[];
  dailyNett: { date: string; nett: number }[];
  weekendPerDay: number; weekdayPerDay: number;
  solo: number;
};

export async function getPlayground(opts: RangeOpts = {}): Promise<PgData> {
  const emptyOut: PgData = {
    configured: isConfigured, dataMin: "", dataMax: "", from: "", to: "",
    nett: 0, trx: 0, child: 0, comp: 0, days: 0,
    daily: [], dailyNett: [], weekendPerDay: 0, weekdayPerDay: 0, solo: 0,
  };
  if (!isConfigured) return emptyOut;
  const all = await getPg();
  if (!all.length) return emptyOut;

  const allDates = all.map((r) => r.sales_date.slice(0, 10)).sort();
  const { min, max, from, to } = resolveRange(allDates, opts);
  const pg = all.filter((r) => {
    const d = r.sales_date.slice(0, 10);
    return d >= from && d <= to;
  });
  if (!pg.length) {
    return { ...emptyOut, configured: true, dataMin: min, dataMax: max, from, to };
  }

  const byDay = new Map<string, { nett: number; child: number; comp: number }>();
  let weNett = 0, wdNett = 0;
  const weDays = new Set<string>(), wdDays = new Set<string>();
  for (const r of pg) {
    const d = r.sales_date.slice(0, 10);
    const cur = byDay.get(d) ?? { nett: 0, child: 0, comp: 0 };
    cur.nett += r.nett_sales || 0;
    cur.child += r.child_total || 0;
    cur.comp += r.companion_total || 0;
    byDay.set(d, cur);
    const isWe = [0, 6].includes(new Date(d + "T00:00:00").getDay());
    if (isWe) { weNett += r.nett_sales || 0; weDays.add(d); }
    else { wdNett += r.nett_sales || 0; wdDays.add(d); }
  }
  const sorted = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  return {
    configured: true, dataMin: min, dataMax: max, from, to,
    nett: pg.reduce((s, r) => s + (r.nett_sales || 0), 0),
    trx: pg.length,
    child: pg.reduce((s, r) => s + (r.child_total || 0), 0),
    comp: pg.reduce((s, r) => s + (r.companion_total || 0), 0),
    days: byDay.size,
    daily: sorted.map(([date, v]) => ({ date, child: v.child, comp: v.comp })),
    dailyNett: sorted.map(([date, v]) => ({ date, nett: v.nett })),
    // Compared as an average per operating day: a weekend is two days in
    // seven, so on raw totals it loses by construction.
    weekendPerDay: weDays.size ? weNett / weDays.size : 0,
    weekdayPerDay: wdDays.size ? wdNett / wdDays.size : 0,
    solo: pg.filter((r) => !r.companion_total).length,
  };
}
