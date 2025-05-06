import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("Middleware: Request path:", req.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: "/seller/:path*",
};