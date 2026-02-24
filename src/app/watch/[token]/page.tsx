"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBackendUrl } from "@/lib/config";
import VideoPlayer from "@/components/VideoPlayer";
import { Loader2, AlertCircle } from "lucide-react";

export default function SpecialWatchPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any>(null);

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
        <p className="text-lg font-medium">Memverifikasi akses khusus lu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Waduh, Gagal Bro!</h1>
        <p className="text-gray-400 max-w-md">{error}</p>
        <a 
          href="/" 
          className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-all font-semibold"
        >
          Balik ke Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="font-bold text-red-500 uppercase tracking-widest text-sm">Akses Khusus Live</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{streamData.title}</h1>
        
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <VideoPlayer 
            sources={streamData.sources} 
            qualities={streamData.qualities} 
          />
        </div>

        <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Tentang Link Ini</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Lu dapet akses ini langsung dari Admin. Link ini bersifat terbatas dan bisa kedaluwarsa sewaktu-waktu. 
            Enjoy nontonnya bro!
          </p>
        </div>
      </div>
    </div>
  );
}