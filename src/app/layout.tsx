import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Care Clinic - Management System",
  description: "Modern, high-performance Clinic Management System with Glassmorphism UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b1329] text-[#f8fafc] relative">
        {/* Floating background blur blobs for Glassmorphism */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-float-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px] animate-float-reverse-slow" />
          <div className="absolute top-[40%] right-[15%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[100px] animate-float-slow" />
        </div>
        
        {/* Layout wrapper */}
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
