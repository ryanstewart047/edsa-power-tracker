import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import FloatingPrompts from "@/components/FloatingPrompts";

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
  window.deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('SW registered:', reg.scope);
      }).catch(function(err) {
        console.log('SW failed:', err);
      });
    });
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        {children}
        <PWAInstallBanner />
        <FloatingPrompts />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </body>
    </html>
  );
}
