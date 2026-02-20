'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!videojs.getPlugin('qualityLevels')) require('videojs-contrib-quality-levels');
}

const YOUTUBE_QUALITY_MAP: { [key: string]: string } = {
  '1080p': 'hd1080', '720p': 'hd720', '480p': 'large', '360p': 'medium', '240p': 'small', 'auto': 'default', 'source': 'highres',
};

const registerQualityMenu = () => {
  if (typeof window === 'undefined') return;
  const MenuButton = videojs.getComponent('MenuButton') as any;
  const MenuItem = videojs.getComponent('MenuItem') as any;
  if (videojs.getComponent('QualityMenuButton')) return;

  class QualityMenuItem extends MenuItem {
    constructor(player: any, options: any) { super(player, { ...options, selectable: true }); }
    handleClick() {
      const player = this.player();
      const targetValue = this.options_.value; 
      // @ts-ignore
      const menuParent = this.parentComponent_; 
      if (menuParent && menuParent.children_) {
        menuParent.children().forEach((child: any) => { if (child !== this) child.selected(false); });
      }
      this.selected(true);
      if (player.techName_ === 'Youtube') {
        const tech = player.tech(true);
        const ytPlayer = tech.ytPlayer || (tech as any).ytPlayer_ || (player as any).ytPlayer;
        if (ytPlayer && typeof ytPlayer.setPlaybackQuality === 'function') {
          try { ytPlayer.setPlaybackQuality(YOUTUBE_QUALITY_MAP[targetValue] || 'default'); } catch (e) {}
          if (this.options_.callback) this.options_.callback(targetValue, true);
        }
      } else {
        // @ts-ignore
        const qLevels = player.qualityLevels ? player.qualityLevels() : null;
        if (qLevels) {
          for (let i = 0; i < qLevels.length; i++) {
            if (targetValue === 'auto') qLevels[i].enabled = true;
            else qLevels[i].enabled = ((qLevels[i].height + 'p') === targetValue);
          }
          if (this.options_.callback) this.options_.callback(targetValue, true);
        }
      }
    }
  }

  class QualityMenuButton extends MenuButton {
    constructor(player: any, options: any) { super(player, options); this.addClass('vjs-quality-menu-button'); }
    createEl() {
      const el = super.createEl('button', { className: 'vjs-menu-button vjs-menu-button-popup vjs-control vjs-button vjs-quality-menu-button' });
      // FIX ICON SIZE: Dipastikan ukurannya pas dengan icon lain
      el.innerHTML = `<div class="vjs-quality-icon-container" style="display:flex;align-items:center;justify-content:center;height:100%;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.016.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.819l1.019-.393c.115-.044.283-.032.45.083a7.49 7.49 0 00.986.57c.182.088.277.228.297.348l.177 1.072c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.177-1.072c.02-.12.115-.26.297-.348.325-.157.639-.345.937-.562.166-.115.334-.126.45-.083l1.019.393a1.875 1.875 0 002.282-.819l.922-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.841-.692a1.875 1.875 0 00.432-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.819l-1.019.393c-.115.044-.283.032-.45-.083-.298-.217-.612-.405-.937-.562-.182-.088-.277-.228-.297-.348l-.177-1.072c-.151-.904-.933-1.567-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg></div>`;
      return el;
    }
    createItems() {
      // @ts-ignore
      const list = this.options_.qualities || [];
      return list.map((q: any) => new QualityMenuItem(this.player(), { label: q.label, value: q.val, callback: this.options_.onQualityChange, selected: q.val === this.options_.currentQuality }));
    }
  }
  videojs.registerComponent('QualityMenuButton', QualityMenuButton as any);
};

interface StreamSource { name: string; url: string; }
interface VideoPlayerProps { sources: StreamSource[]; activeSourceIndex: number; onSwitchSource: (index: number) => void; poster?: string; }

