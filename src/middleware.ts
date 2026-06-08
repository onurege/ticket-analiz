/*
 * Next.js middleware — sayfa & API rotalarına auth kontrolü.
 *
 * Bu katman Edge runtime'da çalışır; DB query yapamaz. Bu yüzden sadece
 * cookie varlığını kontrol eder (kullanıcının login olmuş olabileceğini).
 * Detaylı doğrulama (session geçerli mi, user active mi) handler içinde
 * `requireUser()` / `requireRole()` ile yapılır.
 *
 * Davranış:
 *   - Public path'ler (login, api/auth/login, static, _next) → izin
 *   - Diğer her şey → cookie yoksa: pages için /login redirect, api için 401
 */

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  // Public v1 API — kendi Bearer-token auth'unu yapar (src/lib/api/auth.ts).
  // CC session cookie kontrolü dışında tutulur.
  "/api/v1",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  // Static assets, Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)$/i.test(pathname)) {
    return true;
  }
  return false;
}

function isApi(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // iron-session cookie'sinin varlığını oku
  const cookieName = process.env.CC_SESSION_COOKIE_NAME ?? "cc_session";
  const sessionCookie = req.cookies.get(cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    if (isApi(pathname)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim — login gerekli." },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tüm path'leri kapsa, _next / static asset / favicon hariç
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
