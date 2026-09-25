import AdminOperations from './AdminOperations';
import { requireAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminOperationsPage() {
  const admin = await requireAdminSession();
  return <AdminOperations adminEmail={admin.email} />;
}
