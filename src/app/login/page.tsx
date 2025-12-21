'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config';

// Icon Sederhana biar UI lebih hidup
const Icons = {
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Loader: () => <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('x'); // Password dummy (karena sistem lu pake email only)
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false); // State khusus buat nandaik akun ke-lock
  const [resetLoading, setResetLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const backendUrl = getBackendUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);
    setSuccessMsg('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Login gagal';
      setError(msg);
      
      // Deteksi kalau errornya karena akun dikunci
      if (msg.includes('dikunci') || msg.includes('perangkat lain')) {
        setIsLocked(true);
      }
    }
  };

  const handleSelfReset = async () => {
    setResetLoading(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/self-reset-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal reset device');
      }

      setSuccessMsg(`Berhasil! Sisa reset hari ini: ${data.remaining}x. Silakan login kembali.`);
      setIsLocked(false); // Hilangkan mode lock
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-sans">
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header Visual */}
        <div className="h-2 bg-gradient-to-r from-yellow-600 to-yellow-400 w-full absolute top-0 left-0"></div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-wider mb-2">WELCOME BACK</h1>
            <p className="text-gray-500 text-sm">Realtime48 Access Portal</p>
          </div>

          {/* SUCCESS MESSAGE */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="text-green-500 mt-0.5"><Icons.Unlock /></div>
              <div>
                <h4 className="text-green-400 font-bold text-sm">Device Unlocked</h4>
                <p className="text-green-200 text-xs mt-1">{successMsg}</p>
              </div>
            </div>
          )}

          {/* ERROR / LOCKED MESSAGE UI */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 border ${isLocked ? 'bg-red-900/10 border-red-800' : 'bg-red-900/20 border-red-900'}`}>
              <div className="flex items-start gap-3">
                <div className="text-red-500 mt-0.5">{isLocked ? <Icons.Lock /> : <Icons.Alert />}</div>
                <div className="flex-1">
                  <h4 className="text-red-400 font-bold text-sm">{isLocked ? 'Akses Terkunci' : 'Login Gagal'}</h4>
                  <p className="text-red-300 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
              </div>

              {/* TOMBOL RESET KHUSUS (JIKA LOCKED) */}
              {isLocked && (
                <button 
                  onClick={handleSelfReset}
                  disabled={resetLoading}
                  className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {resetLoading ? <Icons.Loader /> : <Icons.Unlock />}
                  {resetLoading ? 'Memproses...' : 'Reset Perangkat Saya'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Registered Email</label>
              <input
                id="email"
                type="email"
                required
                className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3.5 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-gray-600 text-sm"
                placeholder="masukkan.email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Input Password Hidden (Dummy) - Biar browser gak ngomel autofill */}
            <input type="password" value={password} onChange={() => {}} className="hidden" />

            <button
              type="submit"
              disabled={isLoading || resetLoading}
              className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Icons.Loader /> : null}
              {isLoading ? 'Verifying...' : 'Masuk Sekarang'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
              Belum punya akses? <a href="/buy-ticket" className="text-yellow-500 hover:text-yellow-400 font-bold hover:underline">Beli Tiket</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}