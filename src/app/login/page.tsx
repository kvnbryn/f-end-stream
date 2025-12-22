'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getBackendUrl } from '@/lib/config'; // Import Config Sakti

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // Info sukses reset
  
  const [showWaLink, setShowWaLink] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false); // State untuk tombol reset

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // Loading saat reset
  
  const { login, deviceId, isLoading, token, role } = useAuth();
  const router = useRouter();

  // Pake URL Dinamis
  const backendUrl = getBackendUrl();
  const adminWaUrl = 'https://wa.me/6288809048431'; 

  useEffect(() => {
    if (!isLoading && token) {
      if (role === 'ADMIN') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [isLoading, token, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setSuccessMsg('');
    setShowWaLink(false); 
    setShowResetButton(false);
    setIsSubmitting(true);

    if (!deviceId) { setError('Device ID Error'); setIsSubmitting(false); return; }

    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), deviceId }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Jika error karena device locked, backend kirim flag redirectToWA (kita manfaatkan ini untuk show reset)
        if (data.redirectToWA) {
            setShowResetButton(true);
            setShowWaLink(true); // Tetap simpan WA sebagai opsi terakhir
            // Kita ganti pesan error default backend dengan pesan yang lebih "Actionable" di UI nanti
        }
        throw new Error(data.message || 'Login Failed');
      }
      
      login(data.token, data.role);
      if (data.role === 'ADMIN') router.push('/admin');
      else router.push('/dashboard');

    } catch (err: any) { setError(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleSelfReset = async () => {
    if(!email) return;
    setIsResetting(true);
    setError('');
    
    try {
        const res = await fetch(`${backendUrl}/api/v1/auth/self-reset-device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase() }),
        });
        const data = await res.json();

        if(!res.ok) throw new Error(data.message);

        // Jika Sukses
        setSuccessMsg(`Berhasil! Device lama sudah di-logout. Silakan tekan tombol PROCEED lagi.`);
        setShowResetButton(false);
        setShowWaLink(false);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsResetting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold tracking-widest text-yellow-500 mb-2">REALTIME48</h1>
          <p className="text-gray-600 text-xs uppercase tracking-[0.3em]">Secure Access</p>
        </div>
        <div className="bg-black border border-gray-800 p-8 rounded-lg shadow-2xl">
          
          {/* SUCCESS MESSAGE */}
          {successMsg && (
              <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-center animate-in fade-in zoom-in duration-300">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-green-400 text-sm font-bold">{successMsg}</p>
              </div>
          )}

          {/* LOGIC TAMPILAN ERROR vs RESET OFFER */}
          {error && (
            <div className="mb-8">
                {showResetButton ? (
                   // --- TAMPILAN KHUSUS RESET (WARNA KUNING - ACTIONABLE) ---
                   <div className="bg-yellow-900/10 border border-yellow-500/50 rounded-xl p-5 text-center animate-in slide-in-from-top-2">
                       <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="2" y="6" rx="2" ry="2"/><path d="M12 2v4"/><path d="M12 16v4"/></svg>
                       </div>
                       <h3 className="text-yellow-500 font-bold text-lg mb-1">Akun Sedang Aktif</h3>
                       <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                          Akun ini sedang login di perangkat lain. Apakah Anda ingin mengeluarkannya dan login di sini?
                       </p>
                       
                       <button 
                           onClick={handleSelfReset} 
                           disabled={isResetting}
                           className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(202,138,4,0.3)] hover:shadow-[0_0_25px_rgba(202,138,4,0.5)] flex items-center justify-center gap-2"
                       >
                           {isResetting ? (
                             <span className="animate-pulse">Memproses...</span>
                           ) : (
                             <>
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                               YA, PINDAHKAN KE SINI
                             </>
                           )}
                       </button>
                       <p className="text-[10px] text-gray-500 mt-2">Batas reset: 3x sehari</p>
                   </div>
                ) : (
                   // --- TAMPILAN ERROR BIASA (MERAH) ---
                   <div className="text-red-500 text-sm text-center border border-red-900/30 p-3 rounded bg-red-900/10 flex flex-col items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                       <p>{error}</p>
                   </div>
                )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="group relative">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-transparent border-b border-gray-600 py-2 text-white focus:border-yellow-500 outline-none placeholder-transparent" id="loginEmail" placeholder="Email" />
              <label htmlFor="loginEmail" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-yellow-500">Registered Email</label>
            </div>
            
            {/* Tombol Proceed Disembunyikan kalau lagi mode Reset, biar ga bingung */}
            {!showResetButton && (
                <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-yellow-500 hover:text-black font-bold py-3 rounded transition-all duration-300 disabled:opacity-50">{isSubmitting ? '...' : 'PROCEED'}</button>
            )}
          </form>

           {/* LINK WA (Fallback jika limit habis / Error lain) */}
           {showWaLink && (
                <div className="mt-6 text-center border-t border-gray-800 pt-4">
                    <p className="text-gray-500 text-xs mb-2">Gagal reset atau limit habis?</p>
                    <a href={adminWaUrl} target="_blank" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs border border-gray-700 px-3 py-2 rounded hover:bg-gray-800 transition-colors">
                        Hubungi Admin via WhatsApp
                    </a>
                </div>
            )}

        </div>
        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="text-gray-500 text-xs hover:text-white transition-colors">← Back to Home</button>
        </div>
      </div>
    </main>
  );
}