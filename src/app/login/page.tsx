'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getBackendUrl } from '@/lib/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showWaLink, setShowWaLink] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const { login, deviceId, isLoading, token, role } = useAuth();
  const router = useRouter();

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
        if (data.redirectToWA) {
            setShowResetButton(true);
            setShowWaLink(true);
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

        setSuccessMsg(`Berhasil! Silakan klik tombol PROCEED lagi.`);
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
              <div className="mb-6 bg-green-900/20 border border-green-800 p-3 rounded text-center">
                  <p className="text-green-400 text-xs font-bold">{successMsg}</p>
              </div>
          )}

          {/* ERROR & RESET UI - SIMPLE & CLEAN */}
          {error && (
            <div className="mb-8">
                {showResetButton ? (
                   <div className="bg-[#111] border border-yellow-700/50 rounded-lg p-5 text-center">
                       <h3 className="text-white font-bold text-sm mb-2">Login Ditolak</h3>
                       <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                          Akun ini sedang aktif di perangkat lain.
                       </p>
                       
                       <button 
                           onClick={handleSelfReset} 
                           disabled={isResetting}
                           className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded text-xs uppercase tracking-wider transition-colors"
                       >
                           {isResetting ? 'Memproses...' : 'RESET & LOGIN DI SINI'}
                       </button>
                       <p className="text-[10px] text-gray-600 mt-2">Sisa reset: 3x sehari</p>
                   </div>
                ) : (
                   <div className="bg-red-900/10 border border-red-900/30 p-3 rounded text-center">
                       <p className="text-red-500 text-xs">{error}</p>
                   </div>
                )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="group relative">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-transparent border-b border-gray-600 py-2 text-white focus:border-yellow-500 outline-none placeholder-transparent" id="loginEmail" placeholder="Email" />
              <label htmlFor="loginEmail" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-yellow-500">Registered Email</label>
            </div>
            
            {/* HIDE BUTTON WHEN RESETTING IS NEEDED */}
            {!showResetButton && (
                <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-yellow-500 hover:text-black font-bold py-3 rounded transition-all duration-300 disabled:opacity-50 text-sm tracking-wider">{isSubmitting ? '...' : 'PROCEED'}</button>
            )}
          </form>

           {/* WA LINK FALLBACK */}
           {showWaLink && (
                <div className="mt-6 text-center pt-4 border-t border-gray-800">
                    <a href={adminWaUrl} target="_blank" className="text-gray-500 hover:text-white text-xs underline">
                        Bantuan Admin (WhatsApp)
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