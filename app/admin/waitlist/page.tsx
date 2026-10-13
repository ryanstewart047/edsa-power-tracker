import { requireAdminSession } from '@/lib/auth';
import WaitlistPanel from './WaitlistPanel';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WaitlistAdminPage() {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="relative z-10 p-6 md:p-10 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Email Waitlist</h1>
            <p className="text-gray-400 text-sm mt-0.5">Users who opted in for the Play Store download link</p>
          </div>
        </div>
        <WaitlistPanel />
      </div>
    </div>
  );
}
