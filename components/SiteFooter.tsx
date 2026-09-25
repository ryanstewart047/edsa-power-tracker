import Link from 'next/link';

const footerLinks = [
  { href: '/feedback', label: 'Give Feedback' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/data-deletion', label: 'Data Deletion' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-4 py-7 text-center">
      <nav aria-label="Support and legal links" className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-3">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs font-semibold text-gray-400 transition-colors hover:text-yellow-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-gray-600">
        © {new Date().getFullYear()} EDSA Power Tracker
      </p>
    </footer>
  );
}
