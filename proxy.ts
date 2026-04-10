import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname === "/" ||
      pathname.startsWith("/employer-login") ||
      pathname.startsWith("/candidate-login") ||
      pathname.startsWith("/employer-register") ||
      pathname.startsWith("/candidate-register"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "employer") {
      return NextResponse.redirect(new URL("/employer/dashboard", request.url));
    }
    if (profile?.role === "candidate") {
      return NextResponse.redirect(
        new URL("/candidate/dashboard", request.url),
      );
    }
  }

  // Protect employer routes
  if (pathname.startsWith("/employer/")) {
    if (!user) {
      return NextResponse.redirect(new URL("/employer-login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "employer") {
      return NextResponse.redirect(
        new URL("/candidate/dashboard", request.url),
      );
    }
  }

  // Protect candidate routes
  if (pathname.startsWith("/candidate/")) {
    if (!user) {
      return NextResponse.redirect(new URL("/candidate-login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "candidate") {
      return NextResponse.redirect(new URL("/employer/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/employer/:path*",
    "/candidate/:path*",
    "/employer-login",
    "/candidate-login",
    "/employer-register",
    "/candidate-register",
  ],
};
