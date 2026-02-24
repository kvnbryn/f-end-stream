import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')
  const { pathname } = request.nextUrl

  // 1. IZINKAN AKSES KE HALAMAN NONTON KHUSUS (Tanpa Login)
  // Ini supaya user yang dapet link generate-an admin bisa langsung nonton
  if (pathname.startsWith('/watch/')) {
    return NextResponse.next()
  }

  // 2. Public routes yang tidak butuh login
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/buy-ticket' ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/special-offers')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 3. Proteksi Route Private: Jika tidak ada token, tendang ke halaman login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}