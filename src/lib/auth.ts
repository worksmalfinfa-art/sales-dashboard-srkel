import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-session auth on Supabase Auth, entirely server-side: the anon key
 * never ships to the browser because sign-in happens in a server action and
 * the middleware validates the session server-side too.
 *
 * Profile fields (display name, role, is_active) live in the existing
 * `users` table keyed by email — the same table the Streamlit app manages.
 */

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const authConfigured = Boolean(url && anon);

export async function authClient() {
  const store = await cookies();
  return createServerClient(url!, anon!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options));
        } catch {
          // Render of a server component: cookies are read-only there; the
          // middleware refreshes them instead.
        }
      },
    },
  });
}

export type Profile = {
  email: string;
  name: string;
  role: string;
  active: boolean;
};

/** The signed-in user with their `users`-table profile, or null. */
export async function getProfile(): Promise<Profile | null> {
  if (!authConfigured) return null;
  const supa = await authClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user?.email) return null;
  return lookupProfile(user.email);
}

export async function lookupProfile(email: string): Promise<Profile> {
  const fallback = {
    email, name: email.split("@")[0], role: "Viewer", active: true,
  };
  if (!url || !service) return fallback;
  const sb = createClient(url, service);
  const { data } = await sb.from("users")
    .select("display_name,role,is_active").eq("email", email).maybeSingle();
  if (!data) return fallback;
  return {
    email,
    name: data.display_name || fallback.name,
    role: data.role || "Viewer",
    active: data.is_active !== false,
  };
}

export async function saveDisplayName(email: string, name: string) {
  if (!url || !service) return;
  const sb = createClient(url, service);
  const { error } = await sb.from("users")
    .upsert({ email, display_name: name }, { onConflict: "email" });
  if (error) throw new Error(error.message);
}
