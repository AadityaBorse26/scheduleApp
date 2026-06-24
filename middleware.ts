import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured =
    !!supabaseUrl &&
    supabaseUrl !== "your-supabase-project-url" &&
    supabaseUrl.startsWith("https://") &&
    !!supabaseAnonKey &&
    supabaseAnonKey !== "your-supabase-anon-key";

  let user = null;
  let response = NextResponse.next({ request });

  const isMockLoggedIn = request.cookies.get("mock_logged_in")?.value === "true";

  if (isMockLoggedIn) {
    user = { id: "mock-user-1111-2222-3333-444444444444" };
  } else if (isConfigured) {
    const supabase = createServerClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({ request });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    user = supabaseUser;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // List of paths that require authentication
  const protectedRoutes = ["/dashboard", "/settings", "/availability", "/group"];
  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(route + "/"));

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
