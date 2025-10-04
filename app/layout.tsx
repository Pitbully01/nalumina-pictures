import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// ===== FONT CONFIGURATION =====
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ===== METADATA =====
export const metadata: Metadata = {
  title: "Nalumina Pictures",
  description: "Professional photo gallery management system",
};

// ===== LAYOUT COMPONENT =====
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <nav className="p-4 border-b flex gap-4">
          <a href="/">Home</a>
          <a href="/galleries">Meine Galerien</a>
        </nav>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
