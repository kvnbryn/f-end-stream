'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer'; 
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client'; 
import { getBackendUrl } from '@/lib/config'; 

// --- ICONS PROFESSIONAL ---
const Icons = {
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>,
  Film: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="7" x2="7" y1="3" y2="21"/><line x1="17" x2="17" y1="3" y2="21"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="7" y1="7" y2="7"/><line x1="3" x2="7" y1="17" y2="17"/><line x1="17" x2="21" y1="17" y2="17"/><line x1="17" x2="21" y1="7" y2="7"/></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

export default function DashboardPage() {
  const { token, logout, isLoading, role } = useAuth(); 
  const router = useRouter();
  
  // State Stream & UI
  const [streamData, setStreamData] = useState<any>(null);
  const [activeSourceIdx, setActiveSourceIdx] = useState(0);
  const [error, setError] = useState('');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); 

  const backendUrl = getBackendUrl();

  // Proteksi Route
  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  // Ambil data user (Membership)
  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/me`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok) setDaysLeft(data.daysLeft);
    } catch (err) { console.error(err); }
  };

  // Ambil data stream aktif
  const fetchStreamData = async () => {
    if (!token) return; 
    try {
      const res = await fetch(`${backendUrl}/api/v1/stream/current`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();

      if (!res.ok) throw new Error('OFFLINE');

      setStreamData(data);
      setError('');
      
      const startTime = new Date(data.start_time);
      const now = new Date();

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      // Jika waktu mulai masih di masa depan, jalankan countdown
      if (now < startTime) {
        startCountdown(startTime);
      } else {
        setCountdown('');
      }

    } catch (err: any) {
      setStreamData(null); 
      setError(err.message === 'OFFLINE' ? 'OFFLINE' : err.message);
    }
  };

  const startCountdown = (targetTime: Date) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetTime.getTime() - now;
      
      if (distance < 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(''); 
        fetchStreamData(); 
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      const fmt = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${days > 0 ? days + 'd ' : ''}${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`);
    };
    
    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000); 
  };
  
  useEffect(() => {
    if (!isLoading && token) {
      fetchUserData(); 
      fetchStreamData();
      
      const socket: Socket = io(backendUrl);
      socket.on('SCHEDULE_UPDATED', () => fetchStreamData());
      
      return () => { 
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 
        socket.disconnect(); 
      };
    }
  }, [isLoading, token, backendUrl]); 

  // Helper untuk mendapatkan ID YouTube dari URL apa saja
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentUrl = streamData?.sources?.[activeSourceIdx]?.url || '';
  const youtubeIdForChat = getYoutubeId(currentUrl);

  if (isLoading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-yellow-500/30 flex flex-col">
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-yellow-500 cursor-default">
              REALTIME<span className="text-white">48</span>
            </h1>
            {daysLeft !== null && (
                <div className="md:hidden mt-0.5 flex items-center gap-1 text-[9px] font-black text-yellow-400 opacity-80 uppercase tracking-widest">
                   <Icons.Crown /> {daysLeft} Days Left
                </div>
            )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <a 
            href="http://inforealtime48.my.id/ReplayMembership.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-gray-300 hover:text-white transition-all uppercase tracking-widest"
          >
            <Icons.Film /> <span className="hidden sm:inline">Replay Membership</span>
          </a>

          {daysLeft !== null && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black text-yellow-500 tracking-widest">
              <Icons.Crown /> {daysLeft} DAYS
            </div>
          )}

          {role === 'ADMIN' && (
            <button onClick={() => router.push('/admin')} className="hidden md:block text-[10px] font-black text-gray-500 hover:text-yellow-500 transition-colors uppercase tracking-widest">
              Admin Panel
            </button>
          )}
          
          <button onClick={logout} className="p-2.5 rounded-full bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 transition-all border border-white/5 active:scale-95">
              <Icons.Logout />
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-8 lg:p-12 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* KOLOM KIRI: Player & Info (Span 3) */}
          <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {streamData && !countdown ? (
              <>
                <VideoPlayer 
                  sources={streamData.sources || []} 
                  activeSourceIndex={activeSourceIdx}
                  onSwitchSource={(idx) => setActiveSourceIdx(idx)}
                  poster={streamData.thumbnail}
                />
                
                <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-50"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
                        {streamData.title}
                      </h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Performance</span>
                        </div>
                        <span className="text-gray-800 text-xs">|</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Started at {new Date(streamData.start_time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator Pro */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6"></div>
                  
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-4xl">
                    Selamat datang di layanan eksklusif **Realtime48**. Jika siaran mengalami kendala teknis atau buffering, silakan gunakan tombol switcher server yang tersedia di bawah layar player untuk berpindah ke jalur cadangan. 
                  </p>
                </div>
              </>
            ) : (
              /* State Loading / Offline / Countdown */
              <div className="relative w-full aspect-video bg-[#080808] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center group">
                  {streamData?.thumbnail && (
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-20 grayscale transition-all duration-1000 group-hover:scale-100 group-hover:blur-sm group-hover:opacity-40" style={{ backgroundImage: `url('${streamData.thumbnail}')` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                    </div>
                  )}
                  
                  <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                    {error === 'OFFLINE' || !countdown ? (
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
                          <span className="text-4xl grayscale opacity-30">📡</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-500 tracking-tighter uppercase">Signal Offline</h2>
                        <p className="text-gray-600 font-medium max-w-xs mx-auto text-sm">Belum ada siaran aktif saat ini. Silakan pantau sosial media kami untuk jadwal terbaru.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <span className="px-4 py-1.5 rounded-full border border-yellow-500/30 text-yellow-500 text-[10px] font-black tracking-[0.3em] uppercase bg-yellow-500/5 backdrop-blur-md">
                            Up Next Broadcast
                          </span>
                          <h2 className="text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                            {streamData?.title}
                          </h2>
                        </div>
                        <div className="py-4">
                          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Countdown to Live</p>
                          <div className="text-5xl md:text-9xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_10px_20px_rgba(0,0,0,1)]">
                            {countdown}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* KOLOM KANAN: Live Chat (Span 1) */}
          <div className="lg:col-span-1 h-[500px] lg:h-auto min-h-[450px] animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl h-full flex flex-col overflow-hidden shadow-2xl">
               <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Interaction</span>
                  </div>
                  <Icons.Message />
               </div>
               
               {youtubeIdForChat ? (
                 <iframe 
                    src={`https://www.youtube.com/live_chat?v=${youtubeIdForChat}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : ''}`}
                    className="w-full flex-1"
                    frameBorder="0"
                 ></iframe>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-gray-600 bg-gradient-to-b from-transparent to-black/20">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 rotate-3 border border-white/5">
                      <span className="text-2xl italic font-black text-gray-800">!</span>
                    </div>
                    <p className="text-xs uppercase font-black tracking-widest text-gray-500 mb-2">Chat Unavailable</p>
                    <p className="text-[10px] leading-relaxed opacity-50 font-medium">
                      Fitur chat hanya tersedia untuk sumber siaran YouTube. 
                      Server saat ini menggunakan jalur transmisi data alternatif.
                    </p>
                 </div>
               )}
            </div>
          </div>

        </div>
      </main>
      
      {/* --- FOOTER --- */}
      <footer className="p-12 text-center">
         <div className="h-[1px] w-32 bg-yellow-500/20 mx-auto mb-8"></div>
         <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.6em] opacity-40">
            Realtime48 &bull; Premium Digital Experience &bull; 2026
         </p>
      </footer>
    </div>
  );
}