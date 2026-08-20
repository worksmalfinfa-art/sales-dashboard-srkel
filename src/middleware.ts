import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Session gate for every page and the export API. Fails OPEN when the anon
 * key is not configured yet, so a fresh checkout (or the deploy before the
 * env var is added) shows dashboards instead of locking everyone out.
 */
export async function middleware(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supa = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supa.auth.getUser();
  const path = req.nextUrl.pathname;
  const onAuthPage = path === "/signin" || path === "/signup";

  if (!user && !onAuthPage) {
    const to = req.nextUrl.clone();
    to.pathname = "/signin";
    to.search = "";
    return NextResponse.redirect(to);
  }
  if (user && onAuthPage) {
    const to = req.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  // Everything except static assets and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|woff2?)$).*)",
  ],
};
