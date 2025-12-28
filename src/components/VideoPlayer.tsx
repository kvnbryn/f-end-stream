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

// --- CONSTANTS ---
const YOUTUBE_QUALITY_MAP: { [key: string]: string } = {
  '1080p': 'hd1080',
  '720p': 'hd720',
  '480p': 'large',
  '360p': 'medium',
  '240p': 'small',
  'auto': 'default',
  'source': 'highres',
};

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
      const player = this.player();
      const targetValue = this.options_.value; 

      // Visual Reset (Radio Button Logic)
      // @ts-ignore
      const menuParent = this.parentComponent_; 
      if (menuParent && menuParent.children_) {
        menuParent.children().forEach((child: any) => {
           if (child !== this) child.selected(false);
        });
      }
      this.selected(true);

      const isYouTube = player.techName_ === 'Youtube';

      // 1. LOGIKA YOUTUBE
      if (isYouTube) {
        const tech = player.tech(true);
        const ytPlayer = tech.ytPlayer || (tech as any).ytPlayer_ || (player as any).ytPlayer;
        if (ytPlayer && typeof ytPlayer.setPlaybackQuality === 'function') {
          try { ytPlayer.setPlaybackQuality(YOUTUBE_QUALITY_MAP[targetValue] || 'default'); } catch (e) {}
          if (this.options_.callback) this.options_.callback(targetValue, true);
        }
        return; 
      }

      // 2. LOGIKA HLS / PROXY IDN (AUTO DETECT)
      // @ts-ignore
      const qualityLevels = player.qualityLevels ? player.qualityLevels() : null;

      if (qualityLevels && qualityLevels.length > 0) {
        console.log('[Player] Switching HLS Level to:', targetValue);

        // Reset semua ke false (kecuali Auto)
        for (let i = 0; i < qualityLevels.length; i++) {
          qualityLevels[i].enabled = targetValue === 'auto';
        }

        // Kalau pilih resolusi spesifik (bukan Auto)
        if (targetValue !== 'auto') {
          let foundIndex = -1;
          for (let i = 0; i < qualityLevels.length; i++) {
            // Cocokkan height (misal: 720) dengan targetValue (misal: "720p")
            if ((qualityLevels[i].height + 'p') === targetValue) {
              foundIndex = i;
              break;
            }
          }
          if (foundIndex !== -1) qualityLevels[foundIndex].enabled = true;
        }

        // Fitur "Seek to Live" (Anti-Freeze saat ganti kualitas)
        if (!player.paused() && player.duration() === Infinity) {
           setTimeout(() => {
               const seekable = player.seekable();
               if (seekable.length > 0) {
                   player.currentTime(seekable.end(0) - 0.1);
                   player.play().catch(() => {});
               }
           }, 100);
        }

        if (this.options_.callback) this.options_.callback(targetValue, true);
      }
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

