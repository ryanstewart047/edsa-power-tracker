import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IncidentConsole from './IncidentConsole';

export default async function IncidentsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  return <IncidentConsole adminEmail={admin.email} />;
}
