import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EDSA Power Tracker — Freetown",
  description: "Real-time crowdsourced electricity outage tracker for Freetown, Sierra Leone. Report and check power status in your neighbourhood.",
  keywords: ["EDSA", "power", "electricity", "Freetown", "Sierra Leone", "outage", "light"],
  openGraph: {
    title: "EDSA Power Tracker",
    description: "Know when your area has light. Report outages in Freetown, Sierra Leone.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
