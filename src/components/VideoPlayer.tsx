'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

// --- KONFIGURASI IMPORT AMAN ---
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!videojs.getPlugin('qualityLevels')) {
    require('videojs-contrib-quality-levels');
  }
}

// --- CONSTANTS QUALITY MAP ---
const YOUTUBE_QUALITY_MAP: { [key: string]: string } = {
  '1080p': 'hd1080',
  '720p': 'hd720',
  '480p': 'large',
  '360p': 'medium',
  '240p': 'small',
  'auto': 'default',
  'source': 'highres',
};

// --- HELPER: REGISTRASI CUSTOM QUALITY MENU (LOGIKA ASLI LU) ---
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

      // Visual Reset
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

      // 2. LOGIKA HLS (INTERNAL)
      // @ts-ignore
      const qualityLevels = player.qualityLevels ? player.qualityLevels() : null;
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
            <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.016.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.819l1.019-.393c.115-.044.283-.032.45.083a7.49 7.49 0 00.986.57c.182.088.277.228.297.348l.177 1.072c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.177-1.072c.02-.12.115-.26.297-.348.325-.157.639-.345.937-.562.166-.115.334-.126.45-.083l1.019.393a1.875 1.875 0 002.282-.819l.922-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.841-.692a1.875 1.875 0 00.432-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.819l-1.019.393c-.115.044-.283.032-.45-.083-.298-.217-.612-.405-.937-.562-.182-.088-.277-.228-.297-.348l-.177-1.072c-.151-.904-.933-1.567-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
          </svg>
        </div>
      `;
      return el;
    }

    createItems() {
      // @ts-ignore
      const list = this.options_.qualities || [];
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

// --- INTERFACE ---
interface StreamSource {
  name: string;
  url: string;
}

interface VideoPlayerProps {
  sources: StreamSource[];
  activeSourceIndex: number;
  onSwitchSource: (index: number) => void;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sources,
  activeSourceIndex,
  onSwitchSource,
  poster,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const currentSource = sources[activeSourceIndex];
  
  const [hasStarted, setHasStarted] = useState(false);
  const [detectedLevels, setDetectedLevels] = useState<{ label: string; val: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState('auto');

  const getSourceType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video/youtube';
    return 'application/x-mpegURL';
  };

  const isYoutubeSource = currentSource ? getSourceType(currentSource.url) === 'video/youtube' : false;

  useEffect(() => {
    registerQualityMenu();

    if (!videoRef.current || !currentSource) return;

    // Build Options
    const videoOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      techOrder: ['html5', 'youtube'],
      sources: [{ src: currentSource.url, type: getSourceType(currentSource.url) }],
      plugins: { qualityLevels: {} },
      youtube: {
        ytControls: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        rel: 0,
        playsinline: 1,
      },
    };

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    if (!isYoutubeSource) videoElement.classList.add('vjs-idn-fix');
    if (isYoutubeSource) videoElement.classList.add('vjs-youtube-mode');
    
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, videoOptions);

    player.ready(() => {
      // Auto Detect Levels for HLS
      // @ts-ignore
      const qLevels = player.qualityLevels();
      if (qLevels) {
        const updateLevels = () => {
          const detected: { label: string; val: string }[] = [];
          for (let i = 0; i < qLevels.length; i++) {
            if (qLevels[i].height) {
              const lbl = qLevels[i].height + 'p';
              if (!detected.some(d => d.val === lbl)) detected.push({ label: lbl, val: lbl });
            }
          }
          if (detected.length > 0) {
            detected.sort((a, b) => parseInt(b.val) - parseInt(a.val));
            detected.unshift({ label: 'Auto', val: 'auto' });
            setDetectedLevels(detected);
          }
        };
        qLevels.on('addqualitylevel', updateLevels);
      }
    });

    player.on('play', () => setHasStarted(true));

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
      if (videoRef.current) videoRef.current.innerHTML = '';
    };
  }, [currentSource]);

  // Handle Quality Menu Injection
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    const controlBar = (player as any).controlBar;
    
    const ytQualities = [
      { label: 'Auto', val: 'auto' },
      { label: '1080p', val: '1080p' },
      { label: '720p', val: '720p' },
      { label: '480p', val: '480p' },
      { label: '360p', val: '360p' },
    ];

    const finalQualities = isYoutubeSource ? ytQualities : detectedLevels;

    if (controlBar && finalQualities.length > 0) {
      if (controlBar.getChild('QualityMenuButton')) controlBar.removeChild('QualityMenuButton');
      
      let insertIndex = controlBar.children_.length - 1;
      const fsToggle = controlBar.getChild('FullscreenToggle');
      if (fsToggle) insertIndex = controlBar.children_.indexOf(fsToggle);

      controlBar.addChild('QualityMenuButton', {
        qualities: finalQualities,
        currentQuality: currentQuality,
        onQualityChange: (val: string) => setCurrentQuality(val),
      }, insertIndex);
    }
  }, [detectedLevels, isYoutubeSource, currentQuality]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/5">
      {!hasStarted && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 cursor-pointer"
          onClick={() => playerRef.current?.play()}
        >
          {poster && <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url('${poster}')` }} />}
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-10 h-10 ml-1">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="mt-4 text-[10px] text-white font-black uppercase tracking-[0.3em]">Tap to Start Stream</p>
          </div>
        </div>
      )}

      <div ref={videoRef} className="w-full h-full relative z-10" />
      
      {/* SERVER SWITCHER UI */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/5 relative z-20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Jalur Transmisi</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((src, idx) => (
              <button
                key={idx}
                onClick={() => onSwitchSource(idx)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest ${
                  activeSourceIndex === idx 
                    ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                }`}
              >
                {src.name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .video-js.vjs-idn-fix .vjs-tech { object-fit: contain !important; }
        .video-js.vjs-youtube-mode .vjs-tech { object-fit: contain !important; transform: none !important; }
        
        /* INI KUNCI PEMBATASAN KLIK LOGO YT (LOGIKA LU) */
        .video-js.vjs-youtube-mode iframe { pointer-events: none !important; }
        
        .vjs-quality-menu-button { width: 44px !important; display: flex !important; align-items: center; justify-content: center; cursor: pointer; }
        .vjs-quality-icon-container svg { width: 20px; height: 20px; }
        .vjs-menu-content { background: rgba(0,0,0,0.95) !important; border-radius: 12px; bottom: 4em !important; }
        .vjs-menu-item { padding: 10px 15px !important; font-size: 11px !important; text-transform: uppercase; font-weight: 900; }
        .vjs-selected { color: #eab308 !important; background: rgba(255,255,255,0.05) !important; }
        .vjs-control-bar { background: linear-gradient(to top, black, transparent) !important; height: 50px !important; }
        .vjs-big-play-button { display: none !important; }
      `}</style>
    </div>
  );
};

export default VideoPlayer;