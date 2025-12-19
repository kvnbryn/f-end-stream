// frontend/src/lib/config.ts

export const getBackendUrl = () => {
  // 1. Prioritas: Ambil dari Environment Variable Vercel (nanti kita setting)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Fallback: Kalau jalan di localhost laptop lu
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  
  // 3. Default terakhir: Tembak ke VPS Backend lu
  return 'https://api.realtime48.my.id'; 
};