# GROVE Analytics

Dashboard penjualan tenant GROVE at CIBIS (F&B via ESB POS + Playground
Twist N' Turns). Next.js 16 + Tailwind 4 + ApexCharts, data dari Supabase,
deploy di Vercel: https://sales-dashboard-srkel.vercel.app

Input data dilakukan lewat aplikasi pendamping (GROVE Data Manager,
Streamlit) yang menulis ke Supabase yang sama. Aplikasi ini read-only.

## Menjalankan lokal

1. Salin `.env.local.example` ke `.env.local`, isi ketiga kunci Supabase.
2. `npm install`
3. `npm run dev`

## Struktur penting

- `src/lib/grove.ts` — lapisan data server-only (paging paralel PostgREST)
- `src/lib/auth.ts` + `src/middleware.ts` — sesi login (Supabase Auth)
- `src/app/(admin)/` — halaman dashboard
- `src/app/api/export/[dataset]` — unduhan CSV/XLSX mengikuti filter
