'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home, KeyRound } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[EDSA ErrorBoundary]', error);
  }, [error]);

  const isNetworkOrVercelError =
    error?.message?.includes('verify your browser') ||
    error?.message?.includes('code 99') ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('network');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white border border-slate-200 p-8 text-center shadow-xl shadow-slate-900/5 relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5 text-amber-600 shadow-sm">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          {isNetworkOrVercelError ? 'Connection Interrupted' : 'Temporary Loading Issue'}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {isNetworkOrVercelError
            ? 'We were unable to establish a secure connection to the EDSA servers. Please check your mobile data or Wi-Fi and tap retry.'
            : 'Something unexpected happened while loading this page. Your saved data and offline token vault remain safe.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/topup?tab=vault"
            className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Open Offline Token Vault</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
