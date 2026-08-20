import type { Metadata } from "next";
import React from "react";
import { redirect } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import ProfileForm from "@/components/grove/ProfileForm";
import { authConfigured, getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil — GROVE" };

export default async function ProfilPage() {
  if (!authConfigured) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Login belum aktif
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Isi SUPABASE_ANON_KEY di .env.local (dan di Vercel) lalu deploy ulang
          — setelah itu seluruh dashboard terkunci di balik halaman masuk.
        </p>
      </div>
    );
  }
  const p = await getProfile();
  if (!p) redirect("/signin");

  const initials = p.name
    .split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-semibold text-white">
            {initials || "?"}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {p.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{p.email}</p>
            <span className="mt-1 inline-block">
              <Badge color="primary">{p.role}</Badge>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Ubah profil
        </h3>
        <ProfileForm name={p.name} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Akun & akses
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Email dan password dikelola di Supabase (Authentication → Users).
          Penambahan pengguna baru, penggantian password, dan penonaktifan
          akun dilakukan oleh pengelola GROVE di sana; peran (role) diatur
          melalui aplikasi pengelolaan.
        </p>
      </div>
    </div>
  );
}
