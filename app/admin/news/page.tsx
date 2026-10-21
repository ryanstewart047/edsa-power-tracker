import { requireAdminSession } from '@/lib/auth';
import NewsManagementPanel from './NewsManagementPanel';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative z-10 p-4 sm:p-8 max-w-6xl mx-auto">
        <NewsManagementPanel />
      </div>
    </div>
  );
}
