'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube'; 

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
  const [isPlaying, setIsPlaying] = useState(false);

  // Cek apakah ini mode YouTube
  const isYoutube = options.sources[0]?.type === 'video/youtube';

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-forest');
      
      // HACK: Tambah class khusus biar bisa kita target CSS-nya
      if(isYoutube) videoElement.classList.add('vjs-youtube-hack'); 
      
      videoRef.current?.appendChild(videoElement);

      const finalOptions = {
        ...options,
        techOrder: ['youtube', 'html5'], 
        youtube: {
          ytControls: 0, 
          modestbranding: 1, 
          rel: 0, 
          iv_load_policy: 3, 
          disablekb: 1, 
          customVars: { 
             wmode: 'transparent',
             playsinline: 1,
             controls: 0,
             showinfo: 0,
             origin: typeof window !== 'undefined' ? window.location.origin : '' 
          }
        },
        controls: true, // Kita pake kontrol Video.js, bukan YouTube
        autoplay: true,
        preload: 'auto',
        fluid: true,
      };

      const player = playerRef.current = videojs(videoElement, finalOptions, () => {
        if (startTime) player.currentTime(startTime);
      });

      player.on('timeupdate', () => {
        if (onTimeUpdate) {
            const time = player.currentTime();
            onTimeUpdate(typeof time === 'number' ? time : 0);
        }
      });

      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));

    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
      if (poster) player.poster(poster);
    }
  }, [options, videoRef, isYoutube]);

  // Handle Destroy
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  // Handle Manual Play/Pause via Shield
  const togglePlay = () => {
      if(playerRef.current) {
          if(playerRef.current.paused()) playerRef.current.play();
          else playerRef.current.pause();
      }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-black">
      
      {/* CSS INJECTION KHUSUS YOUTUBE 
        Ini yang bikin videonya nge-zoom (Scale 1.25) biar logonya kepotong keluar.
        pointer-events: none di iframe biar user gabisa klik 'Watch on YouTube'.
      */}
      {isYoutube && (
        <style jsx global>{`
          .vjs-youtube-hack .vjs-tech {
            transform: scale(1.25); /* Zoom in 125% - Logo YouTube Kelempar Keluar */
            transform-origin: center center;
            pointer-events: none; /* Disable Klik langsung ke YouTube */
          }
          /* Fix Control Bar biar gak ikut ke-zoom/ilang */
          .vjs-youtube-hack .vjs-control-bar {
            z-index: 50; 
            bottom: 0;
            background: rgba(0,0,0,0.8);
          }
        `}</style>
      )}

      {/* CLICK SHIELD (Lapisan Bening) 
          Ini buat nangkep klik user biar jadi Play/Pause, 
          bukan malah ngeklik logo YouTube yg tembus.
      */}
      {isYoutube && (
        <div 
           onClick={togglePlay}
           className="absolute inset-0 z-10 cursor-pointer"
           style={{ bottom: '3em' }} // Sisain ruang buat control bar di bawah
        />
      )}

      <div data-vjs-player>
        <div ref={videoRef} className="w-full h-full" />
      </div>

      {/* Quality Selector (Cuma muncul kalo bukan YouTube) */}
      {qualities.length > 0 && !isYoutube && (
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
             </div>
          </div>
      )}
      
      {/* Label Clean Mode */}
      {isYoutube && (
           <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="bg-black/60 backdrop-blur text-white/70 text-[10px] px-2 py-1 rounded border border-white/10 tracking-widest">
                 HD CINEMA
              </span>
           </div>
      )}
    </div>
  );
}