"use client";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { signOut } from "@/lib/auth-actions";

type Me = { email: string; name: string; role: string };

/** Signed-in user chip: initials avatar, name, role, profile link, sign out. */
export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const initials = (me?.name ?? "?")
    .split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen((v) => !v); }}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initials || "?"}
        </span>
        <span className="block mr-1 font-medium text-theme-sm">
          {me?.name ?? "…"}
        </span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18" height="20" viewBox="0 0 18 20" fill="none"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {me?.name ?? "Pengguna"}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {me?.email ?? ""}
          </span>
          {me?.role ? (
            <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-500 dark:bg-brand-500/10">
              {me.role}
            </span>
          ) : null}
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              tag="a"
              href="/profil"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Profil saya
            </DropdownItem>
          </li>
        </ul>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Keluar
        </button>
      </Dropdown>
    </div>
  );
}
