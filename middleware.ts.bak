import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    // Tạm thời tắt check session để test giao diện Admin
    // const role = (session?.user as any)?.role;
    // if (!session || (role !== 'ADMIN' && role !== 'STAFF')) {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }
  }

  if (pathname.startsWith('/account')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
