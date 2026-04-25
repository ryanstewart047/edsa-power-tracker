import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthShell from '../AuthShell';
import LoginForm from './LoginForm';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const admin = await getAdminSession();
  if (admin) {
    redirect('/admin');
  }

  return (
    <AuthShell
      title="Administrator access"
      description="Use your secure credentials to enter the EDSA admin workspace."
      footer={
        <>
          Public users can continue to the <Link href="/tracker" className="font-semibold text-yellow-300 hover:text-yellow-200">live tracker</Link>.
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
