import { useMemo } from 'react';
import { BarChart3, TrendingUp, Target, PieChart } from 'lucide-react';
import type { Report, Profile } from '@/lib/types';
import { Card, EmptyState } from '@/components/ui';
import { BarChart, LineChart, DonutChart, ProgressBar } from '@/components/Charts';
import { DAMAGE_TYPE_LABEL, DAMAGE_TYPES, SEVERITY_LABEL } from '@/lib/types';
import { severityColor } from '@/lib/format';

export function AdminAnalytics({ reports, users }: { reports: Report[]; users: Profile[] }) {
  const byType = useMemo(() => DAMAGE_TYPES.map((d) => ({
    label: d.label, value: reports.filter((r) => r.damage_type === d.value).length,
    color: ['#2563eb', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#06b6d4'][DAMAGE_TYPES.indexOf(d)],
  })), [reports]);

  const bySeverity = useMemo(() => (['low', 'medium', 'high', 'critical'] as const).map((s) => ({
    label: SEVERITY_LABEL[s], value: reports.filter((r) => r.severity === s).length, color: severityColor(s),
  })), [reports]);

  const monthly = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setMonth(next.getMonth() + 1);
      const count = reports.filter((r) => { const t = +new Date(r.created_at); return t >= d.getTime() && t < next.getTime(); }).length;
      months.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), value: count });
    }
    return months;
  }, [reports]);

  const avgConfidence = reports.length ? (reports.reduce((s, r) => s + r.confidence, 0) / reports.length) * 100 : 0;
  const avgHealth = reports.length ? Math.round(reports.reduce((s, r) => s + r.road_health_score, 0) / reports.length) : 100;
  const verified = reports.filter((r) => ['approved', 'rejected'].includes(r.status)).length;
  const accuracy = verified ? Math.round((reports.filter((r) => r.status === 'approved').length / verified) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-bold text-xl flex items-center gap-2"><BarChart3 size={20} /> Analytics</h1><p className="text-muted text-sm">Insights from road damage data</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 text-muted text-sm"><Target size={16} /> Avg Confidence</div><div className="text-2xl font-bold font-display mt-1">{avgConfidence.toFixed(1)}%</div><div className="mt-2"><ProgressBar value={avgConfidence} color="#3b82f6" /></div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted text-sm"><TrendingUp size={16} /> Avg Health</div><div className="text-2xl font-bold font-display mt-1">{avgHealth}</div><div className="mt-2"><ProgressBar value={avgHealth} color={avgHealth > 70 ? '#10b981' : '#f59e0b'} /></div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted text-sm"><PieChart size={16} /> Verification</div><div className="text-2xl font-bold font-display mt-1">{accuracy}%</div><div className="mt-2"><ProgressBar value={accuracy} color="#10b981" /></div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-muted text-sm"><BarChart3 size={16} /> Total Users</div><div className="text-2xl font-bold font-display mt-1">{users.length}</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">Monthly Reports</h3>
          {reports.length > 0 ? <LineChart data={monthly} height={240} /> : <EmptyState icon={<TrendingUp size={28} />} title="No data" />}
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-4">Damage Categories</h3>
          {reports.length > 0 ? <BarChart data={byType} height={240} /> : <EmptyState icon={<BarChart3 size={28} />} title="No data" />}
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold mb-4">Severity Distribution</h3>
        {reports.length > 0 ? <DonutChart data={bySeverity} size={180} /> : <EmptyState icon={<PieChart size={28} />} title="No data" />}
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-4">Prediction Accuracy by Type</h3>
        <div className="space-y-3">
          {DAMAGE_TYPES.map((d) => {
            const typeReports = reports.filter((r) => r.damage_type === d.value);
            const avg = typeReports.length ? (typeReports.reduce((s, r) => s + r.confidence, 0) / typeReports.length) * 100 : 0;
            return (
              <div key={d.value}>
                <div className="flex justify-between text-sm mb-1"><span>{d.label}</span><span className="text-muted tabular-nums">{typeReports.length} reports • {avg.toFixed(0)}%</span></div>
                <ProgressBar value={avg} color="#2563eb" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
