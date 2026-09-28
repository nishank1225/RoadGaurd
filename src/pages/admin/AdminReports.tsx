import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Filter, CheckCircle2, XCircle, Eye, Settings2, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Report, ReportStatus, Severity } from '@/lib/types';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { Card, Badge, EmptyState } from '@/components/ui';
import { severityBgClass, statusBgClass, formatDateTime } from '@/lib/format';
import { ReportDetail } from '@/components/ReportDetail';
import { exportReportsCSV } from '@/lib/export';
import { FileDown } from 'lucide-react';
import { getAppSettings, updateDailyReportLimit } from '@/lib/services';

function DailyLimitControl() {
  const [current, setCurrent] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAppSettings()
      .then((s) => { setCurrent(s.daily_report_limit); setDraft(String(s.daily_report_limit)); })
      .catch(() => setError('Could not load settings'));
  }, []);

  const isDirty = current !== null && draft !== '' && Number(draft) !== current;

  const handleSave = async () => {
    const val = Number(draft);
    if (!Number.isInteger(val) || val < 1 || val > 1000) {
      setError('Enter a whole number between 1 and 1000');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateDailyReportLimit(val);
      setCurrent(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 size={16} className="text-primary-500" />
        <span className="font-semibold text-sm">Daily Report Limit</span>
        <span className="text-xs text-muted ml-auto">per user per day</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[140px]">
          <input
            type="number"
            min={1}
            max={1000}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(''); setSaved(false); }}
            className="input py-2.5 pr-4 text-center font-bold text-lg w-full"
            disabled={current === null}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save'}
        </button>

        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <p className="text-xs text-muted mt-2">
        Users who reach this limit will be blocked from submitting more reports until midnight.
      </p>
    </Card>
  );
}

export function AdminReports({ reports, onChange }: { reports: Report[]; onChange: () => void }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [selected, setSelected] = useState<Report | null>(null);

  const filtered = useMemo(() => reports.filter((r) =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (sevFilter === 'all' || r.severity === sevFilter) &&
    (DAMAGE_TYPE_LABEL[r.damage_type].toLowerCase().includes(query.toLowerCase()) ||
     (r.reporter?.full_name || '').toLowerCase().includes(query.toLowerCase()))
  ), [reports, query, statusFilter, sevFilter]);

  if (selected) return <ReportDetail report={selected} onClose={() => setSelected(null)} isAdmin onChanged={onChange} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl flex items-center gap-2">
            <FileText size={20} /> Manage Reports
          </h1>
          <p className="text-muted text-sm">{filtered.length} reports</p>
        </div>
        <button onClick={() => exportReportsCSV(filtered)} className="btn-ghost text-sm">
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      <DailyLimitControl />

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by type or user…"
              className="input pl-9 py-2.5"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-2.5 w-auto"
          >
            <option value="all">All status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value)}
            className="input py-2.5 w-auto"
          >
            <option value="all">All severity</option>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Filter size={28} />} title="No reports" subtitle="Adjust filters to see results" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="p-4 hover:shadow-card-hover transition cursor-pointer"
              onClick={() => setSelected(r)}
            >
              <div className="flex gap-4">
                <img src={r.image_url} className="w-20 h-20 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display font-semibold">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {r.reporter?.full_name || 'Unknown'} • {formatDateTime(r.created_at)}
                      </div>
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
                  <div className="flex gap-2 mt-2">
                    {['pending', 'submitted', 'under_review'].includes(r.status) && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Needs review</Badge>
                    )}
                    {r.status === 'approved' && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Verified
                      </Badge>
                    )}
                    {r.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                        <XCircle size={12} /> Rejected
                      </Badge>
                    )}
                  </div>
                </div>
                <Eye size={18} className="text-muted" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
