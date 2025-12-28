'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// --- CONFIG VIDEO.JS (HANYA UNTUK HLS/INTERNAL) ---
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!videojs.getPlugin('qualityLevels')) require('videojs-contrib-quality-levels');
  // @ts-ignore
  if (!videojs.getPlugin('hlsQualitySelector')) require('videojs-hls-quality-selector');
}

interface VideoPlayerProps {
  options: {
    autoplay: boolean;
    controls: boolean;
    responsive: boolean;
    fluid: boolean;
    sources: { src: string; type: string }[];
  };
  poster?: string;
  qualities?: { label: string; val: string }[];
  currentQuality?: string;
  onQualityChange?: (val: string, isInternalSwitch?: boolean) => void;
  startTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  poster,
  qualities,
  currentQuality,
  onQualityChange,
  startTime = 0,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isYoutube, setIsYoutube] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // --- DETEKSI SOURCE ---
  useEffect(() => {
    const src = options.sources?.[0]?.src;
    const type = options.sources?.[0]?.type;

    if (type === 'video/youtube' || (src && (src.includes('youtube.com') || src.includes('youtu.be')))) {
      setIsYoutube(true);
      
      let embedSrc = src;
      if (src.includes('watch?v=')) {
        embedSrc = src.replace('watch?v=', 'embed/');
      } else if (src.includes('youtu.be/')) {
        embedSrc = src.replace('youtu.be/', 'www.youtube.com/embed/');
      }
      
      const cleanUrl = embedSrc.split('?')[0];
      // PARAMETER SAKTI:
      setYtUrl(`${cleanUrl}?modestbranding=1&rel=0&controls=1&showinfo=0&disablekb=0&playsinline=1&enablejsapi=1&fs=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`);
      
    } else {
      setIsYoutube(false);
    }
  }, [options.sources]);

  // --- LOGIKA PEMAIN HLS (VIDEO.JS) ---
  useEffect(() => {
    if (isYoutube) return;

    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        ...options,
        html5: {
          vhs: { overrideNative: true },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
      }));

      player.on('timeupdate', () => {
        if (onTimeUpdate) {
            const currentTime = player.currentTime();
            onTimeUpdate(typeof currentTime === 'number' ? currentTime : 0);
        }
      });
      
      player.on('play', () => setHasStarted(true));

      if (startTime > 0) {
        player.ready(() => {
          player.currentTime(startTime);
          player.play();
        });
      }
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options, isYoutube, startTime, onTimeUpdate]);

  const handleStartYoutube = () => {
    setHasStarted(true);
  };

  // --- CUSTOM FULLSCREEN HANDLER DENGAN AUTO ROTATE ---
  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!containerRef.current) return;
    const elem = containerRef.current as any;

    try {
      if (!document.fullscreenElement) {
          // 1. MASUK FULLSCREEN
          if (elem.requestFullscreen) {
              await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
              await elem.webkitRequestFullscreen(); 
          } else if (elem.msRequestFullscreen) {
              await elem.msRequestFullscreen(); 
          }

          // 2. FORCE LANDSCAPE (ANDROID MAGIC)
          // Menggunakan 'as any' untuk bypass check TypeScript pada fitur eksperimental
          if (screen.orientation && (screen.orientation as any).lock) {
             try {
                 await (screen.orientation as any).lock('landscape');
             } catch (err) {
                 // Ignore error jika browser menolak
             }
          }

      } else {
          // 3. KELUAR FULLSCREEN
          if (document.exitFullscreen) {
              await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
          }

          // 4. BALIKIN ORIENTASI (UNLOCK)
          if (screen.orientation && (screen.orientation as any).unlock) {
             try {
                 (screen.orientation as any).unlock();
             } catch (e) {}
          }
      }
    } catch (err) {
      console.error("Fullscreen Error:", err);
    }
  };

  const stopEvent = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black group overflow-hidden rounded-xl">
      
      {isYoutube ? (
        <>
           {/* --- SHIELD SYSTEM --- */}
           {hasStarted && (
             <div className="absolute inset-0 z-[100] pointer-events-none">
                
                {/* 1. SHIELD KIRI ATAS (Mobile Channel & Title) */}
                <div 
                  className="absolute top-0 left-0 w-[70%] h-[80px] bg-transparent pointer-events-auto cursor-default"
                  onContextMenu={stopEvent} onClick={stopEvent}
                ></div>

                {/* 2. SHIELD KANAN ATAS (Desktop Share/WatchLater) */}
                {/* MODIFIED: Ditambahkan class 'shield-desktop-only' agar bisa di-handle CSS media query */}
                <div 
                  className="hidden md:block absolute top-0 right-0 w-[20%] h-[80px] bg-transparent pointer-events-auto cursor-default shield-desktop-only"
                  onContextMenu={stopEvent} onClick={stopEvent}
                ></div>

                {/* 3. SHIELD KIRI BAWAH (Mobile Copy Link) */}
                <div 
                  className="absolute bottom-0 left-0 w-[120px] h-[60px] bg-transparent pointer-events-auto cursor-default"
                  onContextMenu={stopEvent} onClick={stopEvent}
                ></div>

                {/* 4. SHIELD KANAN BAWAH (REMOVED - Gear Safe) */}
             </div>
           )}

           {/* IFRAME YOUTUBE */}
           {hasStarted ? (
             <div className="w-full h-full relative">
                <iframe
                  src={`${ytUrl}&autoplay=1`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen={false} 
                  sandbox="allow-scripts allow-same-origin allow-presentation" 
                ></iframe>

                {/* TOMBOL FULLSCREEN CUSTOM (REVISI VISIBILITAS & POSISI) */}
                {/* - bottom-2 right-2: Geser dikit biar gak mojok banget (hindari tumpang tindih)
                    - bg-black/50 rounded-full: Kasih background biar jelas
                    - opacity-100 md:opacity-0 md:group-hover:opacity-100: Mobile SELALU MUNCUL, Desktop muncul pas di-hover.
                    - z-[120]: Paling atas
                */}
                <button 
                    onClick={toggleFullscreen}
                    className="absolute bottom-2 right-2 z-[120] w-10 h-10 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-90 hover:scale-100"
                    title="Fullscreen & Rotate"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                </button>
             </div>
           ) : (
             <div 
               className="absolute inset-0 z-30 flex items-center justify-center bg-black cursor-pointer"
               onClick={handleStartYoutube}
             >
               {poster && (
                 <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${poster}')` }}></div>
               )}
               <div className="relative z-10 w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                   <path d="M8 5v14l11-7z"/>
                 </svg>
               </div>
             </div>
           )}
        </>
      ) : (
        // --- TAMPILAN HLS / INTERNAL ---
        <div className="w-full h-full relative">
            <div ref={videoRef} className="w-full h-full" />
             {!hasStarted && poster && (
                 <div className="absolute inset-0 z-10 bg-black bg-cover bg-center flex items-center justify-center cursor-pointer" 
                      style={{ backgroundImage: `url('${poster}')` }}
                      onClick={() => { if(playerRef.current) playerRef.current.play(); }}
                 >
                     <div className="w-16 h-16 bg-yellow-500/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                 </div>
             )}
        </div>
      )}

      <style jsx global>{`
        .video-js { width: 100%; height: 100%; }
        .vjs-tech { object-fit: contain; }
        .vjs-big-play-button { display: none !important; }

        /* --- GENIUS FIX FOR MOBILE LANDSCAPE --- */
        /* Logic: Jika device adalah layar sentuh (coarse pointer), 
           Maka shield kanan atas DIHILANGKAN, walaupun width layarnya masuk kategori desktop (md).
           Ini membuat Gear Icon di Mobile Landscape bisa dipencet, 
           tapi tombol Share di Desktop Mouse tetap terblokir. */
        @media (pointer: coarse) {
            .shield-desktop-only {
                display: none !important;
            }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;