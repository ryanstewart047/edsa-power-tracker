import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import FloatingPrompts from "@/components/FloatingPrompts";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "EDSA Native Platform — Sierra Leone",
  description: "Professional native-style power tracking and hazard operations platform for Sierra Leone.",
  manifest: "/manifest.json",
  keywords: ["EDSA", "power", "electricity", "Freetown", "Sierra Leone", "outage", "hazard", "operations"],
  icons: {
    icon: "/assets/edsa-icon-v2-192.png",
    apple: "/assets/edsa-icon-v2-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EDSA Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "EDSA Native Platform",
    description: "Track electricity status, escalate hazards, and manage operations across Sierra Leone.",
    type: "website",
    siteName: "EDSA Native",
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
        window.__swRegistration = reg;

        reg.addEventListener('updatefound', function() {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', function() {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('app-update-ready', { detail: { registration: reg } }));
              }
            });
          }
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('app-update-ready', { detail: { registration: reg } }));
        }
      }).catch(function(err) {
        console.log('SW failed:', err);
      });
    });
  }
`;

import SplashScreen from "@/components/SplashScreen";
import AppOnboarding from "@/components/AppOnboarding";
import LocationGuard from "@/components/LocationGuard";
import MobileBottomNav from "@/components/MobileBottomNav";
import ChatBot from "@/components/ChatBot";
import SiteFooter from "@/components/SiteFooter";
import OperationsNotice from "@/components/OperationsNotice";
import AppUpdateNotification from "@/components/AppUpdateNotification";
import ConnectionErrorModal from "@/components/ConnectionErrorModal";
import EmojiFeedbackModal from "@/components/EmojiFeedbackModal";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "EDSA Native Power Tracker",
  "operatingSystem": "Android, iOS, Windows, macOS",
  "applicationCategory": "UtilitiesApplication",
  "description": "Real-time crowdsourced power outage tracking and hazard reporting for Sierra Leone.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "SLL"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-white text-slate-900 min-h-screen pb-24 md:pb-24 selection:bg-blue-600/20 selection:text-blue-900 antialiased">
        <SplashScreen />
        <AppOnboarding />
        <LocationGuard />
        <OperationsNotice />
        <AppUpdateNotification />
        <ConnectionErrorModal />
        {children}
        <SiteFooter />
        <EmojiFeedbackModal />
        <PWAInstallBanner />
        <FloatingPrompts />
        <MobileBottomNav />
        <ChatBot />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </body>
    </html>
  );
}
