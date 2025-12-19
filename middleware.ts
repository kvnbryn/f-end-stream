import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Cek tiket di cookie
  const token = request.cookies.get('session_token')?.value;

  // 1. Jika mau masuk area terlarang tapi gapunya tiket -> Tendang ke Login
  if (protectedRoutes.some(path => pathname.startsWith(path)) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Jika sudah punya tiket tapi mau ke halaman login -> Balikin ke Dashboard
  // (Nanti halaman Dashboard yang akan oper ke Admin kalau dia admin)
  if (token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard'; 
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
  ],
};