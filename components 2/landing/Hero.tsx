"use client";

import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Microscope, FlaskConical, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col items-center justify-center min-h-[90vh] overflow-hidden bg-white">
        {/* Background Gradients - Adjusted for White/Pink */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[1000px] h-[300px] md:h-[500px] bg-pink-100 blur-[80px] md:blur-[120px] rounded-full pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[400px] bg-blue-50 blur-[60px] md:blur-[100px] rounded-full pointer-events-none opacity-40" />
        
        <div className="container relative z-10 flex flex-col items-center text-center px-4">
            <Reveal delay={0.1}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-pink-50 border border-pink-100 mb-6 md:mb-8">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-semibold tracking-wide text-pink-700 uppercase">Sistem Manajemen Laboratorium Universitas</span>
                </div>
            </Reveal>

            <Reveal delay={0.2}>
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-slate-900 mb-6">
                    <span className="block text-slate-400 font-light text-2xl md:text-5xl mb-2 md:mb-4 tracking-normal">Inovasi dimulai dari</span>
                    Laboratorium yang Rapi.
                </h1>
            </Reveal>

            <Reveal delay={0.3}>
                <p className="max-w-2xl mx-auto text-base md:text-xl text-slate-600 font-light mb-8 md:mb-12 leading-relaxed px-4">
                    Labbo mengintegrasikan peminjaman alat, pelacakan stok, dan keamanan laboratorium kampus dalam satu platform. 
                    <br className="hidden md:block"/><span className="font-medium text-pink-600">Terstruktur. Efisien. Bebas Hambatan.</span>
                </p>
            </Reveal>

            <Reveal delay={0.4}>
                <div className="flex flex-col w-full sm:w-auto sm:flex-row items-center gap-4 px-4">
                     <button className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-pink-600 text-white font-medium rounded-full hover:bg-pink-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                        Mulai Sekarang <ArrowRight className="w-4 h-4" />
                     </button>
                     <button className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-white border border-slate-200 text-slate-700 font-medium rounded-full hover:bg-slate-50 transition-colors">
                        Pelajari Dokumentasi
                     </button>
                </div>
            </Reveal>

            {/* Hero Visual - Dashboard Preview simulation */}
            <Reveal delay={0.6} width="100%">
                 <div className="mt-20 relative w-full max-w-5xl aspect-[16/9] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden group">
                    {/* Mockup Header */}
                    <div className="h-12 border-b border-slate-100 flex items-center px-6 gap-2 bg-slate-50/50">
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-slate-300" />
                             <div className="w-3 h-3 rounded-full bg-slate-300" />
                             <div className="w-3 h-3 rounded-full bg-slate-300" />
                        </div>
                    </div>
                    {/* Mockup Body */}
                    <div className="p-4 md:p-8 grid grid-cols-12 gap-4 md:gap-6 h-full bg-slate-50/30 overflow-y-auto md:overflow-visible">
                        {/* Sidebar */}
                        <div className="col-span-2 hidden md:block space-y-4">
                            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
                            <div className="space-y-2 pt-4">
                                <div className="h-4 w-full bg-slate-100 rounded" />
                                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                <div className="h-4 w-5/6 bg-slate-100 rounded" />
                            </div>
                        </div>
                        {/* Main Content */}
                        <div className="col-span-12 md:col-span-10 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                            {/* Stat Card 1 */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-4"
                            >
                                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center sm:mb-4 shrink-0">
                                    <Microscope className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-800">124</div>
                                    <div className="text-xs md:text-sm text-slate-500">Alat Tersedia</div>
                                </div>
                            </motion.div>
                            
                            {/* Stat Card 2 */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-4"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center sm:mb-4 shrink-0">
                                    <FlaskConical className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-800">12</div>
                                    <div className="text-xs md:text-sm text-slate-500">Peminjaman Aktif</div>
                                </div>
                            </motion.div>

                             {/* Stat Card 3 */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.0 }}
                                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-row sm:flex-col items-center sm:items-start justify-between gap-4"
                            >
                                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center sm:mb-4 shrink-0">
                                    <ClipboardCheck className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-800">98%</div>
                                    <div className="text-xs md:text-sm text-slate-500">Kepatuhan</div>
                                </div>
                            </motion.div>
                            
                            {/* Chart Area */}
                            <div className="col-span-1 sm:col-span-3 h-32 md:h-48 bg-white rounded-2xl border border-slate-100 mt-2 p-4 md:p-6 flex items-end justify-between gap-2 overflow-hidden">
                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 65, 80, 95].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 1 + (i * 0.05), duration: 0.5 }}
                                        className="w-full bg-pink-100 rounded-t-sm relative group"
                                    >
                                        <div className="absolute bottom-0 w-full bg-pink-500 rounded-t-sm transition-all duration-500 group-hover:bg-pink-600" style={{ height: '30%' }} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            </Reveal>
        </div>
    </section>
  );
};
