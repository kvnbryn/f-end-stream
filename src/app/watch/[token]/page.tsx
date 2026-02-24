"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBackendUrl } from "@/lib/config";
import VideoPlayer from "@/components/VideoPlayer";
import { Loader2, AlertCircle, Server } from "lucide-react";

export default function SpecialWatchPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/v1/public/access/verify/${token}`);
        const data = await res.json();

        if (data.valid) {
          if (!data.stream) {
            setError("Sedang tidak ada live stream aktif, bro.");
          } else {
            setStreamData(data.stream);
          }
        } else {
          setError(data.message || "Link tidak valid atau sudah expired.");
        }
      } catch (err) {
        setError("Gagal menyambung ke server.");
      } finally {
        setLoading(false);
      }
    };

    if (token) verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
        <p className="text-lg font-black uppercase tracking-widest">Memverifikasi Matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2 uppercase tracking-tight">Waduh, Gagal Bro!</h1>
        <p className="text-gray-400 max-w-md text-[10px] font-black uppercase tracking-widest">{error}</p>
        <a 
          href="/" 
          className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em]"
        >
          Return to Matrix
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-6xl mx-auto pt-10 px-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="font-black text-red-500 uppercase tracking-[0.4em] text-[10px]">VIP Access Node Active</span>
        </div>
        
        <h1 className="text-2xl md:text-4xl font-black mb-8 uppercase tracking-tighter leading-tight">{streamData.title}</h1>
        
        <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-[#0a0a0a]">
          <VideoPlayer 
            sources={streamData.sources || []} 
            activeSourceIndex={sourceIndex}
            onSwitchSource={setSourceIndex}
            poster={streamData.thumbnail}
          />
        </div>

        {/* Server Switcher: Muncul kalau ada lebih dari 1 server */}
        {streamData.sources && streamData.sources.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-4">
            {streamData.sources.map((src: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSourceIndex(idx)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${sourceIndex === idx ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}`}
              >
                <Server size={14} /> {src.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 p-8 md:p-12 bg-[#0a0a0a] rounded-[3rem] border border-white/5">
          <h2 className="text-xl font-black mb-4 uppercase tracking-tighter">Node Information</h2>
          <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
            Anda mendadapatkan akses langsung dari Master Admin. Link ini bersifat terbatas dan bisa diputus (expired) sewaktu-waktu. 
            Enjoy the broadcast
          </p>
        </div>
      </div>
    </div>
  );
}