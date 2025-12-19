'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer'; 
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client'; 
import { getBackendUrl } from '@/lib/config'; 

const Icons = {
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Crown: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
};

// Opsi kualitas manual untuk YouTube
const YT_QUALITIES = [
    { label: '1080p', val: 'hd1080' },
    { label: '720p', val: 'hd720' },
    { label: '480p', val: 'large' },
    { label: '360p', val: 'medium' },
    { label: 'Auto', val: 'auto' }
];

export default function DashboardPage() {
  const { token, logout, isLoading, role } = useAuth(); 
  const router = useRouter();
  
  // State Player
  const [baseStreamUrl, setBaseStreamUrl] = useState<string | null>(null);
  const [finalStreamUrl, setFinalStreamUrl] = useState<string | null>(null);
  const [streamType, setStreamType] = useState<string>('video/youtube');
  const [streamTitle, setStreamTitle] = useState('');
  const [bgImage, setBgImage] = useState(''); 
  const [error, setError] = useState('');
  
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [streamQualities, setStreamQualities] = useState<{label:string, val:string}[]>([]);
  
  const [resumeTime, setResumeTime] = useState(0); 
  const currentTimeRef = useRef(0);

  const [countdown, setCountdown] = useState('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); 
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setDaysLeft(data.daysLeft); setUserEmail(data.email); }
    } catch (err) { console.error(err); }
  };

  const handleTimeUpdate = (time: number) => {
      currentTimeRef.current = time;
  };

  const onQualityChange = (qVal: string, isInternalSwitch = false) => {
      setCurrentQuality(qVal);
      
      // JIKA INI HLS/M3U8 ATAU INTERNAL SWITCH, KITA BERHENTI. JANGAN RELOAD URL!
      if (streamType === 'application/x-mpegURL' || (finalStreamUrl && finalStreamUrl.includes('.m3u8'))) {
          console.log("[PAGE] Internal HLS Quality Switch detected. No Reload.");
          return; 
      }

      if (isInternalSwitch) return;
      if (!baseStreamUrl) return;
      
      setResumeTime(currentTimeRef.current);
      setFinalStreamUrl(null); 
      
      const separator = baseStreamUrl.includes('?') ? '&' : '?';
      const newUrl = `${baseStreamUrl}${separator}vq=${qVal}`;
      
      setTimeout(() => {
          setFinalStreamUrl(newUrl);
      }, 50); 
  };

  const fetchStreamData = async () => {
    if (!token) return; 
    try {
      const res = await fetch(`${backendUrl}/api/v1/stream/current`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();

      if (!res.ok) throw new Error('OFFLINE');

      setError(''); setStreamTitle(data.title); setBgImage(data.thumbnail);
      
      if (data.qualities && Array.isArray(data.qualities) && data.qualities.length > 0) {
          const formatted = data.qualities.map((q: any) => ({ label: q.label, val: q.label }));
          formatted.unshift({ label: 'Auto', val: 'auto' });
          setStreamQualities(formatted);
      } else {
          setStreamQualities([]);
      }

      const startTime = new Date(data.start_time);
      const now = new Date();

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      if (now >= startTime) {
          // STREAMING MODE
          if (data.stream_source === 'youtube') {
             const ytRes = await fetch(`${backendUrl}/api/v1/stream/youtube-direct?url=${encodeURIComponent(data.custom_url)}`);
             const ytData = await ytRes.json();
             
             if (ytData.videoId) {
                 const ytUrl = `https://www.youtube.com/watch?v=${ytData.videoId}`;
                 setBaseStreamUrl(ytUrl);
                 setFinalStreamUrl(ytUrl); 
                 setStreamType('video/youtube');
                 setStreamQualities(YT_QUALITIES); 
             } else {
                 setError('Link Error');
             }

          } else if (data.stream_source === 'external') {
             setBaseStreamUrl(data.custom_url);
             setFinalStreamUrl(data.custom_url);
             // PASTIKAN INI ADALAH MPEGURL
             setStreamType('application/x-mpegURL'); 
          } else {
             // Internal
             const hlsUrl = `${backendUrl}/hls/${data.stream_key}/master.m3u8`;
             setBaseStreamUrl(hlsUrl);
             setFinalStreamUrl(hlsUrl);
             setStreamType('application/x-mpegURL');
             setStreamQualities([]); 
          }
          setCountdown('');
      } else {
        setFinalStreamUrl(null);
        startCountdown(startTime);
      }

    } catch (err: any) {
      setFinalStreamUrl(null); 
      setStreamTitle('Menunggu Siaran'); 
      setCountdown(''); 
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
  }, [isLoading, token]); 

  const handleLogout = async () => {
      await logout(); 
      router.push('/login'); 
  };

  const videoJsOptions = finalStreamUrl ? {
    autoplay: true, controls: true, responsive: true, fluid: true,
    sources: [{ src: finalStreamUrl, type: streamType }],
  } : null;

  if (isLoading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-yellow-500/30 flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 flex justify-between items-start md:items-center bg-gradient-to-b from-black/90 via-black/80 to-transparent">
        <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold tracking-widest text-yellow-500 drop-shadow-lg cursor-default">REALTIME48</h1>
            {daysLeft !== null && (
                <div className="md:hidden mt-1 flex items-center gap-1 text-[10px] font-bold text-yellow-400 opacity-90">
                   <span className="scale-75"><Icons.Crown /></span>
                   <span className="tracking-wide">{daysLeft} DAYS LEFT</span>
                </div>
            )}
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {daysLeft !== null && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-xs font-bold text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)] backdrop-blur-md whitespace-nowrap">
              <Icons.Crown />
              <span>{daysLeft} DAYS</span>
            </div>
          )}
          {role === 'ADMIN' && (<button onClick={() => router.push('/admin')} className="hidden sm:block text-xs text-yellow-500 hover:text-white hover:underline transition-colors">ADMIN PANEL</button>)}
          
          <button onClick={handleLogout} className="p-2 rounded-full bg-white/5 hover:bg-red-900/80 text-gray-400 hover:text-white transition-all border border-transparent hover:border-red-500/30 cursor-pointer active:scale-95" title="Logout">
              <Icons.Logout />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative p-4 md:p-12 mt-16 md:mt-0">
        <div className="w-full max-w-5xl relative z-10">
          {finalStreamUrl && videoJsOptions ? (
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-700">
               <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black group">
                  <div className="relative z-10 aspect-video">
                      <VideoPlayer 
                          key={finalStreamUrl} 
                          options={videoJsOptions} 
                          poster={bgImage} 
                          qualities={streamQualities}
                          currentQuality={currentQuality}
                          onQualityChange={onQualityChange}
                          startTime={resumeTime} 
                          onTimeUpdate={handleTimeUpdate} 
                      />
                  </div>
               </div>
               <div className="flex items-start justify-between gap-4">
                  <div>
                      <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">{streamTitle}</h2>
                      <div className="flex items-center gap-3 mt-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><p className="text-sm text-gray-400 font-medium">LIVE BROADCAST</p></div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="relative w-full aspect-video bg-[#080808] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                {bgImage && (<div className="absolute inset-0 z-0"><div className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-60 transition-all duration-1000" style={{ backgroundImage: `url('${bgImage}')` }}></div><div className="absolute inset-0 bg-black/40"></div><div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#000_120%)]"></div></div>)}
                <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                   {error === 'OFFLINE' || !countdown ? (
                      <div className="space-y-4"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-sm"><span className="text-3xl grayscale opacity-50">📡</span></div><h2 className="text-3xl font-bold text-gray-400 tracking-widest uppercase drop-shadow-md">Signal Offline</h2><p className="text-gray-500">Belum ada jadwal aktif. Silakan cek kembali nanti.</p></div>
                   ) : (
                      <><div className="space-y-2"><span className="px-3 py-1 rounded border border-yellow-500/50 text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase bg-black/50 backdrop-blur-md">Up Next</span><h2 className="text-2xl md:text-5xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight">{streamTitle}</h2></div><div className="py-8"><p className="text-gray-300 text-sm uppercase tracking-widest mb-4 drop-shadow-md">Broadcast Begins In</p><div className="text-4xl md:text-8xl font-mono font-light text-white tracking-tighter tabular-nums drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">{countdown}</div></div></>
                   )}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}