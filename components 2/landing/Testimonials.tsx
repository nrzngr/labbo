"use client";

import { Reveal } from "@/components/ui/Reveal";

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 md:py-40 px-4 max-w-5xl mx-auto flex flex-col items-center text-center relative">
         <div className="absolute inset-0 bg-pink-100 blur-[150px] rounded-full pointer-events-none opacity-50" />
         
         <Reveal>
            <blockquote className="relative z-10 px-4">
                <p className="text-xl md:text-4xl font-light text-slate-800 italic leading-relaxed mb-8 md:mb-10">
                    "Labbo bukan sekadar software. Sistem ini mengubah kekacauan administrasi laboratorium menjadi keteraturan yang presisi. Mahasiswa senang, dosen tenang."
                </p>
                <footer className="flex flex-col items-center gap-2">
                    <cite className="not-italic text-sm font-bold tracking-widest text-pink-600 uppercase">
                        Prof. Dr. Muhammad Ridzki Nugraha S.Kom, M.Sc, PhD
                    </cite>
                    <span className="text-xs text-slate-500 font-mono">Kepala Lab Teknik Komputer - Konoha Daikoku University</span>
                </footer>
            </blockquote>
         </Reveal>
    </section>
  );
};
