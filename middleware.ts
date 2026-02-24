import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Izinkan akses link khusus dan dashboard
  if (pathname.startsWith('/watch/') || pathname === '/dashboard') {
    return NextResponse.next()
  }

  // 2. Public routes
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/buy-ticket' ||
    pathname.startsWith('/public/')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}