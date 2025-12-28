'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

// --- KONFIGURASI IMPORT AMAN ---
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!videojs.getPlugin('qualityLevels')) require('videojs-contrib-quality-levels');
}

// --- HELPER: CUSTOM MENU BUTTON ---
const registerQualityMenu = () => {
  if (typeof window === 'undefined') return;

  const MenuButton = videojs.getComponent('MenuButton') as any;
  const MenuItem = videojs.getComponent('MenuItem') as any;

  if (videojs.getComponent('QualityMenuButton')) return;

  class QualityMenuItem extends MenuItem {
    constructor(player: any, options: any) {
      super(player, { ...options, selectable: true });
    }

    handleClick() {
      const targetValue = this.options_.value; 
      // @ts-ignore
      const menuParent = this.parentComponent_; 
      if (menuParent && menuParent.children_) {
        menuParent.children().forEach((child: any) => {
           if (child !== this) child.selected(false);
        });
      }
      this.selected(true);

      // @ts-ignore
      const qualityLevels = this.player().qualityLevels ? this.player().qualityLevels() : null;

      // Logika HLS Native
      if (qualityLevels && qualityLevels.length > 0) {
        for (let i = 0; i < qualityLevels.length; i++) {
          const lvl = qualityLevels[i];
          if (targetValue === 'auto') {
             lvl.enabled = true;
          } else {
             const label = lvl.height ? (lvl.height + 'p') : '';
             lvl.enabled = (label === targetValue);
          }
        }
      }
      
      // Callback Keluar (Untuk YouTube / Manual Switch)
      if (this.options_.callback) this.options_.callback(targetValue, true);
    }
  }

  class QualityMenuButton extends MenuButton {
    constructor(player: any, options: any) {
      super(player, options);
      this.addClass('vjs-quality-menu-button');
      (this as any).controlText('Quality');
    }

    createEl() {
      const el = super.createEl('button', {
        className: 'vjs-menu-button vjs-menu-button-popup vjs-control vjs-button vjs-quality-menu-button',
      });
      el.innerHTML = `
        <div class="vjs-quality-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
             <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.016.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00.432 2.385l.922 1.597a1.875 1.875 0 002.282.819l1.019-.393c.115-.044.283-.032.45.083a7.49 7.49 0 00.986.57c.182.088.277.228.297.348l.177 1.072c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.177-1.072c.02-.12.115-.26.297-.348.325-.157.639-.345.937-.562.166-.115.334-.126.45-.083l1.019.393a1.875 1.875 0 002.282-.819l.922-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.841-.692a1.875 1.875 0 00.432-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.819l-1.019.393c-.115.044-.283.032-.45-.083-.298-.217-.612-.405-.937-.562-.182-.088-.277-.228-.297-.348l-.177-1.072c-.151-.904-.933-1.567-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
          </svg>
        </div>
      `;
      return el;
    }

    createItems() {
      // @ts-ignore
      const list = this.options_.qualities || [];
      // @ts-ignore
      return list.map((q: any) => {
        return new QualityMenuItem(this.player(), {
          label: q.label,
          value: q.val,
          // @ts-ignore
          callback: this.options_.onQualityChange,
          // @ts-ignore
          selected: q.val === this.options_.currentQuality,
        });
      });
    }
  }

  videojs.registerComponent('QualityMenuButton', QualityMenuButton as any);
};

