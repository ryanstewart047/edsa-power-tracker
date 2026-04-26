'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import AuthShell from '../AuthShell';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/admin/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        } else {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/admin/login');
          }, 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email');
        console.error(error);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <AuthShell
      title="Verify Your Email"
      description="Complete your admin account setup"
    >
      <div className="space-y-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            <p className="text-gray-300">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="text-green-400" size={48} />
            <p className="text-green-300">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="text-red-400" size={48} />
            <p className="text-red-300">{message}</p>
            <a
              href="/admin/login"
              className="inline-block mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition font-medium"
            >
              Back to Login
            </a>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
