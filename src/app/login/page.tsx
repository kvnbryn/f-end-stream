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
        setSuccessMsg(`Success! ${data.message} (Sisa kuota hari ini: ${data.remaining})`);
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
              <div className="mb-6 text-green-500 text-sm text-center border border-green-900/30 p-2 rounded bg-green-900/10">
                  {successMsg}
              </div>
          )}

          {/* ERROR MESSAGE & ACTIONS */}
          {error && (
            <div className="mb-6 text-red-500 text-sm text-center border border-red-900/30 p-2 rounded bg-red-900/10">
                <p className="mb-2">{error}</p>
                
                {/* TOMBOL RESET SENDIRI */}
                {showResetButton && (
                    <button 
                        onClick={handleSelfReset} 
                        disabled={isResetting}
                        className="block w-full mt-2 bg-red-800 hover:bg-red-700 text-white py-2 rounded text-xs font-bold uppercase transition-colors disabled:opacity-50"
                    >
                        {isResetting ? 'Resetting...' : '⚠️ Reset My Device (Max 3x/Day)'}
                    </button>
                )}

                {/* LINK WA (Fallback jika limit habis) */}
                {showWaLink && (
                    <a href={adminWaUrl} target="_blank" className="block mt-3 text-gray-500 hover:text-white text-xs underline">
                        Limit habis? Hubungi Admin (WA)
                    </a>
                )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="group relative">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-transparent border-b border-gray-600 py-2 text-white focus:border-yellow-500 outline-none placeholder-transparent" id="loginEmail" placeholder="Email" />
              <label htmlFor="loginEmail" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-yellow-500">Registered Email</label>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-yellow-500 hover:text-black font-bold py-3 rounded transition-all duration-300 disabled:opacity-50">{isSubmitting ? '...' : 'PROCEED'}</button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="text-gray-500 text-xs hover:text-white transition-colors">← Back to Home</button>
        </div>
      </div>
    </main>
  );
}