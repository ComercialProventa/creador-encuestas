import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 👇 Agregamos "default" para que Next.js lo reconozca sin chistar
export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith('/admin') && !path.startsWith('/survey-builder')) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.getAll().find(cookie => cookie.name.includes('-auth-token'));

  if (!authCookie) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/survey-builder/:path*'
  ],
};