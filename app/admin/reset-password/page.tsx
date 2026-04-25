import Link from 'next/link';
import AuthShell from '../AuthShell';
import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset admin password"
      description="Use your secure reset link to set a new password and return to operations."
      footer={<>Need a fresh link? <Link href="/admin/forgot-password" className="font-semibold text-yellow-300 hover:text-yellow-200">Request another reset email</Link>.</>}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
