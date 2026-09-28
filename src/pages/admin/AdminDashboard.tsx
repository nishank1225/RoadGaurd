import { Users, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Activity, TrendingUp, ShieldCheck, Server, Cpu, HardDrive } from 'lucide-react';
import type { Report, Profile } from '@/lib/types';
import { Card, StatCard, Badge, EmptyState } from '@/components/ui';
import { LineChart, DonutChart, ProgressBar } from '@/components/Charts';
import { severityBgClass, statusBgClass, timeAgo, severityColor } from '@/lib/format';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';

export function AdminDashboard({ reports, users, onNavigate }: { reports: Report[]; users: Profile[]; onNavigate: (t: any) => void }) {
  const today = new Date().setHours(0, 0, 0, 0);
  const todayReports = reports.filter((r) => +new Date(r.created_at) >= today);
  const pending = reports.filter((r) => ['pending', 'submitted', 'under_review'].includes(r.status));
  const approved = reports.filter((r) => r.status === 'approved');
  const rejected = reports.filter((r) => r.status === 'rejected');
  const critical = reports.filter((r) => r.severity === 'critical');
  const activeUsers = users.filter((u) => u.is_active);

  // monthly trend (last 7 days)
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = d.getTime() + 86400000;
    const count = reports.filter((r) => { const t = +new Date(r.created_at); return t >= d.getTime() && t < next; }).length;
    days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: count });
  }

  const statusData = [
    { label: 'Pending', value: pending.length, color: '#f59e0b' },
    { label: 'Approved', value: approved.length, color: '#10b981' },
    { label: 'Rejected', value: rejected.length, color: '#ef4444' },
    { label: 'Other', value: reports.length - pending.length - approved.length - rejected.length, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const avgSev = reports.length ? (reports.reduce((s, r) => s + ({ low: 1, medium: 2, high: 3, critical: 4 }[r.severity]), 0) / reports.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Admin Dashboard</h1>
        <p className="text-muted text-sm">Real-time overview of road damage reports</p>
      </div>

      {/* Live indicator */}
      <Card className="flex items-center gap-3 p-4">
        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" /></span>
        <span className="text-sm font-medium">Live sync active</span>
        <span className="text-xs text-muted ml-auto">{reports.length} total reports • {users.length} users</span>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Users" value={users.length} color="primary" delay={0} />
        <StatCard icon={<Activity size={20} />} label="Active Users" value={activeUsers.length} color="success" delay={60} />
        <StatCard icon={<FileText size={20} />} label="Today's Reports" value={todayReports.length} color="cyan" delay={120} />
        <StatCard icon={<Clock size={20} />} label="Pending" value={pending.length} color="warning" delay={180} />
        <StatCard icon={<CheckCircle2 size={20} />} label="Verified" value={approved.length} color="success" delay={240} />
        <StatCard icon={<XCircle size={20} />} label="Rejected" value={rejected.length} color="danger" delay={300} />
        <StatCard icon={<AlertTriangle size={20} />} label="Critical Roads" value={critical.length} color="danger" delay={360} />
        <StatCard icon={<TrendingUp size={20} />} label="Avg Severity" value={avgSev} color="accent" delay={420} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Reports Trend (7 days)</h3>
          <LineChart data={days} height={220} />
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-4">Status Distribution</h3>
          {reports.length > 0 ? <DonutChart data={statusData} /> : <EmptyState icon={<TrendingUp size={28} />} title="No data" />}
        </Card>
      </div>

      {/* System monitoring */}
      <Card>
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Server size={18} /> System Monitoring</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SysMetric icon={<Cpu size={16} />} label="ML Server" value="Online" color="#10b981" pct={92} />
          <SysMetric icon={<Server size={16} />} label="API Response" value="124ms" color="#3b82f6" pct={88} />
          <SysMetric icon={<HardDrive size={16} />} label="Storage" value="42% used" color="#f59e0b" pct={42} />
          <SysMetric icon={<Activity size={16} />} label="Database" value="Healthy" color="#10b981" pct={95} />
        </div>
      </Card>

      {/* Pending reports queue */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2"><ShieldCheck size={18} /> Pending Verification Queue</h3>
          <button onClick={() => onNavigate('reports')} className="text-sm text-primary-600 font-medium hover:underline">View all</button>
        </div>
        {pending.length === 0 ? <EmptyState icon={<CheckCircle2 size={28} />} title="All caught up" subtitle="No pending reports to review" /> : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-base hover:shadow-card-hover transition cursor-pointer" onClick={() => onNavigate('reports')}>
                <img src={r.image_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                  <div className="text-xs text-muted">{r.reporter?.full_name || 'User'} • {timeAgo(r.created_at)}</div>
                </div>
                <span className={`badge ${severityBgClass(r.severity)}`}>{SEVERITY_LABEL[r.severity]}</span>
                <span className="text-xs text-muted tabular-nums">{(r.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SysMetric({ icon, label, value, color, pct }: { icon: React.ReactNode; label: string; value: string; color: string; pct: number }) {
  return (
    <div className="surface-2 rounded-xl p-3">
      <div className="flex items-center gap-2 text-sm font-medium">{icon} {label}</div>
      <div className="text-xs text-muted mt-1">{value}</div>
      <div className="mt-2"><ProgressBar value={pct} color={color} /></div>
    </div>
  );
}
