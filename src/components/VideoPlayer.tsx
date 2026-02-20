'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

// Import plugin pendeteksi resolusi
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!videojs.getPlugin('qualityLevels')) {
    require('videojs-contrib-quality-levels');
  }
}

const YOUTUBE_QUALITY_MAP: { [key: string]: string } = {
  '1080p': 'hd1080',
  '720p': 'hd720',
  '480p': 'large',
  '360p': 'medium',
  '240p': 'small',
  'auto': 'default',
};

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
      // @ts-ignore
      const menuParent = this.parentComponent_;
      if (menuParent && menuParent.children_) {
        menuParent.children().forEach((child: any) => {
          if (child !== this) child.selected(false);
        });
      }
      this.selected(true);

      if (player.techName_ === 'Youtube') {
        const tech = player.tech(true);
        const ytPlayer = tech.ytPlayer || (tech as any).ytPlayer_ || (player as any).ytPlayer;
        if (ytPlayer && typeof ytPlayer.setPlaybackQuality === 'function') {
          try {
            ytPlayer.setPlaybackQuality(YOUTUBE_QUALITY_MAP[targetValue] || 'default');
          } catch (e) {}
          if (this.options_.callback) this.options_.callback(targetValue);
        }
      } else {
        // @ts-ignore
        const qLevels = player.qualityLevels ? player.qualityLevels() : null;
        if (qLevels) {
          for (let i = 0; i < qLevels.length; i++) {
            if (targetValue === 'auto') {
              qLevels[i].enabled = true;
            } else {
              qLevels[i].enabled = qLevels[i].height + 'p' === targetValue;
            }
          }
          if (this.options_.callback) this.options_.callback(targetValue);
        }
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
        <div class="vjs-quality-icon" style="display:flex;align-items:center;justify-content:center;height:100%;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>`;
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

  useEffect(() => {
    registerQualityMenu();
    if (!videoRef.current || !currentSource) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fill');
    if (!isYoutube) videoElement.classList.add('vjs-idn-fix');
    if (isYoutube) videoElement.classList.add('vjs-youtube-mode');
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: false,
      techOrder: ['html5', 'youtube'],
      sources: [{ src: currentSource.url, type: getSourceType(currentSource.url) }],
      plugins: { qualityLevels: {} },
      youtube: { ytControls: 0, modestbranding: 1, iv_load_policy: 3, rel: 0, playsinline: 1, enablejsapi: 1 },
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'progressControl',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'customControlSpacer',
          'fullscreenToggle',
        ],
      },
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

    player.on('play', () => setHasStarted(true));

    return () => {
      if (player && !player.isDisposed()) {
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
      const fsToggle = controlBar.getChild('FullscreenToggle');
      const insertIndex = fsToggle ? controlBar.children_.indexOf(fsToggle) : controlBar.children_.length;
      
      controlBar.addChild('QualityMenuButton', {
        qualities: finalQualities,
        currentQuality,
        onQualityChange: (val: string) => setCurrentQuality(val)
      }, insertIndex);
    }
  }, [detectedLevels, isYoutube, currentQuality]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-black">
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 cursor-pointer" onClick={() => playerRef.current?.play()}>
          {poster && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${poster}')` }} />}
          <div className="relative z-10 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="w-8 h-8 ml-1"><path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" /></svg>
          </div>
        </div>
      )}

      {/* OVERLAY SECURITY: Memblokir klik ke YouTube tapi membiarkan control bar tetap interaktif */}
      {isYoutube && hasStarted && (
        <div 
          className="absolute inset-0 z-10 cursor-pointer" 
          style={{ height: 'calc(100% - 40px)' }} // Sisakan 40px di bawah untuk control bar
          onClick={() => {
            if (playerRef.current.paused()) playerRef.current.play();
            else playerRef.current.pause();
          }}
        />
      )}

      <div ref={videoRef} className="w-full h-full" />
      
      <style jsx global>{`
        .video-js.vjs-fill { height: 100% !important; width: 100% !important; }
        .video-js.vjs-idn-fix .vjs-tech { object-fit: contain !important; }
        .video-js.vjs-youtube-mode .vjs-tech { object-fit: contain !important; transform: none !important; pointer-events: none !important; }
        
        /* FIX CONTROL BAR LAYOUT */
        .vjs-control-bar {
          background: rgba(0, 0, 0, 0.8) !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          z-index: 20 !important;
        }

        .vjs-button { width: 40px !important; height: 40px !important; }
        .vjs-control:before { line-height: 40px !important; font-size: 1.8em !important; }

        /* Progress Control Standar */
        .vjs-progress-control { flex: 1 !important; display: flex !important; align-items: center !important; padding: 0 10px !important; }
        .vjs-play-progress:before { font-size: 1em !important; top: -0.3em !important; }

        /* Time Display Sejajar */
        .vjs-current-time, .vjs-time-divider, .vjs-duration-display {
          display: flex !important;
          padding: 0 2px !important;
          font-size: 11px !important;
          line-height: 40px !important;
          min-width: 0 !important;
        }

        /* Quality Gear Button */
        .vjs-quality-menu-button {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
        }
        .vjs-quality-icon svg { transition: transform 0.2s; }
        .vjs-quality-menu-button:hover .vjs-quality-icon svg { color: #eab308; transform: rotate(30deg); }

        .vjs-menu-content { background: rgba(0, 0, 0, 0.95) !important; border-radius: 8px !important; bottom: 40px !important; }
        .vjs-menu-item { padding: 8px 15px !important; font-size: 10px !important; text-transform: uppercase; font-weight: 900; }
        .vjs-selected { color: #eab308 !important; }

        .vjs-big-play-button { display: none !important; }
      `}</style>
    </div>
  );
};

export default VideoPlayer;