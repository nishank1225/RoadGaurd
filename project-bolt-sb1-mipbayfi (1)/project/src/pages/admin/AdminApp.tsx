import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, FileText, Users, Map as MapIcon, BarChart3, Bell, ShieldCheck, Moon, Sun, LogOut, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Report, Profile, NotificationItem } from '@/lib/types';
import { Header } from '@/pages/user/UserApp';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminMap } from '@/pages/admin/AdminMap';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { initials } from '@/lib/format';

type Tab = 'dashboard' | 'reports' | 'users' | 'map' | 'analytics';

export function AdminApp() {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const loadReports = useCallback(async () => {
    const { data } = await supabase.from('reports').select('*, reporter:profiles!reports_user_id_fkey(id,full_name,email,avatar_url)').order('created_at', { ascending: false });
    setReports((data ?? []) as unknown as Report[]);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data ?? []) as Profile[]);
  }, []);

  const loadNotifs = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20);
    setNotifs((data ?? []) as NotificationItem[]);
  }, [profile]);

  useEffect(() => {
    loadReports(); loadUsers(); loadNotifs();
  }, [loadReports, loadUsers, loadNotifs]);

  useEffect(() => {
    const ch = supabase.channel('admin-reports').on('postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      () => { loadReports(); }).subscribe();
    const uch = supabase.channel('admin-users').on('postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => loadUsers()).subscribe();
    const nch = supabase.channel('admin-notifs').on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile?.id}` },
      () => loadNotifs()).subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(uch); supabase.removeChannel(nch); };
  }, [loadReports, loadUsers, loadNotifs, profile]);

  const unread = notifs.filter((n) => !n.read).length;

  const nav: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'map', label: 'Map', icon: MapIcon },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-base surface sticky top-0 h-screen">
        <div className="p-5 flex items-center gap-2.5 border-b border-base">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
          <div><div className="font-display font-bold leading-none">RoadGuard</div><div className="text-[10px] text-muted">Admin Console</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon; const active = tab === n.key;
            return <button key={n.key} onClick={() => setTab(n.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? 'bg-primary-600 text-white shadow-sm' : 'hover:surface-2 text-muted'}`}>
              <Icon size={18} /> {n.label}
            </button>;
          })}
        </nav>
        <div className="p-3 border-t border-base">
          <div className="flex items-center gap-2.5 p-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center text-xs font-bold">{profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full" alt="" /> : initials(profile?.full_name || 'A')}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{profile?.full_name}</div><div className="text-[10px] text-muted">Administrator</div></div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:surface-2 text-muted"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} theme={theme} toggleTheme={toggle} unread={unread} onBell={() => setShowNotifs(true)} onSignOut={signOut} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
          {tab === 'dashboard' && <AdminDashboard reports={reports} users={users} onNavigate={setTab} />}
          {tab === 'reports' && <AdminReports reports={reports} onChange={loadReports} />}
          {tab === 'users' && <AdminUsers users={users} onChange={loadUsers} />}
          {tab === 'map' && <AdminMap reports={reports} />}
          {tab === 'analytics' && <AdminAnalytics reports={reports} users={users} />}
        </main>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-base">
          <div className="flex items-center justify-around h-16">
            {nav.map((n) => { const Icon = n.icon; const active = tab === n.key; return (
              <button key={n.key} onClick={() => setTab(n.key)} className="flex flex-col items-center gap-0.5 flex-1 py-2">
                <Icon size={20} className={active ? 'text-primary-600' : 'text-muted'} />
                <span className={`text-[10px] ${active ? 'text-primary-600 font-semibold' : 'text-muted'}`}>{n.label}</span>
              </button>); })}
          </div>
        </nav>
      </div>
      {showNotifs && <NotificationsPanel notifs={notifs} onClose={() => setShowNotifs(false)} onReload={loadNotifs} />}
    </div>
  );
}
