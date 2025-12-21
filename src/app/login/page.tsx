'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config';

// Simple Icons
const Icons = {
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  ),
  Help: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
  )
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [deviceLockError, setDeviceLockError] = useState(false); // State khusus deteksi lock
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Ambil deviceId dari context untuk dikirim ke backend
  const { login, token, isLoading, deviceId } = useAuth();
  const router = useRouter();
  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (!isLoading && token) {
      router.push('/dashboard');
    }
  }, [token, isLoading, router]);

  const performLogin = async (emailInput: string) => {
    // 1. Hit API Backend manual di sini
    const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: emailInput, 
            deviceId: deviceId // Kirim Device ID dari context
        })
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Login failed');
    }

    // 2. Kalau sukses, baru panggil login() context dengan 2 argumen
    login(data.token, data.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeviceLockError(false);
    setLoading(true);
    
    try {
      await performLogin(email);
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      
      // Deteksi jika error adalah Device Lock
      if (msg.toLowerCase().includes('dikunci') || msg.toLowerCase().includes('perangkat lain')) {
          setDeviceLockError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = async () => {
      if(!email) return;
      setResetLoading(true);
      try {
          const res = await fetch(`${backendUrl}/api/v1/auth/self-reset-device`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          const data = await res.json();
          
          if(res.ok) {
              alert(`Sukses: ${data.message}\nSisa Reset: ${data.remaining}`);
              setDeviceLockError(false);
              setError('');
              // Otomatis coba login lagi setelah reset sukses
              await performLogin(email);
          } else {
              alert(`Gagal: ${data.message}`);
          }
      } catch(e) {
          alert('Terjadi kesalahan koneksi.');
      } finally {
          setResetLoading(false);
      }
  };

  const handleWAHelp = () => {
      window.open('https://wa.me/6281234567890?text=Halo%20Admin%20saya%20butuh%20bantuan%20reset%20device', '_blank');
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Enter your registered email to continue access</p>
        </div>

        {/* ERROR DISPLAY KHUSUS DEVICE LOCK */}
        {deviceLockError ? (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5 mb-6 text-center animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-center mb-2 text-red-500"><Icons.Lock /></div>
                <h3 className="text-red-400 font-bold text-sm mb-1">Akses Ditolak</h3>
                <p className="text-red-300/70 text-xs mb-4">Akun ini sedang aktif digunakan di perangkat lain.</p>
                
                <div className="space-y-3">
                    <button 
                        onClick={handleResetDevice} 
                        disabled={resetLoading}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resetLoading ? 'Memproses...' : <><Icons.Refresh /> Reset Akses Perangkat</>}
                    </button>
                    
                    <button 
                        onClick={handleWAHelp}
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-2 px-4 rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
                    >
                        <Icons.Help /> Hubungi Admin
                    </button>
                </div>
            </div>
        ) : (
            // ERROR BIASA (Non-Lock)
            error && <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm text-center">{error}</div>
        )}

        {/* FORM LOGIN */}
        {!deviceLockError && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-gray-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent block w-full p-3.5 outline-none transition-all placeholder-gray-600"
                placeholder="name@example.com"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full text-black bg-white hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-700 font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-white/10"
            >
                {loading ? 'Verifying...' : 'Sign In'}
            </button>
            </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500">
                Belum punya akses? <a href="/buy-ticket" className="text-yellow-500 hover:text-yellow-400 font-bold transition-colors">Beli Tiket</a>
            </p>
        </div>
      </div>
    </div>
  );
}