import { useState, useMemo } from 'react';
import { Search, Users as UsersIcon, ShieldCheck, UserCheck, UserX, Mail, Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { Card, Badge, EmptyState, StatCard, Spinner } from '@/components/ui';
import { formatDate, initials } from '@/lib/format';
import { logAudit, notifyUser, adminDeleteUser } from '@/lib/services';

export function AdminUsers({ users, onChange }: { users: Profile[]; onChange: () => void }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(() => users.filter((u) =>
    u.full_name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  ), [users, query]);

  const toggleActive = async (u: Profile) => {
    setBusy(u.id);
    try {
      await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
      await logAudit(u.is_active ? 'user_deactivated' : 'user_activated', 'profiles', u.id);
      if (!u.is_active) await notifyUser(u.id, 'account_activated', 'Account activated', 'Your account is now active.');
      onChange();
    } finally { setBusy(''); }
  };

  const toggleRole = async (u: Profile) => {
    if (u.role === 'admin') return;
    setBusy(u.id);
    try {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', u.id);
      await logAudit('role_changed', 'profiles', u.id, { to: 'admin' });
      await notifyUser(u.id, 'role_promoted', 'Role updated', 'You are now an administrator.');
      onChange();
    } finally { setBusy(''); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(confirmDelete.id);
    setDeleteError('');
    try {
      await adminDeleteUser(confirmDelete.id);
      await logAudit('user_deleted', 'profiles', confirmDelete.id, { email: confirmDelete.email });
      setConfirmDelete(null);
      onChange();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally { setBusy(''); }
  };

  const admins = users.filter((u) => u.role === 'admin').length;
  const active = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-5">
      <div><h1 className="font-display font-bold text-xl flex items-center gap-2"><UsersIcon size={20} /> User Management</h1><p className="text-muted text-sm">{filtered.length} users</p></div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<UsersIcon size={20} />} label="Total Users" value={users.length} color="primary" />
        <StatCard icon={<UserCheck size={20} />} label="Active" value={active} color="success" />
        <StatCard icon={<ShieldCheck size={20} />} label="Admins" value={admins} color="accent" />
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" className="input pl-9 py-2.5" />
        </div>
      </Card>

      {filtered.length === 0 ? <EmptyState icon={<UsersIcon size={28} />} title="No users found" /> : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-[rgb(var(--border))]">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:surface-2 transition">
                <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center font-bold">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials(u.full_name || u.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">{u.full_name || 'Unnamed'} {u.role === 'admin' && <Badge className="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"><ShieldCheck size={11} /> Admin</Badge>}</div>
                  <div className="text-xs text-muted flex items-center gap-1.5"><Mail size={12} /> {u.email}</div>
                  <div className="text-[10px] text-muted mt-0.5">Joined {formatDate(u.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="text-xs text-muted hidden sm:inline">{u.is_active ? 'Active' : 'Inactive'}</span>
                  {busy === u.id ? <Spinner size={16} /> : (
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleActive(u)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${u.is_active ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                        {u.is_active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                      </button>
                      {u.role !== 'admin' && <button onClick={() => toggleRole(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"><ShieldCheck size={13} /> Make admin</button>}
                      {u.role !== 'admin' && (
                        <button onClick={() => { setDeleteError(''); setConfirmDelete(u); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Delete user and all data">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="surface-1 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Delete user permanently?</h2>
                  <p className="text-sm text-muted">This cannot be undone.</p>
                </div>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="text-muted hover:text-foreground transition"><X size={18} /></button>
            </div>

            <div className="surface-2 rounded-xl p-3 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center font-bold text-sm">
                {confirmDelete.avatar_url ? <img src={confirmDelete.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials(confirmDelete.full_name || confirmDelete.email)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{confirmDelete.full_name || 'Unnamed'}</div>
                <div className="text-xs text-muted truncate">{confirmDelete.email}</div>
              </div>
            </div>

            <p className="text-sm text-muted mb-4">
              All of this user's data will be permanently removed: their reports, uploaded photos, notifications, complaints, and audit history. Their account will be deleted and they will no longer be able to sign in.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/20">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={doDelete} disabled={busy === confirmDelete.id} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {busy === confirmDelete.id ? <Spinner size={16} /> : <><Trash2 size={16} /> Delete everything</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
