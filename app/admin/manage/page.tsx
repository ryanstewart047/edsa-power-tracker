import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth';
import AdminManagementPanel from '../AdminManagement';
import { redirect } from 'next/navigation';

export default async function AdminManagementPage() {
  // Require authentication
  const admin = await requireAdminSession();

  // Restrict to super admins only
  if (!admin.isSuperAdmin) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Admin Management</h1>
            <p className="text-gray-700">Create, view, and manage admin accounts</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <AdminManagementPanel />
      </div>
    </div>
  );
}
