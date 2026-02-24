import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. IZINKAN AKSES KE HALAMAN NONTON KHUSUS (Tanpa Login)
  // Ini supaya link yang lu generate dari admin bisa dibuka siapa aja
  if (pathname.startsWith('/watch/')) {
    return NextResponse.next()
  }

  // 2. Biarkan route lainnya lewat. 
  // Kita biarkan AuthContext (client-side) lu yang lama yang nanganin proteksi login 
  // supaya nggak bentrok sama localStorage.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware hanya untuk route yang perlu dicek.
     * Kita fokus ke bypass link nonton saja.
     */
    '/watch/:path*',
  ],
}