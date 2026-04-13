import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  // Handle i18n routing
  const intlResponse = intlMiddleware(request);

  // Only refresh Supabase session if configured
  if (hasSupabase) {
    try {
      const { updateSession } = await import("./lib/supabase/middleware");
      const supabaseResponse = await updateSession(request);
      if (intlResponse && supabaseResponse) {
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          intlResponse.cookies.set(cookie.name, cookie.value);
        });
      }
    } catch {
      // Supabase not configured, skip session refresh
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
