import { requireAdminSession } from '@/lib/auth';
import AdminManagementPanel from '../AdminManagement';

export default async function AdminManagementPage() {
  // Require authentication
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Admin Management</h1>
        <p className="text-gray-700 mb-8">Create, view, and manage admin accounts</p>

        <AdminManagementPanel />
      </div>
    </div>
  );
}
