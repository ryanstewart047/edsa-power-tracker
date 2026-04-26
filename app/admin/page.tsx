import AdminDashboard from './AdminDashboard';
import { requireAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdminSession();
  return <AdminDashboard adminEmail={admin.email} isSuperAdmin={admin.isSuperAdmin} />;
}
