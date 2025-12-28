'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube'; // Plugin Wajib buat Skin YouTube

interface VideoPlayerProps {
  options: any;
  poster?: string;
  onTimeUpdate?: (time: number) => void;
  startTime?: number;
  qualities?: { label: string, val: string }[];
  currentQuality?: string;
  onQualityChange?: (val: string, isInternal: boolean) => void;
}

export default function VideoPlayer({ 
  options, 
  poster, 
  onTimeUpdate, 
  startTime, 
  qualities = [], 
  currentQuality, 
  onQualityChange 
}: VideoPlayerProps) {
  
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!playerRef.current) {
      // Create Element Video secara manual agar kompatibel dengan React Strict Mode
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-forest'); 
      
      // Append ke container ref
      videoRef.current?.appendChild(videoElement);

      // KONFIGURASI MAGIC: YouTube dalam Skin Video.js
      const finalOptions = {
        ...options,
        // Pakai 'youtube' tech, baru html5
        techOrder: ['youtube', 'html5'], 
        
        // Settingan YouTube buat ngilangin branding (sebisa mungkin)
        youtube: {
          ytControls: 0, // PENTING: Hide kontrol asli YT, ganti kontrol kita
          modestbranding: 1, // Logo YT diminimalkan
          rel: 0, // Jangan muncul video related dari channel lain
          iv_load_policy: 3, // Hide anotasi
          disablekb: 1, // Disable keyboard YT (biar handle pake player kita)
          customVars: { 
             wmode: 'transparent',
             playsinline: 1,
             origin: typeof window !== 'undefined' ? window.location.origin : '' 
          }
        },
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: true,
      };

      const player = playerRef.current = videojs(videoElement, finalOptions, () => {
        if (startTime) player.currentTime(startTime);
      });

      // FIX ERROR TYPESCRIPT DI SINI
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        // Kita pastikan kalau hasilnya number baru dikirim, kalau undefined kasih 0
        if (onTimeUpdate) {
            onTimeUpdate(typeof currentTime === 'number' ? currentTime : 0);
        }
      });

    } else {
      // Update Player jika props berubah
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
      if (poster) player.poster(poster);
    }
  }, [options, videoRef]);

  // Cleanup saat unmount
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div className="relative group">
      {/* Container Video.js */}
      <div data-vjs-player>
        <div ref={videoRef} className="rounded-xl overflow-hidden shadow-2xl" />
      </div>

      {/* QUALITY SELECTOR 
         Kalau YouTube, selector ini disembunyikan/di-disable 
         karena YouTube atur resolusi 'Auto' sendiri.
         Kecuali kalau pakai stream internal/m3u8 baru muncul.
      */}
      {qualities.length > 0 && options.sources[0].type !== 'video/youtube' && (
          <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="relative">
                 <select 
                   value={currentQuality}
                   onChange={(e) => onQualityChange && onQualityChange(e.target.value, options.sources[0].type === 'application/x-mpegURL')}
                   className="appearance-none bg-black/80 text-white text-xs font-bold border border-white/20 rounded px-3 py-1.5 pr-8 hover:bg-yellow-500/20 hover:border-yellow-500 cursor-pointer outline-none backdrop-blur-md"
                 >
                    {qualities.map((q, idx) => (
                        <option key={idx} value={q.val} className="bg-black text-white">{q.label}</option>
                    ))}
                 </select>
                 <div className="absolute right-2 top-1.5 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                 </div>
             </div>
          </div>
      )}
      
      {/* Indikator AUTO Resolution khusus YouTube (Opsional, buat gaya doang) */}
      {options.sources[0].type === 'video/youtube' && (
           <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="bg-black/60 backdrop-blur text-white/70 text-[10px] px-2 py-1 rounded border border-white/10">
                 AUTO HD
              </span>
           </div>
      )}
    </div>
  );
}