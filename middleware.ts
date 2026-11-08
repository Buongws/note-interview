import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Chặn mọi trang/API khi chưa đăng nhập (trừ /login và /api/auth/login)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = pathname === "/login" || pathname === "/api/auth/login";

  if (!userId && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
