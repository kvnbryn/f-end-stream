'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

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

export default function VideoPlayer({ 
  sources, 
  activeSourceIndex, 
  onSwitchSource, 
  poster 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const currentSource = sources[activeSourceIndex];

  // Fungsi deteksi otomatis tipe stream berdasarkan URL
  const getSourceType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'video/youtube';
    }
    // Default dianggap HLS (.m3u8)
    return 'application/x-mpegURL';
  };

  useEffect(() => {
    // Pastikan elemen video ada dan source tersedia
    if (!videoRef.current || !currentSource) return;

    // Buat elemen video-js secara dinamis
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid');
    videoRef.current.appendChild(videoElement);

    // Inisialisasi Player
    const player = playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      poster: poster,
      playbackRates: [0.5, 1, 1.5, 2],
      techOrder: ['html5', 'youtube'],
      sources: [{
        src: currentSource.url,
        type: getSourceType(currentSource.url)
      }],
      youtube: {
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        playsinline: 1
      },
      userActions: {
        hotkeys: true
      }
    });

    // Cleanup saat komponen unmount atau source berubah
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
      }
    };
  }, [currentSource, poster]);

  return (
    <div className="w-full flex flex-col gap-0 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black group">
      {/* Container Player */}
      <div className="relative aspect-video bg-black">
        <div data-vjs-player>
          <div ref={videoRef} className="w-full h-full" />
        </div>
      </div>
      
      {/* Switcher Server - Layout Pro & Terukur */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Jalur Pengiriman Data
            </span>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {sources && sources.length > 0 ? (
              sources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => onSwitchSource(idx)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[11px] font-black transition-all duration-300 border uppercase tracking-widest ${
                    activeSourceIndex === idx 
                      ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {src.name || `Server ${idx + 1}`}
                </button>
              ))
            ) : (
              <span className="text-[10px] text-gray-600 italic uppercase">Konfigurasi Server Belum Tersedia</span>
            )}
          </div>
        </div>
      </div>

      {/* Style Tambahan untuk VideoJS agar Fit & Professional */}
      <style jsx global>{`
        .video-js {
          font-family: inherit;
        }
        .vjs-big-play-button {
          background-color: rgba(234, 179, 8, 0.9) !important;
          border-radius: 50% !important;
          width: 80px !important;
          height: 80px !important;
          line-height: 80px !important;
          margin-top: -40px !important;
          margin-left: -40px !important;
          border: none !important;
          box-shadow: 0 0 30px rgba(234, 179, 8, 0.4) !important;
        }
        .vjs-big-play-button:hover {
          background-color: #eab308 !important;
          transform: scale(1.1);
          transition: transform 0.2s ease-in-out !important;
        }
        .vjs-control-bar {
          background: linear-gradient(to top, rgba(0,0,0,1), transparent) !important;
          height: 50px !important;
        }
        .video-js .vjs-tech {
          object-fit: contain;
        }
        /* Fix Youtube Iframe Z-Index */
        .vjs-youtube .vjs-iframe-blocker {
          display: none !important;
        }
      `}</style>
    </div>
  );
}