import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export default withAuth(
  function middleware(request) {
    if (request.nextauth.token && ["/login", "/register"].includes(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token, req }) =>
        publicPaths.some((path) => req.nextUrl.pathname.startsWith(path)) || Boolean(token),
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)"],
};
