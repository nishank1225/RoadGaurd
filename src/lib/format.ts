import type { Severity, ReportStatus, Priority, DamageType } from './types';

export function severityColor(sev: Severity): string {
  return { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }[sev];
}
export function severityBgClass(sev: Severity): string {
  return {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  }[sev];
}

export function statusColor(st: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    submitted: '#64748b', pending: '#f59e0b', under_review: '#525252',
    approved: '#10b981', rejected: '#ef4444', maintenance_assigned: '#404040',
    in_progress: '#06b6d4', completed: '#22c55e', closed: '#64748b',
  };
  return map[st];
}
export function statusBgClass(st: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    submitted: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    maintenance_assigned: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    in_progress: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    closed: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
  };
  return map[st];
}

export function priorityBgClass(p: Priority): string {
  return {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  }[p];
}

export function damageTypeIcon(d: DamageType): string {
  return d;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function initials(name: string): string {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || '?';
}
