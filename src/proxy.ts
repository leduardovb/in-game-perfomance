import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth/session-token";

/** Optimistic auth check: sends anonymous visitors to the login page. */
export async function proxy(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (secret && (await isValidSessionToken(token, secret))) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except the login page, Next.js internals and public PWA assets.
  matcher: ["/((?!login|_next/static|_next/image|manifest.webmanifest|icons/).*)"],
};
