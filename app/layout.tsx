import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EDSA Native Platform — Freetown",
  description: "Professional native-style power tracking and hazard operations platform for Freetown, Sierra Leone.",
  manifest: "/manifest.json",
  keywords: ["EDSA", "power", "electricity", "Freetown", "Sierra Leone", "outage", "hazard", "operations"],
  openGraph: {
    title: "EDSA Native Platform",
    description: "Track electricity status, escalate hazards, and manage operations across Freetown.",
    type: "website",
  },
};

const swScript = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js');
    });
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        {children}
        <PWAInstallBanner />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </body>
    </html>
  );
}
