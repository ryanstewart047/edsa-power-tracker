'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewResetUrl(null);

    try {
      const response = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create password reset request.');
      }

      setSuccess(data.message || 'If the email exists, a reset link has been sent.');
      setPreviewResetUrl(data.previewResetUrl || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-300/80">Password recovery</p>
        <h2 className="text-2xl font-bold">Forgot your admin password?</h2>
        <p className="text-sm leading-6 text-gray-400">
          Enter your admin email and we&apos;ll create a secure reset link for your account.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Admin email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@edsa.sl"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400/50"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="space-y-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">
            <p>{success}</p>
            {previewResetUrl ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-gray-200">
                <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-yellow-300/80">Preview reset link</p>
                <Link href={previewResetUrl} className="break-all font-semibold text-yellow-300 hover:text-yellow-200">
                  {previewResetUrl}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? 'Creating reset request...' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
}
