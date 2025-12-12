import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomAuthProvider } from "@/components/auth/custom-auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { BASE_APP_TITLE } from "@/lib/page-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BASE_APP_TITLE,
  description: "A comprehensive laboratory equipment inventory management system",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <CustomAuthProvider>
            {children}
          </CustomAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
