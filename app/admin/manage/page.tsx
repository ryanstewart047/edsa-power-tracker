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
    <div className="min-h-screen relative text-white selection:bg-yellow-500/30 overflow-x-hidden bg-[#020617]">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/assets/bg-action.png")',
          filter: 'brightness(0.2) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#020617]/90 to-[#020617]" />

      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2 text-white tracking-tight">Admin Management</h1>
            <p className="text-gray-400 font-medium">Create, view, and manage secure operational access</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-6 py-3 border border-white/10 shadow-xl text-sm font-bold rounded-2xl text-white bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all active:scale-95"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <AdminManagementPanel />
      </div>
    </div>
  );
}
