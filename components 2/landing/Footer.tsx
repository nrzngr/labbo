"use client";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-slate-100 bg-white text-center">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-80">
               <Image src="/logo.svg" alt="Labbo Logo" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-slate-500 text-sm">
                    &copy; 2024 Labbo Systems. Didesain untuk kemajuan riset kampus.
                </p>
                <div className="flex gap-4 justify-center text-xs text-slate-400">
                    <a href="#" className="hover:text-pink-600">Kebijakan Privasi</a>
                    <a href="#" className="hover:text-pink-600">Syarat & Ketentuan</a>
                    <a href="#" className="hover:text-pink-600">Bantuan</a>
                </div>
            </div>
        </div>
    </footer>
  );
};