// --- COMPONENT INTERFACE ---
// SAYA PERTAHANKAN 'qualities' AGAR TIDAK ERROR BUILD, TAPI LOGICNYA SAYA ABAIKAN UNTUK IDN
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
  const [hasStarted, setHasStarted] = useState(startTime > 0);
  const [detectedLevels, setDetectedLevels] = useState<{ label: string; val: string }[]>([]);

  const isYoutubeSource = options.sources?.[0]?.type === 'video/youtube';

  // --- LOGIC PENENTUAN MENU KUALITAS ---
  // 1. Jika Youtube -> Pakai List Statis
  // 2. Jika IDN/HLS -> Pakai detectedLevels (Auto Detect dari Proxy)
  // (Data 'qualities' dari props DIABAIKAN total untuk HLS demi konsistensi)
  
  const ytQualities = [
    { label: 'Auto', val: 'auto' },
    { label: '1080p', val: '1080p' },
    { label: '720p', val: '720p' },
    { label: '480p', val: '480p' },
    { label: '360p', val: '360p' },
  ];

  const finalQualities = isYoutubeSource ? ytQualities : detectedLevels;
  const finalCurrentQuality = !currentQuality && isYoutubeSource ? 'auto' : currentQuality;

  useEffect(() => {
    registerQualityMenu();

    if (!playerRef.current && videoRef.current) {
      // 1. INIT PLAYER
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      
      // Tambah Class Khusus buat FIX GAMBAR KEPOTONG
      if (isYoutubeSource) {
          videoElement.classList.add('vjs-youtube-mode');
      } else {
          // INI SOLUSI GAMBAR KEPOTONG: Class ini memaksa 'object-fit: contain'
          videoElement.classList.add('vjs-idn-fix'); 
      }

      videoRef.current.appendChild(videoElement);

      const finalOptions = {
        ...options,
        techOrder: ['html5', 'youtube'],
        controls: true,
        bigPlayButton: true,
        html5: {
          vhs: { overrideNative: true }, // WAJIB TRUE
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
        plugins: { qualityLevels: {} }, // Plugin Aktif
        youtube: {
          ytControls: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          rel: 0,
          playsinline: 1,
          ...options.youtube,
        },
      };

      const player = (playerRef.current = videojs(videoElement, finalOptions));

      // --- AUTO DETECT RESOLUSI LISTENER ---
      player.ready(() => {
         // @ts-ignore
         const qLevels = player.qualityLevels();
         if(qLevels) {
             const updateLevels = () => {
                 const detected: {label:string, val:string}[] = [];
                 for(let i=0; i<qLevels.length; i++) {
                     if(qLevels[i].height) {
                         const lbl = qLevels[i].height + 'p';
                         detected.push({ label: lbl, val: lbl });
                     }
                 }
                 // Filter unik & sort dari tinggi ke rendah
                 const unique = [...new Map(detected.map(item => [item.val, item])).values()];
                 unique.sort((a, b) => parseInt(b.val) - parseInt(a.val));
                 
                 // Simpan ke state biar tombol muncul
                 if(unique.length > 0) {
                     unique.unshift({ label: 'Auto', val: 'auto' });
                     setDetectedLevels(unique); 
                 }
             };

             // Dengerin event dari plugin
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
      // 2. UPDATE PLAYER EXISTING
      const player = playerRef.current;
      
      if (options.sources && options.sources.length > 0) {
        player.src(options.sources);
      }

      // Pastikan Class CSS benar saat ganti source
      if (isYoutubeSource) {
        player.addClass('vjs-youtube-mode');
        player.removeClass('vjs-idn-fix');
      } else {
        player.removeClass('vjs-youtube-mode');
        player.addClass('vjs-idn-fix');
      }

      // Re-render Tombol Menu jika ada perubahan detectedLevels
      const controlBar = (player as any).controlBar;
      if (controlBar) {
          if (controlBar.getChild('QualityMenuButton')) {
              controlBar.removeChild('QualityMenuButton');
          }

          if (finalQualities && finalQualities.length > 0) {
              let insertIndex = controlBar.children_.length - 1;
              const fullscreenToggle = controlBar.getChild('FullscreenToggle');
              if (fullscreenToggle) {
                  const fsIndex = controlBar.children_.indexOf(fullscreenToggle);
                  if (fsIndex > -1) insertIndex = fsIndex;
              }

              controlBar.addChild(
                  'QualityMenuButton',
                  {
                      qualities: finalQualities,
                      currentQuality: finalCurrentQuality,
                      onQualityChange,
                  },
                  insertIndex,
              );
          }
      }
    }
  }, [options, detectedLevels, finalCurrentQuality]); // Dependency updated ke detectedLevels

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-black">
      {/* FIX KLIK 2 KALI & MOBILE: 
          Kalau sudah play (!hasStarted false), overlay DIHAPUS TOTAL dari DOM.
          Jadi tidak ada layer transparan yang menghalangi klik.
      */}
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

      <div ref={videoRef} className="w-full h-full relative z-10" />

      <style jsx global>{`
        /* FIX GAMBAR KEPOTONG: 
           Pake !important ganda biar gak kalah sama style inline VideoJS 
        */
        .video-js.vjs-idn-fix .vjs-tech {
          object-fit: contain !important;
          width: 100% !important;
          height: 100% !important;
          background-color: #000; /* Biar bar kiri-kanan hitam */
        }

        .video-js.vjs-youtube-mode .vjs-tech {
          object-fit: cover !important;
          transform: scale(1.20) !important;
        }

        /* Styling Menu Button */
        .vjs-quality-menu-button {
          width: 44px !important; height: 100% !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          cursor: pointer !important; margin-left: 4px !important; 
        }
        .vjs-quality-icon-container svg {
          width: 22px !important; height: 22px !important; fill: white !important;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)); transition: transform 0.2s;
        }
        .vjs-quality-menu-button:hover svg {
          transform: rotate(45deg); fill: #eab308 !important;
        }
        .vjs-menu-content {
          background: rgba(0, 0, 0, 0.9) !important; border-radius: 8px; overflow: hidden;
          bottom: 4em !important; width: 120px !important;
        }
        .vjs-menu-item {
          text-transform: capitalize; padding: 8px 12px; background-color: transparent; color: white;
        }
        .vjs-menu-item:hover, .vjs-selected {
            background-color: rgba(255, 255, 255, 0.1); color: #eab308 !important;
        }
        
        .video-js .vjs-big-play-button, .vjs-loading-spinner { display: none !important; }
        .vjs-quality-selector { display: none !important; }

        /* Memastikan Control Bar selalu responsif */
        .video-js.vjs-user-active .vjs-control-bar,
        .video-js.vjs-paused .vjs-control-bar {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 0.3s ease;
        }
        .video-js .vjs-control-bar {
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;