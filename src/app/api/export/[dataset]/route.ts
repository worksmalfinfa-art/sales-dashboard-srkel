import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getFnb, getPlayground, getPerformance } from "@/lib/grove";

/**
 * Data export, driven by the same query params as the dashboards, so what
 * the user downloads is exactly what the page shows.
 *
 *   GET /api/export/fnb?dari=&sampai=&tenant=&format=csv|xlsx
 *   GET /api/export/playground?dari=&sampai=&format=csv|xlsx
 *   GET /api/export/performa?bulan=&format=csv|xlsx
 */

type Cell = string | number;
type Table = { name: string; header: Cell[]; rows: Cell[][]; moneyCols: number[] };

function csvResponse(table: Table, filename: string): Response {
  const esc = (c: Cell) => {
    const s = String(c);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [table.header, ...table.rows]
    .map((r) => r.map(esc).join(";"))
    .join("\r\n");
  // BOM + semicolon delimiter: what Excel on an Indonesian locale expects.
  return new Response("﻿" + lines, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

async function xlsxResponse(tables: Table[], filename: string): Promise<Response> {
  const wb = new ExcelJS.Workbook();
  for (const t of tables) {
    const ws = wb.addWorksheet(t.name);
    const head = ws.addRow(t.header);
    head.font = { bold: true };
    head.border = { bottom: { style: "thin" } };
    for (const r of t.rows) ws.addRow(r);
    t.header.forEach((h, i) => {
      const col = ws.getColumn(i + 1);
      col.width = Math.max(12, String(h).length + 4);
      if (t.moneyCols.includes(i)) col.numFmt = "#,##0";
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buf as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await ctx.params;
  const q = req.nextUrl.searchParams;
  const format = q.get("format") === "xlsx" ? "xlsx" : "csv";

  let tables: Table[];
  let filename: string;
  // Which table a flat CSV gets: the daily detail for the dashboards, the
  // leaderboard for performa.
  let csvIndex = 1;

  if (dataset === "fnb") {
    const d = await getFnb({
      from: q.get("dari") ?? undefined,
      to: q.get("sampai") ?? undefined,
      tenant: q.get("tenant") ?? undefined,
    });
    if (!d.configured || !d.dataMin) return new Response("no data", { status: 404 });
    tables = [
      {
        name: "Ringkasan",
        header: ["Metrik", "Nilai"],
        rows: [
          ["Rentang", `${d.from} s.d. ${d.to}`],
          ["Tenant", d.tenant
            ? d.tenantOptions.find((t) => t.id === d.tenant)?.name ?? d.tenant
            : "Seluruh tenant ESB"],
          ["Nett Sales", d.nett],
          ["Pax", d.pax],
          ["Hari berdagang", d.days],
          ["Diskon", d.disc],
          ...d.segments.map((s): Cell[] => [`Segmen ${s.name} (${s.range})`, s.nett]),
        ],
        moneyCols: [1],
      },
      {
        name: "Harian",
        header: ["Tanggal", "Hari", "Nett Sales", "Pax", "Rata per Pax"],
        rows: d.deep.map((r): Cell[] =>
          [r.date, r.dow, r.nett, r.pax, Math.round(r.avgPax)]),
        moneyCols: [2, 4],
      },
      {
        name: "Mingguan",
        header: ["Minggu", "Hari", "Nett Sales", "Rata per hari"],
        rows: d.weekly.map((w): Cell[] =>
          [w.label, w.days, w.nett, Math.round(w.avgDay)]),
        moneyCols: [2, 3],
      },
      {
        name: "Bulanan",
        header: ["Bulan", "Hari", "Nett Sales", "Pax", "Rata per hari"],
        rows: d.monthly.map((m): Cell[] =>
          [m.label + (m.partial ? " (berjalan)" : ""), m.days, m.nett, m.vol,
           Math.round(m.avgDay)]),
        moneyCols: [2, 4],
      },
      {
        name: "Per Tenant",
        header: ["Tenant", "Nett Sales", "Pax", "Kontribusi %"],
        rows: d.tenants.map((t): Cell[] =>
          [t.name, t.nett, t.pax, Number(t.share.toFixed(1))]),
        moneyCols: [1],
      },
    ];
    filename = `grove-fnb_${d.from}_${d.to}`;
  } else if (dataset === "playground") {
    const d = await getPlayground({
      from: q.get("dari") ?? undefined,
      to: q.get("sampai") ?? undefined,
    });
    if (!d.configured || !d.dataMin) return new Response("no data", { status: 404 });
    tables = [
      {
        name: "Ringkasan",
        header: ["Metrik", "Nilai"],
        rows: [
          ["Rentang", `${d.from} s.d. ${d.to}`],
          ["Nett Sales", d.nett],
          ["Transaksi", d.trx],
          ["Anak", d.child],
          ["Pendamping", d.comp],
          ["Hari beroperasi", d.days],
          ["Rata-rata/hari akhir pekan", Math.round(d.weekendPerDay)],
          ["Rata-rata/hari hari kerja", Math.round(d.weekdayPerDay)],
        ],
        moneyCols: [1],
      },
      {
        name: "Harian",
        header: ["Tanggal", "Hari", "Nett Sales", "Transaksi", "Anak", "Pendamping"],
        rows: d.deep.map((r): Cell[] =>
          [r.date, r.dow, r.nett, r.trx, r.child, r.comp]),
        moneyCols: [2],
      },
      {
        name: "Mingguan",
        header: ["Minggu", "Hari", "Nett Sales", "Rata per hari"],
        rows: d.weekly.map((w): Cell[] =>
          [w.label, w.days, w.nett, Math.round(w.avgDay)]),
        moneyCols: [2, 3],
      },
      {
        name: "Bulanan",
        header: ["Bulan", "Hari", "Nett Sales", "Anak", "Rata per hari"],
        rows: d.monthly.map((m): Cell[] =>
          [m.label + (m.partial ? " (berjalan)" : ""), m.days, m.nett, m.vol,
           Math.round(m.avgDay)]),
        moneyCols: [2, 4],
      },
    ];
    filename = `grove-playground_${d.from}_${d.to}`;
  } else if (dataset === "performa") {
    const d = await getPerformance(q.get("bulan") ?? undefined);
    if (!d.configured || !d.tenants.length) return new Response("no data", { status: 404 });
    tables = [
      {
        name: "Peringkat",
        header: ["Tenant", "Unit", "Nett Sales", "MoM %", "Rata per Pengunjung",
                 "Pengunjung", "Kontribusi %"],
        rows: d.tenants.map((t): Cell[] => [
          t.name, t.unit ?? "", t.nett,
          t.mom === null ? "baru" : Number(t.mom.toFixed(1)),
          t.avgCheck, t.visitors, Number(t.share.toFixed(1)),
        ]),
        moneyCols: [2, 4],
      },
      ...(d.occupancy ? [{
        name: "Okupansi",
        header: ["Unit", "Lantai", "Tenant", "Periode sewa", "Nett bulan ini"] as Cell[],
        rows: d.occupancy.units.map((u): Cell[] =>
          [u.unit, u.floor ?? "", u.tenant ?? "Kosong", u.period ?? "", u.nett]),
        moneyCols: [4],
      }] : []),
    ];
    filename = `grove-performa_${d.month}`;
    csvIndex = 0;
  } else {
    return new Response("unknown dataset", { status: 404 });
  }

  return format === "xlsx"
    ? xlsxResponse(tables, filename)
    : csvResponse(tables[csvIndex] ?? tables[0], filename);
}
