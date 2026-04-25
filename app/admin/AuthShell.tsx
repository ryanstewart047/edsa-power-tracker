import Link from 'next/link';
import { ShieldCheck, Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_34%),linear-gradient(180deg,_#07111b_0%,_#04060b_48%,_#020305_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <section className="max-w-xl space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-200 hover:bg-white/10"
          >
            <Zap className="h-4 w-4" />
            EDSA Native Platform
          </Link>

          <div className="space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-500/15 ring-1 ring-yellow-400/25">
              <ShieldCheck className="h-8 w-8 text-yellow-300" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">{title}</h1>
            <p className="text-lg leading-8 text-gray-300">{description}</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-gray-300">
            Professional admin access is separated from the public tracker so operations, reporting, and account recovery stay secure and controlled.
          </div>
        </section>

        <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          {children}
          {footer ? <div className="mt-6 border-t border-white/10 pt-5 text-sm text-gray-400">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
