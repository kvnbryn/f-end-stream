"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBackendUrl } from "@/lib/config";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function SpecialWatchGateway() {
  const { token } = useParams();
  const router = useRouter();
  const backendUrl = getBackendUrl();

  useEffect(() => {
    const processAccess = async () => {
      try {
        // 1. Verifikasi ke backend apakah token valid
        const res = await fetch(`${backendUrl}/api/v1/public/access/verify/${token}`);
        const data = await res.json();

        if (data.valid) {
          // 2. Jika valid, simpan token di Cookies agar Dashboard bisa baca
          // Kita simpan dengan nama 'special_token'
          Cookies.set("special_token", token as string, { expires: 1, path: "/" });
          
          // 3. Langsung lempar ke Dashboard utama
          router.replace("/dashboard");
        } else {
          // Jika gagal, lempar ke login dengan pesan error (opsional)
          router.push("/login?error=invalid_link");
        }
      } catch (err) {
        router.push("/login");
      }
    };

    if (token) processAccess();
  }, [token, backendUrl, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
        Initializing Matrix Access...
      </p>
    </div>
  );
}