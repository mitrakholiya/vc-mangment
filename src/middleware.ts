import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  const publicPaths = ["/login", "/register"];
  const privatePaths = ["/", "/venture", "/join"];

  const isPublicPath = publicPaths.includes(path);

  const isPrivatePath =
    privatePaths.includes(path) ||
    path === "/view-venture" ||
    path.startsWith("/view-venture/");

  // Auth user trying to access public pages
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauth user trying to access protected pages
  if (isPrivatePath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */

    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
