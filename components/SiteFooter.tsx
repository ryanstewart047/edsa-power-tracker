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
    <footer className="relative z-20 border-t border-white/10 bg-[#020617] px-4 pt-10 pb-36 md:pb-20 text-center">
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
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/40 text-xs font-semibold text-gray-300 hover:text-yellow-300 transition-all shadow-sm active:scale-95"
              >
                <Icon className="w-3.5 h-3.5 text-yellow-400/80 group-hover:text-yellow-400 transition-colors" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Branding & Ownership */}
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold text-gray-400">
            EDSA Power Tracker • BridgeTech IT Services
          </p>
          <p className="text-[11px] text-gray-500">
            Real-time power monitoring and community hazard escalation for Sierra Leone
          </p>
          <p className="pt-2 text-[10px] font-mono uppercase tracking-widest text-gray-600">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
