import { X, Bell, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NotificationItem } from '@/lib/types';
import { timeAgo } from '@/lib/format';

export function NotificationsPanel({ notifs, onClose, onReload }: {
  notifs: NotificationItem[]; onClose: () => void; onReload: () => void;
}) {
  const markAll = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    onReload();
  };
  const markOne = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    onReload();
  };

  const icon = (type: string) => {
    if (type.includes('approve') || type.includes('completed')) return <CheckCircle2 size={18} className="text-emerald-500" />;
    if (type.includes('reject') || type.includes('danger')) return <AlertCircle size={18} className="text-red-500" />;
    if (type.includes('alert')) return <ShieldAlert size={18} className="text-orange-500" />;
    return <Info size={18} className="text-primary-500" />;
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-sm h-full surface border-l border-base shadow-2xl animate-slide-in flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-base">
          <div className="flex items-center gap-2 font-display font-bold"><Bell size={18} /> Notifications</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:surface-2"><X size={18} /></button>
        </div>
        {notifs.length > 0 && (
          <button onClick={markAll} className="text-xs text-primary-600 font-medium px-4 py-2 text-left hover:surface-2">Mark all as read</button>
        )}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted py-10">
              <Bell size={36} className="opacity-30 mb-3" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : notifs.map((n) => (
            <button key={n.id} onClick={() => markOne(n.id)} className={`w-full text-left p-4 border-b border-base flex gap-3 hover:surface-2 transition ${!n.read ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''}`}>
              <div className="mt-0.5">{icon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</div>
                <div className="text-[10px] text-muted mt-1">{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
