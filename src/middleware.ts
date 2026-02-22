import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function checkBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  try {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [user, pass] = decoded.split(":");
    return user === ADMIN_USER && pass === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

const isAccountRoute = createRouteMatcher([
  "/account(.*)",
  "/api/account(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Admin: Basic Auth (unchanged)
  if (isAdminRoute(pathname)) {
    if (!checkBasicAuth(req)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin"',
        },
      });
    }
    return NextResponse.next();
  }

  // Account: Clerk required
  if (isAccountRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/account/:path*",
    "/api/account/:path*",
  ],
};
