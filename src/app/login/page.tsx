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

  // REDIRECT JIKA SUDAH LOGIN
  useEffect(() => {
    if (!isLoading && token) {
      // FIX: Cek apakah role-nya ADMIN atau SUPERADMIN
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, token, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setSuccessMsg('');
    setShowWaLink(false); 
    setShowResetButton(false);
    setIsSubmitting(true);

    if (!deviceId) { 
      setError('Device ID Error'); 
      setIsSubmitting(false); 
      return; 
    }

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
      
      // Simpan Token & Role ke Context
      login(data.token, data.role);

      // FIX: Logika redirect setelah berhasil login
      if (data.role === 'ADMIN' || data.role === 'SUPERADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }

    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
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
          <h1 className="text-2xl font-bold tracking-widest text-yellow-500 mb-2 uppercase">Realtime48</h1>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">Secure Access Node</p>
        </div>
        
        <div className="bg-black border border-gray-800 p-8 rounded-2xl shadow-2xl">
          
          {/* SUCCESS MESSAGE */}
          {successMsg && (
              <div className="mb-6 bg-green-900/20 border border-green-800 p-4 rounded-xl text-center">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-widest">{successMsg}</p>
              </div>
          )}

          {/* ERROR & RESET UI */}
          {error && (
            <div className="mb-8">
                {showResetButton ? (
                   <div className="bg-[#111] border border-yellow-700/50 rounded-xl p-6 text-center">
                       <h3 className="text-white font-black text-xs mb-2 uppercase tracking-widest">Access Denied</h3>
                       <p className="text-gray-500 text-[10px] mb-6 font-bold uppercase tracking-widest leading-relaxed">
                          Identity locked to another device node.
                       </p>
                       
                       <button 
                           onClick={handleSelfReset} 
                           disabled={isResetting}
                           className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all"
                       >
                           {isResetting ? 'Processing...' : 'Execute Node Reset'}
                       </button>
                       <p className="text-[9px] text-gray-700 font-bold mt-4 uppercase tracking-widest">Quota: 3 Resets / Day</p>
                   </div>
                ) : (
                   <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl text-center">
                       <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                   </div>
                )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="group relative">
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="peer w-full bg-transparent border-b border-gray-800 py-3 text-white focus:border-yellow-500 outline-none placeholder-transparent font-bold text-sm" 
                id="loginEmail" 
                placeholder="Email" 
              />
              <label htmlFor="loginEmail" className="absolute left-0 -top-3.5 text-[9px] font-black text-gray-600 uppercase tracking-widest transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-xs peer-focus:-top-3.5 peer-focus:text-[9px] peer-focus:text-yellow-500">Registered Identity</label>
            </div>
            
            {!showResetButton && (
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-white text-black hover:bg-yellow-500 font-black py-4 rounded-xl transition-all duration-300 disabled:opacity-30 text-[10px] uppercase tracking-[0.3em] shadow-xl"
                >
                  {isSubmitting ? 'Decrypting...' : 'Initialize Proceed'}
                </button>
            )}
          </form>

           {/* WA LINK FALLBACK */}
           {showWaLink && (
                <div className="mt-8 text-center pt-6 border-t border-gray-900">
                    <a href={adminWaUrl} target="_blank" className="text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-widest underline underline-offset-4 decoration-gray-800">
                        Contact Master Admin
                    </a>
                </div>
            )}

        </div>
        <div className="mt-10 text-center">
          <button onClick={() => router.push('/')} className="text-gray-700 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">← Exit Protocol</button>
        </div>
      </div>
    </main>
  );
}