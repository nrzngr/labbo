"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const width = useTransform(scrollY, [0, 100], ["100%", "80%"]);
  const top = useTransform(scrollY, [0, 100], ["0px", "20px"]);
  const borderRadius = useTransform(scrollY, [0, 100], ["0px", "9999px"]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none">
      <motion.nav
        style={{ width, top, borderRadius }}
        className={cn(
          "pointer-events-auto transition-all duration-300 px-6 py-4 flex items-center justify-between",
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg text-slate-800" 
            : "bg-transparent border-transparent text-slate-800" // Always dark text for white background
        )}
      >
        <div className="flex items-center gap-2">
           <Image src="/logo.svg" alt="Labbo Logo" width={64} height={64} className="w-12 h-12 md:w-16 md:h-16" />
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Fitur
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Testimoni
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Masuk
          </Link>
        </div>

        <div className="flex items-center gap-4">
            <Link href="/login" className="md:hidden text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Masuk
          </Link>
          <button className="group relative px-6 py-2 bg-pink-600 overflow-hidden rounded-full shadow-md hover:shadow-lg transition-all text-white text-sm font-medium">
             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
             <span className="relative z-10">Ajukan Demo</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
};
