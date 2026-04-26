'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Eye, EyeOff, AlertCircle, CheckCircle, Crown, RefreshCw } from 'lucide-react';

type Admin = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminManagementPanel() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch admins');
      const data = await response.json();
      setAdmins(data.admins);
      setError('');
    } catch (err) {
      setError('Failed to load admins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newAdminEmail || !newAdminPassword) {
      setError('Email and password are required');
      return;
    }

    if (newAdminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          isSuperAdmin,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create admin');

      setSuccess(data.message || `Admin created: ${newAdminEmail}`);
      
      // If we are in local development and the email failed, console log the URL for easy clicking
      if (data.previewVerificationUrl && !data.emailSent) {
        console.warn(`Local Dev Verification URL for ${newAdminEmail}: `, data.previewVerificationUrl);
        setSuccess(prev => prev + ` Check console for verification link!`);
      }

      setNewAdminEmail('');
      setNewAdminPassword('');
      setIsSuperAdmin(false);
      setShowForm(false);
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      setDeletingId(adminId);
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      setSuccess(`Admin deleted: ${email}`);
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 backdrop-blur-md">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex gap-3 backdrop-blur-md">
          <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Access Control</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition-all font-bold text-sm shadow-xl shadow-yellow-500/20"
          >
            <Plus size={18} />
            Add New Admin
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreateAdmin}
            className="mb-8 p-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@edsa.sl"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-yellow-500/50 text-white placeholder-gray-600 transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">Security Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-yellow-500/50 text-white placeholder-gray-600 transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  id="isSuperAdmin"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-5 h-5 rounded border-white/10 bg-black/20 checked:bg-yellow-500 focus:ring-0 transition-all cursor-pointer"
                />
                <label htmlFor="isSuperAdmin" className="text-sm font-bold text-gray-300 cursor-pointer">
                  Grant Super Admin Privileges
                </label>
              </div>

              <div className="flex gap-3 md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-all font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-500/10"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Account Type</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Created</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Updated</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                  No administrative accounts found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-6 py-5 text-sm font-bold text-white">{admin.email}</td>
                  <td className="px-6 py-5">
                    {admin.isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        <Crown size={12} />
                        Super Admin
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter bg-white/5 px-3 py-1 rounded-full border border-white/5">Operator</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                    {new Date(admin.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                    {new Date(admin.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      disabled={deletingId === admin.id}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-50"
                      title="Revoke access"
                    >
                      {deletingId === admin.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
