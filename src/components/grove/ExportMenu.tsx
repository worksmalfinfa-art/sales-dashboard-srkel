"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Download menu: Excel / CSV hit the export route with the page's current
 * query params (what you see is what you download); PDF goes through the
 * browser's print dialog with the print stylesheet.
 */
export default function ExportMenu({ dataset }: { dataset: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = useSearchParams();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const href = (format: "csv" | "xlsx") => {
    const q = new URLSearchParams(params.toString());
    q.set("format", format);
    return `/api/export/${dataset}?${q.toString()}`;
  };

  const item =
    "block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 " +
    "dark:text-gray-300 dark:hover:bg-white/5";

  return (
    <div ref={ref} className="relative print:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
             strokeLinejoin="round" aria-hidden>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Unduh
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <a className={item} href={href("xlsx")} onClick={() => setOpen(false)}>
            Excel (.xlsx)
          </a>
          <a className={item} href={href("csv")} onClick={() => setOpen(false)}>
            CSV
          </a>
          <button
            className={item}
            onClick={() => { setOpen(false); window.print(); }}
          >
            PDF / Cetak
          </button>
        </div>
      ) : null}
    </div>
  );
}
