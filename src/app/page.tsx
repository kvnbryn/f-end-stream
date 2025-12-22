'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getBackendUrl } from '@/lib/config';

// --- Tipe Data Jadwal ---
type PublicSchedule = {
  id: string;
  title: string;
  start_time: string;
  thumbnail: string;
  price: number;
};

// --- ICONS ---
const Icons = {
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>,
  Ticket: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  Whatsapp: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
};

export default function HomePage() {
  const { token, login, deviceId, isLoading, role } = useAuth();
  const router = useRouter();

  // State View & Data
  const [viewMode, setViewMode] = useState<'LOGIN' | 'SCHEDULE'>('LOGIN');
  const [email, setEmail] = useState('');
  const [schedules, setSchedules] = useState<PublicSchedule[]>([]);
  
  // UI States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset Device States
  const [showWaLink, setShowWaLink] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Modal States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PublicSchedule | null>(null);
  const [ticketEmail, setTicketEmail] = useState('');

  // Config Dinamis
  const backendUrl = getBackendUrl();
  const adminWa = '6288809048431'; 

  // 1. Auto Redirect jika sudah login
  useEffect(() => {
    if (!isLoading && token) {
      if (role === 'ADMIN') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [token, isLoading, role, router]);

  // 2. Fetch Jadwal
  useEffect(() => {
    if (viewMode === 'SCHEDULE' && schedules.length === 0) {
      fetch(`${backendUrl}/api/v1/public/schedules`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setSchedules(data); })
        .catch(err => console.error(err));
    }
  }, [viewMode, schedules.length, backendUrl]);

  // 3. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setSuccessMsg('');
    setShowWaLink(false); 
    setShowResetButton(false);
    setIsSubmitting(true);

    if (!deviceId) {
      setError('Device ID missing. Refresh page.');
      setIsSubmitting(false); return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), deviceId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Cek flag dari backend untuk Reset Device
        if (data.redirectToWA) {
            setShowResetButton(true);
            setShowWaLink(true);
        }
        throw new Error(data.message || 'Access denied');
      }

      login(data.token, data.role);
      if (data.role === 'ADMIN') router.push('/admin');
      else router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Self Reset
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
        setSuccessMsg(`Berhasil! Silakan klik tombol ENTER SPACE lagi.`);
        setShowResetButton(false);
        setShowWaLink(false);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsResetting(false);
    }
  };

  // 5. Ticket Modal Logic
  const openTicketModal = (event: PublicSchedule) => {
    setSelectedEvent(event);
    setTicketEmail('');
    setShowTicketModal(true);
  };

  // 6. Send to WA Logic
  const handleSendToWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !ticketEmail) return;

    const message = `Halo Admin Realtime48, saya ingin memesan tiket akses streaming.

Detail Pesanan:
--------------------------------
• Event: ${selectedEvent.title}
• Email User: ${ticketEmail}
• Total Harga: Rp ${selectedEvent.price.toLocaleString('id-ID')}
--------------------------------

Mohon informasinya untuk pembayaran & aktivasi. Terima kasih.`;

    window.open(`https://wa.me/${adminWa}?text=${encodeURIComponent(message)}`, '_blank');
    setShowTicketModal(false);
  };

  if (isLoading) return null;

  return (
    <main className="flex min-h-screen w-full bg-black text-white font-sans selection:bg-yellow-500/30">
      
      {/* KIRI: Visual (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#050505] items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black z-0"></div>
        <div className="absolute w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="relative z-10 p-12 text-center">
            <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 mb-4">
              REAL<br/>TIME<br/><span className="text-yellow-500">48</span>
            </h1>
            <p className="text-gray-500 tracking-[0.2em] text-sm uppercase mt-6 border-t border-gray-800 pt-6 inline-block">
              Premium Live Streaming Platform
            </p>
        </div>
      </div>

      {/* KANAN: Interaksi */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-[#0a0a0a]">
        
        {/* Header Mobile */}
        <div className="lg:hidden p-6 flex justify-between items-center border-b border-white/5">
           <span className="font-bold tracking-wider text-yellow-500">REALTIME48</span>
           <button onClick={() => router.push('/special-offers')} className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase tracking-widest border border-yellow-500/30 px-3 py-1 rounded-full hover:bg-yellow-500/10 transition-all">
              <Icons.Gift /> Offers
           </button>
        </div>

        {/* Header Desktop (Absolute) */}
        <div className="hidden lg:flex absolute top-6 right-6 z-20">
           <button onClick={() => router.push('/special-offers')} className="flex items-center gap-2 bg-white/5 hover:bg-yellow-500 hover:text-black text-gray-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border border-white/10 hover:border-yellow-500 shadow-lg group">
              <span className="group-hover:animate-bounce"><Icons.Gift /></span> Special Offers
           </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-16 xl:px-24 py-12 transition-all duration-500 ease-in-out">
          
          {/* LOGIN VIEW */}
          {viewMode === 'LOGIN' && (
            <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">Welcome back.</h2>
                <p className="text-gray-400 text-sm">Masukkan email terdaftar untuk akses stream.</p>
              </div>

              {/* SUCCESS MESSAGE */}
              {successMsg && (
                  <div className="mb-6 bg-green-900/20 border border-green-800 p-3 rounded text-center">
                      <p className="text-green-400 text-xs font-bold">{successMsg}</p>
                  </div>
              )}

              {/* ERROR & RESET OPTIONS - SIMPLE & CLEAN */}
              {error && (
                <div className="mb-6">
                   {showResetButton ? (
                       // TAMPILAN RESET ACTION CARD
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
                       // TAMPILAN ERROR BIASA
                       <div className="bg-red-900/10 border border-red-900/30 p-3 rounded text-center">
                           <p className="text-red-500 text-xs">{error}</p>
                       </div>
                   )}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="group relative">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-transparent border-b border-gray-700 py-3 text-lg text-white focus:border-yellow-500 focus:outline-none transition-colors placeholder-transparent" id="emailInput" placeholder="Email" />
                  <label htmlFor="emailInput" className="absolute left-0 -top-3.5 text-sm text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-placeholder-shown:text-gray-500 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-yellow-500">Email Address</label>
                </div>
                
                {/* HIDE BUTTON SAAT RESET MODE AKTIF */}
                {!showResetButton && (
                    <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-yellow-500 hover:text-black font-bold py-4 rounded transition-all duration-300 disabled:opacity-50 text-sm tracking-widest">{isSubmitting ? 'Processing...' : 'ENTER SPACE'}</button>
                )}
              </form>
              
              {/* WA LINK FALLBACK */}
              {showWaLink && (
                  <div className="mt-6 text-center pt-4 border-t border-white/5">
                      <a href={`https://wa.me/${adminWa}`} target="_blank" className="text-gray-500 hover:text-white text-xs underline">
                          Bantuan Admin (WhatsApp)
                      </a>
                  </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                <p className="text-gray-500 text-sm mb-4">Belum punya akses?</p>
                <button onClick={() => setViewMode('SCHEDULE')} className="text-white border border-gray-700 hover:border-white px-6 py-2 rounded-full text-sm transition-all hover:bg-white/5">Lihat Jadwal & Tiket</button>
              </div>
            </div>
          )}

          {/* SCHEDULE VIEW */}
          {viewMode === 'SCHEDULE' && (
            <div className="w-full max-w-lg mx-auto h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                <button onClick={() => setViewMode('LOGIN')} className="text-sm text-gray-400 hover:text-white">← Back to Login</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {schedules.length === 0 ? <div className="text-center py-12 border border-dashed border-gray-800 rounded text-gray-600">No active schedules.</div> : schedules.map((show) => (
                    <div key={show.id} className="group bg-[#111] border border-gray-800 hover:border-yellow-500/50 rounded-lg overflow-hidden transition-all duration-300">
                      <div className="h-40 w-full bg-gray-800 relative overflow-hidden">
                         {show.thumbnail ? <img src={show.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"/> : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase">No Visual</div>}
                         <div className="absolute top-2 right-2 bg-yellow-600 text-black text-[10px] font-bold px-2 py-0.5 rounded">LIVE</div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg leading-tight mb-2 text-gray-200 group-hover:text-white">{show.title}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">{new Date(show.start_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        <div className="flex justify-between items-end">
                          <span className="text-yellow-500 font-mono text-lg">Rp {show.price.toLocaleString('id-ID')}</span>
                          <button onClick={() => openTicketModal(show)} className="bg-white text-black hover:bg-yellow-500 px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2"><Icons.Ticket /> BUY TICKET</button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 text-center lg:text-left text-[10px] text-gray-700 border-t border-white/5">&copy; 2025 REALTIME48 INC.</div>
      </div>

      {/* TICKET MODAL */}
      {showTicketModal && selectedEvent && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#111] border border-gray-700 w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
            <button onClick={() => setShowTicketModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X /></button>
            <div className="mb-6 border-b border-gray-800 pb-6">
              <h3 className="text-xl font-bold text-white mb-1">Purchase Access</h3>
              <p className="text-gray-400 text-xs">Event: <span className="text-yellow-500">{selectedEvent.title}</span></p>
            </div>
            <form onSubmit={handleSendToWa} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">User Email Identity</label>
                <input type="email" value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" placeholder="your@email.com" required />
              </div>
              <div className="bg-white/5 p-3 rounded border border-white/10 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Est. Price</span>
                  <span className="text-yellow-500 font-mono font-bold">Rp {selectedEvent.price.toLocaleString('id-ID')}</span>
               </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"><Icons.Whatsapp /> SEND ORDER VIA WHATSAPP</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}