interface VideoPlayerProps {
  options: {
    autoplay: boolean;
    controls: boolean;
    responsive: boolean;
    fluid: boolean;
    techOrder?: string[];
    sources: { src: string; type: string }[];
    youtube?: any;
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
  const currentSrcRef = useRef<string | null>(null);

  const [hasStarted, setHasStarted] = useState(startTime > 0);
  const [detectedLevels, setDetectedLevels] = useState<{ label: string; val: string }[]>([]);

  // Deteksi Source
  const isYoutubeSource = options.sources?.[0]?.type === 'video/youtube';
  
  const finalOptions = {
    ...options,
    // KITA PAKSA TRUE AGAR PAKE CONTROLS BAWAAN VIDEOJS (BUKAN YOUTUBE)
    controls: true, 
    techOrder: ['html5', 'youtube'],
    bigPlayButton: false, // Kita pake overlay start sendiri
    html5: {
      vhs: { overrideNative: true }, 
      nativeAudioTracks: false,
      nativeVideoTracks: false,
    },
    plugins: { qualityLevels: {} },
    youtube: {
      ytControls: 0, // MATIKAN KONTROL BAWAAN YOUTUBE
      modestbranding: 1, // Minimal branding
      iv_load_policy: 3, // Hilangkan anotasi
      rel: 0,
      playsinline: 1,
      disablekb: 1, // Disable keyboard youtube (biar videojs yang handle)
      ...options.youtube,
    },
  };

  // --- LOGIKA PLAY/PAUSE MANUAL (UNTUK SHIELD) ---
  const handleOverlayClick = (e: React.MouseEvent) => {
     // Mencegah klik tembus ke iframe (walaupun pointer-events:none udah handle, ini double protection)
     e.preventDefault();
     e.stopPropagation();

     if (playerRef.current) {
        if (playerRef.current.paused()) {
           playerRef.current.play();
        } else {
           playerRef.current.pause();
        }
        // Pastikan control bar muncul saat di tap (User Active)
        playerRef.current.userActive(true);
     }
  };

  useEffect(() => {
    registerQualityMenu();

    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      
      // Tambahkan class khusus untuk YouTube Mode
      if (isYoutubeSource) videoElement.classList.add('vjs-youtube-safe-mode');
      else videoElement.classList.add('vjs-idn-fix');

      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, finalOptions));
      
      if (options.sources && options.sources[0]) {
          currentSrcRef.current = options.sources[0].src;
      }

      // --- AUTO DETECT RESOLUSI (KHUSUS HLS) ---
      player.ready(() => {
         // @ts-ignore
         const qLevels = player.qualityLevels();
         if(qLevels && !isYoutubeSource) {
             const updateLevels = () => {
                 const detected: {label:string, val:string}[] = [];
                 for(let i=0; i<qLevels.length; i++) {
                     if(qLevels[i].height) {
                         const lbl = qLevels[i].height + 'p';
                         if (!detected.some(d => d.val === lbl)) detected.push({ label: lbl, val: lbl });
                     }
                 }
                 if(detected.length > 0) {
                     detected.sort((a, b) => parseInt(b.val) - parseInt(a.val));
                     detected.unshift({ label: 'Auto', val: 'auto' });
                     setDetectedLevels(prev => (JSON.stringify(prev) !== JSON.stringify(detected)) ? detected : prev); 
                 }
             };
             qLevels.on('addqualitylevel', () => {
                 // @ts-ignore
                 if(window.hlsTimeout) clearTimeout(window.hlsTimeout);
                 // @ts-ignore
                 window.hlsTimeout = setTimeout(updateLevels, 500);
             });
         }
      });

      player.on('play', () => setHasStarted(true));
      player.on('playing', () => setHasStarted(true));
      player.on('timeupdate', () => {
        if (onTimeUpdate) {
          const time = player.currentTime();
          if (typeof time === 'number') onTimeUpdate(time);
        }
      });

      if (startTime > 0) {
        setHasStarted(true);
        player.ready(() => {
            player.currentTime(startTime);
            player.play();
        });
      }

    } else if (playerRef.current) {
      const player = playerRef.current;
      const newSrc = options.sources?.[0]?.src;
      
      // Update Source
      if (newSrc && newSrc !== currentSrcRef.current) {
          player.src(options.sources);
          currentSrcRef.current = newSrc;
          setDetectedLevels([]);
      }

      // Toggle Mode Class
      if (isYoutubeSource) {
        player.addClass('vjs-youtube-safe-mode');
        player.removeClass('vjs-idn-fix');
      } else {
        player.removeClass('vjs-youtube-safe-mode');
        player.addClass('vjs-idn-fix');
      }

      // RENDER QUALITY MENU (Untuk SEMUA Tipe, Termasuk YouTube)
      // Kita hapus batasan !isYoutubeSource agar tombol gear muncul di YT juga
      const controlBar = (player as any).controlBar;
      if (controlBar) {
          if (controlBar.getChild('QualityMenuButton')) controlBar.removeChild('QualityMenuButton');
          
          // Gunakan 'qualities' dari props (manual YT list) atau detected (HLS)
          const qualitiesToRender = qualities && qualities.length > 0 ? qualities : detectedLevels;
          
          if (qualitiesToRender && qualitiesToRender.length > 0) {
              let insertIndex = controlBar.children_.length - 1;
              const fullscreenToggle = controlBar.getChild('FullscreenToggle');
              // Taruh sebelah kiri Fullscreen button
              if (fullscreenToggle) {
                  const fsIndex = controlBar.children_.indexOf(fullscreenToggle);
                  if (fsIndex > -1) insertIndex = fsIndex;
              }
              controlBar.addChild(
                  'QualityMenuButton',
                  {
                      qualities: qualitiesToRender,
                      currentQuality: currentQuality,
                      onQualityChange,
                  },
                  insertIndex,
              );
          }
      }
    }
  }, [options, isYoutubeSource, qualities, currentQuality, detectedLevels]);

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-black group select-none">
      
      {/* --- START SCREEN (POSTER) --- */}
      {!hasStarted && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 cursor-pointer"
          onClick={() => { if (playerRef.current) playerRef.current.play(); }}
        >
          {poster && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url('${poster}')` }}
            />
          )}
          <div className="relative z-10 flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-10 h-10 ml-1">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="mt-4 text-xs text-white/80 font-bold tracking-[0.2em] uppercase text-shadow">Tap to Start Stream</p>
          </div>
        </div>
      )}

      {/* --- INVISIBLE SHIELD (THE MAGIC LAYER) --- */}
      {/* Layer ini berada di Z-Index 10 (Di atas Iframe, Di bawah Control Bar) */}
      {/* Meng-handle Play/Pause saat area video diklik */}
      {/* Mencegah klik tembus ke elemen YouTube di dalamnya */}
      {isYoutubeSource && hasStarted && (
          <div 
             className="absolute inset-0 z-10 w-full h-full cursor-pointer bg-transparent"
             onClick={handleOverlayClick}
             onContextMenu={(e) => e.preventDefault()} // Disable Right Click
          ></div>
      )}

      {/* --- VIDEO CONTAINER --- */}
      <div ref={videoRef} className="w-full h-full relative z-0" />

      <style jsx global>{`
        /* --- STYLE KHUSUS YOUTUBE SHIELDING (MANIPULASI TINGKAT TINGGI) --- */
        
        /* 1. Matikan Pointer Events di Iframe YouTube */
        /* Ini kuncinya: Iframe jadi "hantu", tidak bisa diklik sama sekali */
        .video-js.vjs-youtube-safe-mode .vjs-tech { 
          pointer-events: none !important; 
          object-fit: contain !important;
        }

        /* 2. Pastikan Control Bar Tetap Bisa Diklik & Berada di Atas Shield */
        .video-js.vjs-youtube-safe-mode .vjs-control-bar {
            z-index: 20 !important; /* Di atas Shield (z-10) */
            pointer-events: auto !important; /* Hidupkan kembali pointer */
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            visibility: visible;
        }

        /* 3. Styling Umum Video.js */
        .video-js.vjs-idn-fix .vjs-tech { object-fit: contain !important; background-color: #000; }
        
        .vjs-quality-menu-button {
          width: 44px !important; height: 100% !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          cursor: pointer !important; margin-left: 4px !important; 
        }
        .vjs-quality-icon-container svg {
          width: 22px !important; height: 22px !important; fill: white !important;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)); transition: transform 0.2s;
        }
        .vjs-quality-menu-button:hover svg { transform: rotate(45deg); fill: #eab308 !important; }
        .vjs-menu-content {
          background: rgba(0, 0, 0, 0.9) !important; border-radius: 8px; overflow: hidden;
          bottom: 4em !important; width: 120px !important;
          z-index: 100 !important;
        }
        .vjs-menu-item { text-transform: capitalize; padding: 8px 12px; background-color: transparent; color: white; }
        .vjs-menu-item:hover, .vjs-selected { background-color: rgba(255, 255, 255, 0.1); color: #eab308 !important; }
        
        .video-js .vjs-big-play-button, .vjs-loading-spinner { display: none !important; }
        .vjs-quality-selector { display: none !important; }
        
        /* Animasi Control Bar */
        .video-js.vjs-user-active .vjs-control-bar,
        .video-js.vjs-paused .vjs-control-bar {
            opacity: 1 !important; visibility: visible !important; transition: opacity 0.3s ease;
        }
        .video-js .vjs-control-bar { opacity: 0; transition: opacity 0.5s ease; }

        /* Sembunyikan elemen tidak perlu di control bar */
        .vjs-picture-in-picture-control { display: none !important; }
      `}</style>
    </div>
  );
};

export default VideoPlayer;