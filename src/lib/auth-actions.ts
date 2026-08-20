"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient, authConfigured, lookupProfile, saveDisplayName, getProfile } from "@/lib/auth";

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!authConfigured) {
    return { error: "Auth belum dikonfigurasi (SUPABASE_ANON_KEY kosong)." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supa = await authClient();
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau password salah." };

  // Deactivated accounts (users.is_active = false) are turned away even
  // though their credentials are still valid in Supabase Auth.
  const profile = await lookupProfile(email);
  if (!profile.active) {
    await supa.auth.signOut();
    return { error: "Akun ini sudah dinonaktifkan." };
  }
  redirect("/");
}

export async function signOut() {
  const supa = await authClient();
  await supa.auth.signOut();
  redirect("/signin");
}

export async function updateDisplayName(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const profile = await getProfile();
  if (!profile) return { error: "Sesi berakhir — masuk lagi." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama tidak boleh kosong." };
  if (name.length > 60) return { error: "Nama terlalu panjang (maks 60)." };
  try {
    await saveDisplayName(profile.email, name);
  } catch {
    return { error: "Gagal menyimpan — coba lagi." };
  }
  revalidatePath("/profil");
  return { ok: true };
}
