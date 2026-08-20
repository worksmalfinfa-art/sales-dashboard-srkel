import { authConfigured, getProfile } from "@/lib/auth";

export async function GET() {
  if (!authConfigured) {
    // Fail-open mode (SUPABASE_ANON_KEY not set): pages are public, so the
    // header shows a clear placeholder instead of an eternal spinner.
    return Response.json({ email: "", name: "Tamu", role: "auth nonaktif" });
  }
  const p = await getProfile();
  if (!p) return new Response("unauthorized", { status: 401 });
  return Response.json({ email: p.email, name: p.name, role: p.role });
}
