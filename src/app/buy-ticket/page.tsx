'use client';

import { useState, useEffect } from 'react';
import { getBackendUrl } from '@/lib/config'; 

// --- TYPES ---
type PublicSchedule = {
  id: string;
  title: string;
  start_time: string;
  thumbnail: string;
  price: number;
};

// --- ICONS ---
const Icons = {
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>,
  Ticket: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  Whatsapp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
};

export default function BuyTicketPage() {
  const [schedules, setSchedules] = useState<PublicSchedule[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PublicSchedule | null>(null);
  const [ticketEmail, setTicketEmail] = useState('');
  
  const backendUrl = getBackendUrl();
  const adminWa = '6288809048431'; 

  useEffect(() => {
    fetch(`${backendUrl}/api/v1/public/schedules`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSchedules(data); })
      .catch(err => console.error(err));
  }, [backendUrl]);

  const handleSendToWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !ticketEmail) return;

    const message = `*ORDER TICKET REALTIME48*\n\nEvent: ${selectedEvent.title}\nUser Email: ${ticketEmail}\nPrice: Rp ${selectedEvent.price.toLocaleString('id-ID')}\n\nMohon instruksi pembayaran.`;
    window.open(`https://wa.me/${adminWa}?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedEvent(null); 
  };

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-yellow-500/30 relative overflow-x-hidden">
      
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-600/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-20 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-2">
              GET <span className="text-yellow-500">ACCESS</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 tracking-[0.3em] uppercase">
              Secure your premium pass
            </p>
          </div>
          <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
             Back to Home <Icons.ArrowRight />
          </a>
        </header>

        {/* Ticket Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schedules.length === 0 ? (
            <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-xl text-gray-600">
              <p className="tracking-widest uppercase text-xs">No events available</p>
            </div>
          ) : (
            schedules.map((show) => (
              <div key={show.id} className="group relative bg-[#0a0a0a] border border-white/5 hover:border-yellow-500/50 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] flex flex-col">
                {/* Image Area */}
                <div className="h-64 w-full relative overflow-hidden bg-gray-900">
                  {show.thumbnail ? (
                    <img src={show.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs tracking-widest">NO VISUAL</div>
                  )}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]"></div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex flex-col flex-1 relative">
                  <div className="mb-auto">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-500 transition-colors">{show.title}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
                      {new Date(show.start_time).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Price</span>
                      <span className="text-lg font-mono text-white">Rp {show.price.toLocaleString('id-ID')}</span>
                    </div>
                    <button 
                      onClick={() => { setSelectedEvent(show); setTicketEmail(''); }}
                      className="bg-white text-black hover:bg-yellow-500 px-6 py-3 rounded-lg text-xs font-bold tracking-widest transition-all flex items-center gap-2"
                    >
                      ORDER
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-24 text-center text-[10px] text-gray-700 uppercase tracking-[0.2em]">
          Realtime48 &copy; 2025
        </footer>
      </div>

      {/* --- MODAL --- */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 relative shadow-2xl">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><Icons.X /></button>
            
            <div className="mb-8">
              <p className="text-yellow-500 text-xs uppercase tracking-widest mb-2">Purchase Request</p>
              <h2 className="text-2xl font-bold text-white leading-tight">{selectedEvent.title}</h2>
            </div>

            <form onSubmit={handleSendToWa} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest">Your Email</label>
                <input 
                  type="email" 
                  value={ticketEmail} 
                  onChange={(e) => setTicketEmail(e.target.value)} 
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-4 text-white text-sm focus:border-yellow-500 focus:outline-none transition-colors placeholder-gray-700" 
                  placeholder="email@address.com" 
                  required 
                />
              </div>

              <div className="flex justify-between items-center py-4 border-t border-b border-gray-800">
                <span className="text-xs text-gray-500 uppercase">Total</span>
                <span className="text-xl font-mono text-yellow-500">Rp {selectedEvent.price.toLocaleString('id-ID')}</span>
              </div>

              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg text-xs tracking-widest transition-all flex items-center justify-center gap-2">
                <Icons.Whatsapp /> PROCESS VIA WHATSAPP
              </button>
              <p className="text-center text-[10px] text-gray-600">Secure transaction processed manually by admin.</p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}