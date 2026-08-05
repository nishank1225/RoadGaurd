import { useState, useMemo } from 'react';
import { Search, FileDown, FileText, Trash2, Share2, Filter, History as HistoryIcon, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Report, ReportStatus, DamageType, Severity } from '@/lib/types';
import { DAMAGE_TYPE_LABEL, DAMAGE_TYPES, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui';
import { severityBgClass, statusBgClass, formatDateTime, timeAgo } from '@/lib/format';
import { exportReportsCSV, exportReportsPDF } from '@/lib/export';
import { useAuth } from '@/context/AuthContext';
import { ReportDetail } from '@/components/ReportDetail';

export function UserHistory({ reports, onChange }: { reports: Report[]; onChange: () => void }) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [sort, setSort] = useState<'new' | 'old' | 'sev'>('new');
  const [selected, setSelected] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState('');

  const filtered = useMemo(() => {
    let r = reports.filter((rep) =>
      (statusFilter === 'all' || rep.status === statusFilter) &&
      (sevFilter === 'all' || rep.severity === sevFilter) &&
      (DAMAGE_TYPE_LABEL[rep.damage_type].toLowerCase().includes(query.toLowerCase()) || rep.location_text.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === 'new') r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'old') r = [...r].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'sev') {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      r = [...r].sort((a, b) => order[a.severity] - order[b.severity]);
    }
    return r;
  }, [reports, query, statusFilter, sevFilter, sort]);

  const canDelete = (r: Report) => ['pending', 'submitted', 'under_review'].includes(r.status);

  const del = async (id: string) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await supabase.from('reports').delete().eq('id', id);
      onChange();
    } finally { setDeleting(''); }
  };

  const share = async (r: Report) => {
    const url = `${location.origin}/report/${r.id}`;
    if (navigator.share) try { await navigator.share({ title: 'RoadGuard Report', text: `${DAMAGE_TYPE_LABEL[r.damage_type]} - ${SEVERITY_LABEL[r.severity]}`, url }); return; } catch {}
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
  };

  if (selected) return <ReportDetail report={selected} onClose={() => setSelected(null)} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display font-bold text-xl flex items-center gap-2"><HistoryIcon size={20} /> Report History</h1><p className="text-muted text-sm">{filtered.length} reports</p></div>
        <div className="flex gap-2">
          <button onClick={() => exportReportsCSV(filtered)} className="btn-ghost text-sm"><FileDown size={16} /> CSV</button>
          <button onClick={() => exportReportsPDF(filtered, profile || undefined)} className="btn-ghost text-sm"><FileText size={16} /> PDF</button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reports…" className="input pl-9 py-2.5" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input py-2.5 w-auto">
            <option value="all">All status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} className="input py-2.5 w-auto">
            <option value="all">All severity</option>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input py-2.5 w-auto">
            <option value="new">Newest</option><option value="old">Oldest</option><option value="sev">Severity</option>
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter size={28} />} title="No reports found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 hover:shadow-card-hover transition cursor-pointer" onClick={() => setSelected(r)}>
              <div className="flex gap-4">
                <img src={r.image_url} className="w-20 h-20 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display font-semibold">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                      <div className="text-xs text-muted mt-0.5">{formatDateTime(r.created_at)} • {timeAgo(r.created_at)}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`badge ${severityBgClass(r.severity)}`}>{SEVERITY_LABEL[r.severity]}</span>
                      <span className={`badge ${statusBgClass(r.status)}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>Confidence {(r.confidence * 100).toFixed(0)}%</span>
                    <span>Health {r.road_health_score}</span>
                    {r.location_text && <span className="truncate">{r.location_text}</span>}
                  </div>
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setSelected(r)} className="text-xs text-primary-600 font-medium flex items-center gap-1 hover:underline"><Eye size={13} /> View</button>
                    <button onClick={() => share(r)} className="text-xs text-muted flex items-center gap-1 hover:text-[rgb(var(--text))]"><Share2 size={13} /> Share</button>
                    {canDelete(r) && <button onClick={() => del(r.id)} disabled={deleting === r.id} className="text-xs text-red-500 flex items-center gap-1 hover:underline ml-auto">{deleting === r.id ? <Spinner size={13} /> : <><Trash2 size={13} /> Delete</>}</button>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
