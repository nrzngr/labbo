"use client";

import { Reveal } from "@/components/ui/Reveal";
import { RefreshCw, ShieldCheck, CalendarClock, Share2, AlertCircle, CheckCircle2 } from "lucide-react";

export const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 px-4 max-w-7xl mx-auto relative">
      <Reveal>
        <h2 className="text-3xl md:text-6xl font-thin font-display text-slate-900 mb-12 md:mb-20 text-center tracking-tight">
          Instrumen Presisi untuk <br />
          <span className="text-slate-500 font-normal">Laboratorium Modern.</span>
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
        {/* Cell 1: Smart Inventory (Large) */}
        <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-pink-200 hover:shadow-xl transition-all duration-500 flex flex-col md:block">
            <h3 className="text-2xl text-slate-800 font-medium mb-2 relative z-10">Peminjaman Cerdas & Stok</h3>
            <p className="text-slate-500 font-light text-base max-w-md relative z-10 mb-6 md:mb-8">
                Monitoring stok real-time. Notifikasi otomatis saat stok menipis. Alur persetujuan peminjaman yang terintegrasi.
            </p>
            
            {/* Visual: Simulated Stock Levels */}
            <div className="relative md:absolute md:right-0 md:bottom-0 w-full md:w-2/3 h-auto md:h-48 bg-slate-50 rounded-xl md:rounded-none md:rounded-tl-3xl border md:border-t md:border-l border-slate-100 p-4 md:p-6 flex flex-col gap-4 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                             <RefreshCw className="w-4 h-4 text-pink-600" />
                         </div>
                         <span className="text-sm font-medium text-slate-700 truncate">Reagen Kimia A</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded shrink-0">Low Stock</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full w-[15%] rounded-full animate-pulse" />
                </div>
                
                 <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                             <RefreshCw className="w-4 h-4 text-blue-600" />
                         </div>
                         <span className="text-sm font-medium text-slate-700 truncate">Mikroskop Binokuler</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded shrink-0">Available</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[85%] rounded-full" />
                </div>
            </div>
        </div>

        {/* Cell 2: Compliance (Tall/Square) */}
        <div className="col-span-1 row-span-1 bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group hover:border-pink-200 hover:shadow-xl transition-all duration-500">
             <h3 className="text-xl text-slate-800 font-medium mb-2 relative z-10">Sistem Denda & Pengembalian</h3>
             <p className="text-slate-500 font-light text-sm relative z-10 mb-8">
                 Kalkulasi denda otomatis untuk keterlambatan dan kerusakan alat. Transparansi penuh.
             </p>
             <div className="absolute inset-0 flex items-center justify-center top-14">
                 <div className="relative w-32 h-32">
                    <ShieldCheck className="w-full h-full text-pink-50 stroke-1" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-pink-500 bg-white rounded-full p-1 shadow-lg" />
                    </div>
                 </div>
             </div>
        </div>

        {/* Cell 3: Equipment Booking */}
        <div className="col-span-1 row-span-1 bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group hover:border-pink-200 hover:shadow-xl transition-all duration-500">
             <h3 className="text-xl text-slate-800 font-medium mb-2 relative z-10">Penjadwalan Aset</h3>
             <p className="text-slate-500 font-light text-sm relative z-10">
                 Booking alat praktikum tanpa konflik jadwal.
             </p>
             <div className="absolute bottom-6 right-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                 <CalendarClock className="w-10 h-10 text-slate-400 mb-2" />
                 <div className="flex gap-1">
                     <span className="w-2 h-2 rounded-full bg-pink-500" />
                     <span className="w-2 h-2 rounded-full bg-slate-300" />
                     <span className="w-2 h-2 rounded-full bg-slate-300" />
                 </div>
             </div>
        </div>

        {/* Cell 4: Integration Hub */}
        <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group hover:border-pink-200 hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 relative z-10">
                <h3 className="text-2xl text-slate-800 font-medium mb-2">Notifikasi Terintegrasi</h3>
                <p className="text-slate-500 font-light text-base max-w-xs">
                    Terhubung langsung dengan email universitas untuk persetujuan dosen dan notifikasi mahasiswa.
                </p>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4 opacity-80">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                     <Share2 className="w-6 h-6 text-blue-600" />
                 </div>
                 <div className="w-2 h-px bg-slate-300" />
                 <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100 shadow-sm">
                     <CheckCircle2 className="w-6 h-6 text-pink-600" />
                 </div>
            </div>
        </div>
      </div>
    </section>
  );
};
