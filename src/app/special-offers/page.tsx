'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBackendUrl } from '@/lib/config';

// --- TIPE DATA ---
type Offer = {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  price: number;
  duration: number;
  is_limited: boolean;
  stock: number;
  image_url?: string;
};

// --- ICONS ---
const Icons = {
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Whatsapp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
};

export default function SpecialOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [qrisUrl, setQrisUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const backendUrl = getBackendUrl();
  const adminWa = '6288809048431';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/v1/public/packages`);
        const data = await res.json();
        if (data.packages) setOffers(data.packages);
        if (data.qrisUrl) setQrisUrl(data.qrisUrl);
      } catch (e) {
        console.error('Failed to fetch offers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !userEmail) return;

    const message = `Halo Admin Realtime48, saya ingin mengambil SPECIAL OFFER.

Detail Pesanan:
--------------------------------
• Paket: ${selectedOffer.title}
• Topik: ${selectedOffer.topic}
• Durasi: ${selectedOffer.duration} Hari
• Email User: ${userEmail}
• Harga: Rp ${selectedOffer.price.toLocaleString('id-ID')}
--------------------------------

Mohon konfirmasi dan aktivasi.`;

    window.open(`https://wa.me/${adminWa}?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedOffer(null);
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-yellow-500/30">
      
      {/* Header Nav */}
      <div className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
        <button onClick={() => router.push('/')} className="pointer-events-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest group">
          <span className="group-hover:-translate-x-1 transition-transform"><Icons.ArrowLeft /></span>
          Back
        </button>
        <span className="font-bold text-yellow-500 tracking-widest">REALTIME48</span>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter">SPECIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-700">OFFERS</span></h1>
          <p className="text-gray-500 text-sm uppercase tracking-[0.3em]">Exclusive Limited Access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.length === 0 ? (
             <div className="col-span-full text-center py-20 border border-dashed border-gray-800 rounded-xl text-gray-600 uppercase text-xs tracking-widest">
                No special offers available at the moment.
             </div>
          ) : (
             offers.map((offer) => (
               <div key={offer.id} className="group relative bg-[#0a0a0a] border border-gray-800 hover:border-yellow-600/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                  
                  {/* Header Image Area (REVISED: h-80 = 320px) */}
                  <div className="h-80 bg-gray-900 relative overflow-hidden">
                     {/* LOGIC CUSTOM IMAGE VS DEFAULT */}
                     <img 
                        src={offer.image_url || "/logo.png"} 
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0" 
                        alt={offer.title} 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                     
                     {/* Badge Limited */}
                     {offer.is_limited && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse flex items-center gap-1">
                           <Icons.Zap /> Limited Stock: {offer.stock}
                        </div>
                     )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1 relative -mt-10">
                     <div className="bg-[#111] border border-gray-800 p-4 rounded-xl shadow-2xl mb-6">
                        <p className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{offer.topic || 'Special Access'}</p>
                        <h3 className="text-xl font-bold text-white">{offer.title}</h3>
                     </div>

                     <div className="flex-1 space-y-4 mb-8">
                        {(offer.description || '').split(',').map((feature, idx) => (
                           <div key={idx} className="flex items-start gap-3 text-sm text-gray-400">
                              <span className="text-yellow-500 mt-0.5"><Icons.Check /></span>
                              <span>{feature.trim()}</span>
                           </div>
                        ))}
                     </div>

                     <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] text-gray-600 uppercase mb-1">Access Duration</p>
                           <p className="text-white font-bold">{offer.duration} Days</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-600 uppercase mb-1">Price</p>
                           <p className="text-xl font-mono text-yellow-500">Rp {offer.price.toLocaleString('id-ID')}</p>
                        </div>
                     </div>

                     <button 
                        onClick={() => { setSelectedOffer(offer); setUserEmail(''); }}
                        className="w-full mt-6 bg-white text-black hover:bg-yellow-500 font-bold py-3 rounded-lg text-xs tracking-[0.2em] uppercase transition-all"
                     >
                        Claim Offer
                     </button>
                  </div>
               </div>
             ))
          )}
        </div>
      </div>

      {/* QRIS Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-[#0a0a0a] border border-gray-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
              <button onClick={() => setSelectedOffer(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white z-10"><Icons.X /></button>
              
              {/* Kiri: QRIS */}
              <div className="w-full md:w-1/2 bg-white p-8 flex flex-col items-center justify-center text-black text-center relative overflow-hidden">
                 {qrisUrl ? (
                    <img src={qrisUrl} className="w-full max-w-[250px] object-contain relative z-10 mix-blend-multiply" />
                 ) : (
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">QRIS NOT AVAILABLE</div>
                 )}
                 <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-500 relative z-10">Scan to Pay</p>
                 
                 <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>

              {/* Kanan: Form */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                 <div className="mb-8">
                    <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">Finalizing Order</p>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedOffer.title}</h2>
                    <p className="text-gray-500 text-sm">{selectedOffer.topic} • {selectedOffer.duration} Days</p>
                 </div>

                 <form onSubmit={handleOrder} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Registered Email</label>
                       <input 
                          type="email" 
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full bg-[#111] border border-gray-800 rounded-lg p-4 text-white text-sm focus:border-yellow-500 outline-none transition-colors"
                          placeholder="name@example.com"
                          required
                       />
                    </div>

                    <div className="py-4 border-t border-b border-gray-800 flex justify-between items-center">
                       <span className="text-sm text-gray-400">Total Payment</span>
                       <span className="text-xl font-mono text-yellow-500">Rp {selectedOffer.price.toLocaleString('id-ID')}</span>
                    </div>

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                       <Icons.Whatsapp /> CONFIRM PAYMENT
                    </button>
                    <p className="text-[10px] text-gray-600 text-center">Admin will verify your payment manually.</p>
                 </form>
              </div>
           </div>
        </div>
      )}

    </main>
  );
}