import { useState, useEffect, useMemo } from 'react';
import { Building2, Send, Search, MapPin, Clock, Mail, Phone, Globe, CheckCircle2, X } from 'lucide-react';
import type { AuthorityComplaint, ComplaintStatus } from '@/lib/types';
import { COMPLAINT_STATUS_LABEL, DAMAGE_TYPE_LABEL, SEVERITY_LABEL } from '@/lib/types';
import { Card, Badge, EmptyState } from '@/components/ui';
import { statusBgClass, formatDateTime } from '@/lib/format';
import { fetchComplaints, updateComplaint, BBMP_AUTHORITY } from '@/lib/services';

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  lodged: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  acknowledged: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export function AdminComplaints() {
  const [complaints, setComplaints] = useState<AuthorityComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<AuthorityComplaint | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setComplaints(await fetchComplaints()); } finally { setLoading(false); }
  };

  const filtered = useMemo(() => complaints.filter((c) =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (c.subject.toLowerCase().includes(query.toLowerCase()) ||
     c.location_text.toLowerCase().includes(query.toLowerCase()))
  ), [complaints, query, statusFilter]);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted">Loading complaints…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl flex items-center gap-2"><Building2 size={20} /> Authority Complaints</h1>
          <p className="text-muted text-sm">{filtered.length} complaints raised to BBMP</p>
        </div>
      </div>

      <Card className="p-4 bg-primary-50/40 dark:bg-primary-500/5 border-primary-200 dark:border-primary-500/20">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-primary-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">{BBMP_AUTHORITY.name}</div>
            <div className="text-muted text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1"><Mail size={11} /> {BBMP_AUTHORITY.email}</span>
              <span className="flex items-center gap-1"><Phone size={11} /> {BBMP_AUTHORITY.phone}</span>
              <span className="flex items-center gap-1"><Globe size={11} /> {BBMP_AUTHORITY.website}</span>
              <span className="flex items-center gap-1">Helpline {BBMP_AUTHORITY.helpline}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subject or location…" className="input pl-9 py-2.5" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input py-2.5 w-auto">
            <option value="all">All status</option>
            {Object.entries(COMPLAINT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Send size={28} />} title="No complaints yet" subtitle="Raise a complaint from any report's detail page" />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 hover:shadow-card-hover transition cursor-pointer" onClick={() => setSelected(c)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-sm truncate">{c.subject}</div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {c.location_text || 'No location'}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDateTime(c.created_at)}</span>
                    {c.report && <span>• {DAMAGE_TYPE_LABEL[c.report.damage_type]} ({SEVERITY_LABEL[c.report.severity]})</span>}
                  </div>
                  {c.reference_number && <div className="text-xs text-primary-600 mt-1">Ref: {c.reference_number}</div>}
                </div>
                <span className={`badge ${STATUS_COLORS[c.status]}`}>{COMPLAINT_STATUS_LABEL[c.status]}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && <ComplaintDetail complaint={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
}

function ComplaintDetail({ complaint, onClose, onChanged }: {
  complaint: AuthorityComplaint; onClose: () => void; onChanged: () => void;
}) {
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [refNum, setRefNum] = useState(complaint.reference_number);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateComplaint(complaint.id, { status, reference_number: refNum });
      setSaved(true); setTimeout(() => setSaved(false), 2500); onChanged();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 glass border-b border-base p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold flex items-center gap-2"><Building2 size={18} className="text-primary-600" /> Complaint Detail</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:surface-2"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs text-muted uppercase tracking-wide mb-1">Subject</div>
            <div className="font-semibold">{complaint.subject}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted text-xs block">Authority</span>{complaint.authority_name}</div>
            <div><span className="text-muted text-xs block">Email</span>{complaint.authority_email}</div>
            <div><span className="text-muted text-xs block">Phone</span>{complaint.authority_phone}</div>
            <div><span className="text-muted text-xs block">Helpline</span>{complaint.authority_helpline}</div>
            <div><span className="text-muted text-xs block">GPS</span>{complaint.latitude?.toFixed(5)}, {complaint.longitude?.toFixed(5)}</div>
            <div><span className="text-muted text-xs block">Location</span>{complaint.location_text || 'N/A'}</div>
          </div>

          <div>
            <div className="text-xs text-muted uppercase tracking-wide mb-1">Message</div>
            <pre className="text-xs whitespace-pre-wrap font-mono bg-surface-2 p-3 rounded-xl max-h-64 overflow-y-auto">{complaint.message}</pre>
          </div>

          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-muted block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus)} className="input py-2.5 w-auto">
                {Object.entries(COMPLAINT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">Reference Number</label>
              <input value={refNum} onChange={(e) => setRefNum(e.target.value)} placeholder="From authority acknowledgement" className="input py-2.5" />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2.5">
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Update'}
            </button>
          </div>

          {complaint.lodged_at && (
            <div className="text-xs text-muted flex items-center gap-1.5"><CheckCircle2 size={12} /> Lodged on {formatDateTime(complaint.lodged_at)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
