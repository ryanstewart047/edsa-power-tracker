import Link from 'next/link';
import AuthShell from '../AuthShell';
import ForgotPasswordForm from './ForgotPasswordForm';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recover administrator access"
      description="Generate a secure password reset request for your EDSA admin account."
      footer={<>Remembered your password? <Link href="/admin/login" className="font-semibold text-yellow-300 hover:text-yellow-200">Go back to sign in</Link>.</>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
