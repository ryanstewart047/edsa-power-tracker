'use client';

import Link from 'next/link';
import { MessageSquare, ShieldCheck, FileText, Trash2 } from 'lucide-react';

export const legalAndSupportLinks = [
  { 
    href: '/feedback', 
    label: 'Give Feedback',
    icon: MessageSquare,
    description: 'Share bug reports & suggestions'
  },
  { 
    href: '/privacy', 
    label: 'Privacy Policy',
    icon: ShieldCheck,
    description: 'Data protection & security'
  },
  { 
    href: '/terms', 
    label: 'Terms & Conditions',
    icon: FileText,
    description: 'User guidelines & terms'
  },
  { 
    href: '/data-deletion', 
    label: 'Data Deletion',
    icon: Trash2,
    description: 'Request user data removal'
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-slate-200/80 bg-slate-50 px-4 pt-10 pb-36 md:pb-20 text-center">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Support & Legal Links Nav */}
        <nav aria-label="Support and legal links" className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          {legalAndSupportLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (link.href === '/feedback') {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('open-emoji-feedback'));
                    }
                  }
                }}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-blue-500/40 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              >
                <Icon className="w-3.5 h-3.5 text-blue-600 transition-colors" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Branding & Ownership */}
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold text-slate-700">
            EDSA Power Tracker • BridgeTech IT Services
          </p>
          <p className="text-[11px] text-slate-500">
            Real-time power monitoring and community hazard escalation for Sierra Leone
          </p>
          <p className="pt-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
