'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer'; 
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client'; 
import { getBackendUrl } from '@/lib/config'; 

const Icons = {
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>,
  Film: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="7" x2="7" y1="3" y2="21"/><line x1="17" x2="17" y1="3" y2="21"/><line x1="3" x2="21" y1="12" y2="12"/></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

export default function DashboardPage() {
  const { token, logout, isLoading, role } = useAuth(); 
  const router = useRouter();
  
  const [streamData, setStreamData] = useState<any>(null);
  const [activeSourceIdx, setActiveSourceIdx] = useState(0);
  const [error, setError] = useState('');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); 

  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (!isLoading && !token) router.push('/login');
  }, [isLoading, token, router]);

  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setDaysLeft(data.daysLeft);
    } catch (err) { console.error(err); }
  };

  const fetchStreamData = async () => {
    if (!token) return; 
    try {
      const res = await fetch(`${backendUrl}/api/v1/stream/current`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error('OFFLINE');
      setStreamData(data);
      setError('');
      const startTime = new Date(data.start_time);
      const now = new Date();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (now < startTime) startCountdown(startTime); else setCountdown('');
    } catch (err: any) {
      setStreamData(null); 
      setError(err.message === 'OFFLINE' ? 'OFFLINE' : err.message);
    }
  };

  const startCountdown = (targetTime: Date) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetTime.getTime() - now;
      if (distance < 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(''); fetchStreamData(); return;
      }
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      const fmt = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${hours > 0 ? hours + ':' : ''}${fmt(minutes)}:${fmt(seconds)}`);
    };
    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000); 
  };
  
  useEffect(() => {
    if (!isLoading && token) {
      fetchUserData(); fetchStreamData();
      const socket: Socket = io(backendUrl);
      socket.on('SCHEDULE_UPDATED', () => fetchStreamData());
      return () => { 
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 
        socket.disconnect(); 
      };
    }
  }, [isLoading, token, backendUrl]); 

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeIdForChat = getYoutubeId(streamData?.sources?.[activeSourceIdx]?.url || '');

  if (isLoading) return <div className="h-screen bg-black" />;

  return (
    <div className="h-screen max-h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
      {/* --- HEADER --- */}
      <header className="h-14 px-4 md:px-6 flex justify-between items-center bg-black/80 backdrop-blur-xl border-b border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-4">
            <h1 className="text-base font-black tracking-tighter text-yellow-500 uppercase">Realtime<span className="text-white">48</span></h1>
            {daysLeft !== null && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-black text-yellow-500 tracking-widest uppercase">
                   <Icons.Crown /> {daysLeft} Days Access
                </div>
            )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <a href="http://inforealtime48.my.id/ReplayMembership.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black text-gray-300 transition-all uppercase tracking-widest">
            <Icons.Film /> <span className="hidden sm:inline">Replay</span>
          </a>
          {role === 'ADMIN' && (
            <button onClick={() => router.push('/admin')} className="hidden md:block text-[9px] font-black text-gray-500 hover:text-yellow-500 uppercase tracking-widest transition-colors">Admin</button>
          )}
          <button onClick={logout} className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 transition-all border border-white/5 active:scale-95">
              <Icons.Logout />
          </button>
        </div>
      </header>

      {/* --- VIEWPORT CONTAINER --- */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 md:p-3 lg:p-4">
        <div className="w-full max-w-[1750px] h-full flex flex-col lg:flex-row gap-3 lg:items-stretch">
          
          {/* KOLOM PLAYER (LEFT) */}
          <div className="flex-[2.8] flex flex-col gap-3 min-h-0 h-full">
            {streamData && !countdown ? (
              <>
                <div className="flex-1 min-h-0 relative bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                  <VideoPlayer 
                    sources={streamData.sources || []} 
                    activeSourceIndex={activeSourceIdx}
                    onSwitchSource={(idx) => setActiveSourceIdx(idx)}
                    poster={streamData.thumbnail}
                  />
                </div>
                
                {/* INFO BAR: Judul Sejajar dengan Selector Server */}
                <div className="h-[60px] shrink-0 bg-[#0a0a0a] px-5 flex items-center justify-between rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/60"></div>
                  
                  {/* Bagian Kiri: Judul & Status */}
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <h2 className="text-sm md:text-base font-black text-white uppercase truncate max-w-[200px] md:max-w-md">{streamData.title}</h2>
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-1 w-1"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative rounded-full h-1 w-1 bg-red-500"></span></span>
                       <span className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase tracking-widest">Live Transmitting</span>
                    </div>
                  </div>

                  {/* Bagian Kanan: Selector Server (Sesuai Coretan Merah Lu) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar ml-4">
                    {streamData.sources?.map((src: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSourceIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black transition-all border uppercase tracking-widest whitespace-nowrap ${
                          activeSourceIdx === idx 
                            ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                        }`}
                      >
                        {src.name || `Server ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 relative bg-[#080808] rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                  {streamData?.thumbnail && <div className="absolute inset-0 z-0 bg-cover bg-center blur-3xl opacity-10 grayscale" style={{ backgroundImage: `url('${streamData.thumbnail}')` }}></div>}
                  <div className="relative z-10 space-y-4">
                    {error === 'OFFLINE' || !countdown ? (
                      <div className="flex flex-col items-center"><div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4"><span className="grayscale opacity-30 text-xl">📡</span></div><h2 className="text-xl font-black text-gray-700 uppercase tracking-tighter">Signal Offline</h2></div>
                    ) : (
                      <div className="space-y-4">
                        <span className="px-3 py-1 rounded-full border border-yellow-500/20 text-yellow-500 text-[8px] font-black tracking-widest uppercase bg-yellow-500/5">Up Next</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight">{streamData?.title}</h2>
                        <div className="text-4xl md:text-7xl font-mono font-black text-white tracking-tighter tabular-nums pt-4">{countdown}</div>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* KOLOM CHAT (RIGHT) */}
          <div className="flex-1 lg:h-full min-h-[400px] lg:min-h-0 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl">
               <div className="h-11 shrink-0 px-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Interaction</span>
                  </div>
                  <Icons.Message />
               </div>
               
               <div className="flex-1 relative bg-black/20">
                  {youtubeIdForChat ? (
                    <iframe 
                        src={`https://www.youtube.com/live_chat?v=${youtubeIdForChat}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : ''}`}
                        className="absolute inset-0 w-full h-full border-0"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 grayscale opacity-20">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center mb-3 border border-white/5"><span className="text-lg italic font-black">!</span></div>
                        <p className="text-[8px] uppercase font-black tracking-widest">Chat Offline</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </main>
      
      <footer className="h-6 flex items-center justify-center shrink-0">
         <p className="text-[6px] text-gray-700 font-black uppercase tracking-[1em] opacity-40">Realtime48 &bull; 2026</p>
      </footer>
    </div>
  );
}