const VideoPlayer: React.FC<VideoPlayerProps> = ({ sources, activeSourceIndex, onSwitchSource, poster }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const currentSource = sources[activeSourceIndex];
  const [hasStarted, setHasStarted] = useState(false);
  const [detectedLevels, setDetectedLevels] = useState<{ label: string; val: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState('auto');

  const getSourceType = (url: string) => (url.includes('youtube.com') || url.includes('youtu.be')) ? 'video/youtube' : 'application/x-mpegURL';
  const isYoutube = currentSource ? getSourceType(currentSource.url) === 'video/youtube' : false;

  const handleFullscreenLogic = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isFullscreen()) {
      // @ts-ignore
      if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {});
    } else {
      // @ts-ignore
      if (screen.orientation?.unlock) screen.orientation.unlock();
    }
  };

  useEffect(() => {
    registerQualityMenu();
    if (!videoRef.current || !currentSource) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fill'); 
    if (!isYoutube) videoElement.classList.add('vjs-idn-fix');
    if (isYoutube) videoElement.classList.add('vjs-youtube-mode');
    videoRef.current.appendChild(videoElement);

    // REVISI TOTAL OPTIONS: Hapus custom children biar balik ke default layout yang bener
    const player = playerRef.current = videojs(videoElement, {
      autoplay: true, 
      controls: true, 
      responsive: true, 
      fluid: false, 
      techOrder: ['html5', 'youtube'],
      sources: [{ src: currentSource.url, type: getSourceType(currentSource.url) }],
      plugins: { qualityLevels: {} },
      youtube: { ytControls: 0, modestbranding: 1, iv_load_policy: 3, rel: 0, playsinline: 1, enablejsapi: 1 },
      // controlBar children DIHAPUS agar menggunakan default layout Video.js yang sudah rapi
    });

    player.ready(() => {
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

    player.on('fullscreenchange', handleFullscreenLogic);
    player.on('play', () => setHasStarted(true));

    return () => {
      if (player && !player.isDisposed()) { 
        player.off('fullscreenchange', handleFullscreenLogic);
        player.dispose(); 
        playerRef.current = null; 
      }
      if (videoRef.current) videoRef.current.innerHTML = '';
    };
  }, [currentSource]);

  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    const controlBar = (player as any).controlBar;
    const ytQualities = [
      { label: 'Auto', val: 'auto' }, { label: '1080p', val: '1080p' }, { label: '720p', val: '720p' }, { label: '480p', val: '480p' }, { label: '360p', val: '360p' },
    ];
    const finalQualities = isYoutube ? ytQualities : detectedLevels;

    if (controlBar && finalQualities.length > 0) {
      if (controlBar.getChild('QualityMenuButton')) controlBar.removeChild('QualityMenuButton');
      let insertIndex = controlBar.children_.length - 1;
      const fsToggle = controlBar.getChild('FullscreenToggle');
      if (fsToggle) insertIndex = controlBar.children_.indexOf(fsToggle);
      controlBar.addChild('QualityMenuButton', { qualities: finalQualities, currentQuality, onQualityChange: (val: string) => setCurrentQuality(val) }, insertIndex);
    }
  }, [detectedLevels, isYoutube, currentQuality]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-black group">
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 cursor-pointer" onClick={() => playerRef.current?.play()}>
          {poster && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${poster}')` }} />}
          <div className="relative z-10 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-8 h-8 ml-1"><path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" /></svg>
          </div>
        </div>
      )}
      
      {/* OVERLAY KEAMANAN: bottom 50px biar control bar Video.js gak ketutup */}
      {isYoutube && hasStarted && (
        <div 
           className="absolute top-0 left-0 right-0 z-20 cursor-pointer" 
           style={{ bottom: '50px' }} 
           onClick={() => {
              if (playerRef.current.paused()) playerRef.current.play();
              else playerRef.current.pause();
           }}
        />
      )}

      <div ref={videoRef} className="w-full h-full" />
      
      <style jsx global>{`
        .video-js.vjs-idn-fix .vjs-tech { object-fit: contain !important; }
        .video-js.vjs-youtube-mode .vjs-tech { object-fit: contain !important; transform: none !important; pointer-events: none !important; }
        
        /* REVISI TOTAL CSS: Hapus semua override aneh-aneh */
        /* Kembalikan ke default flexbox Video.js */
        .vjs-control-bar { 
          display: flex !important;
          visibility: visible !important; /* Paksa terlihat */
          opacity: 1 !important;
          background: linear-gradient(to top, rgba(0,0,0,0.9), transparent) !important;
          height: 50px !important;
          z-index: 30 !important;
          align-items: center !important;
        }

        /* Pastikan item di dalamnya sejajar vertikal */
        .vjs-control-bar > * {
          display: flex !important;
          align-items: center !important;
        }

        /* Styling Menu Kualitas biar rapi */
        .vjs-quality-menu-button { cursor: pointer; }
        .vjs-menu-content { 
          background: rgba(0,0,0,0.95) !important; 
          border-radius: 8px !important; 
          bottom: 50px !important; /* Muncul di atas control bar */
        }
        .vjs-menu-item { padding: 8px 12px !important; font-size: 10px !important; text-transform: uppercase; font-weight: 900; }
        .vjs-selected { color: #eab308 !important; }

        .vjs-big-play-button { display: none !important; }
      `}</style>
    </div>
  );
};

export default VideoPlayer;