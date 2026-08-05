import { useState } from 'react';
import { X, MapPin, Clock, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Trash2, Save, MessageSquare, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Report, ReportStatus, Priority } from '@/lib/types';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types';
import { Badge } from '@/components/ui';
import { severityBgClass, statusBgClass, priorityBgClass, severityColor, formatDateTime } from '@/lib/format';
import { DetectionCanvas } from '@/components/DetectionCanvas';
import { useAuth } from '@/context/AuthContext';
import { logAudit, notifyUser } from '@/lib/services';

export function ReportDetail({ report, onClose, isAdmin = false, onChanged }: {
  report: Report; onClose: () => void; isAdmin?: boolean; onChanged?: () => void;
}) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [priority, setPriority] = useState<Priority>(report.priority);
  const [remarks, setRemarks] = useState(report.admin_remarks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = async (patch: Partial<Report>, action: string, notifyType: string, notifyTitle: string, notifyBody: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('reports').update({
        ...patch, version: report.version + 1, verified_by: profile?.id, verified_at: new Date().toISOString(),
      }).eq('id', report.id).eq('version', report.version);
      if (error) throw error;
      await logAudit(action, 'reports', report.id, patch);
      if (notifyType) await notifyUser(report.user_id, notifyType, notifyTitle, notifyBody, report.id);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      onChanged?.();
    } catch (e) {
      alert('Update failed — another admin may have edited this report. Please reload.');
    } finally { setSaving(false); }
  };

  const saveAll = () => update({ status, priority, admin_remarks: remarks }, 'report_updated', status !== report.status ? 'status_change' : '', status !== report.status ? `Report ${STATUS_LABEL[status]}` : '', `Your report status changed to ${STATUS_LABEL[status]}.`);
  const approve = () => update({ status: 'approved' }, 'report_approved', 'report_approved', 'Report approved', `Your ${DAMAGE_TYPE_LABEL[report.damage_type]} report has been approved.`);
  const reject = () => update({ status: 'rejected' }, 'report_rejected', 'report_rejected', 'Report rejected', `Your ${DAMAGE_TYPE_LABEL[report.damage_type]} report was rejected.`);
  const del = async () => { if (!confirm('Delete this report?')) return; await supabase.from('reports').delete().eq('id', report.id); await logAudit('report_deleted', 'reports', report.id); onChanged?.(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 glass border-b border-base p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold">Report Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:surface-2"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-xl overflow-hidden"><DetectionCanvas imageUrl={report.image_url} boxes={report.bounding_boxes} /></div>

          <div className="flex flex-wrap gap-2">
            <span className={`badge ${severityBgClass(report.severity)}`}>{SEVERITY_LABEL[report.severity]}</span>
            <span className={`badge ${statusBgClass(report.status)}`}>{STATUS_LABEL[report.status]}</span>
            <span className={`badge ${priorityBgClass(report.priority)}`}>{PRIORITY_LABEL[report.priority]}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info l="Damage Type" v={DAMAGE_TYPE_LABEL[report.damage_type]} />
            <Info l="Confidence" v={`${(report.confidence * 100).toFixed(1)}%`} />
            <Info l="Road Health" v={report.road_health_score} />
            <Info l="Prediction Time" v={`${report.prediction_time_ms} ms`} />
            <Info l="Created" v={formatDateTime(report.created_at)} />
            <Info l="Updated" v={formatDateTime(report.updated_at)} />
          </div>

          {report.latitude != null && (
            <div className="card p-3 flex items-center gap-3">
              <MapPin size={18} className="text-primary-600" />
              <div className="text-sm">
                <div className="font-semibold">{report.latitude.toFixed(5)}, {report.longitude?.toFixed(5)}</div>
                {report.location_text && <div className="text-xs text-muted">{report.location_text}</div>}
              </div>
              <a href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}`} target="_blank" rel="noreferrer" className="ml-auto text-xs text-primary-600 font-medium">Open map</a>
            </div>
          )}

          {report.bounding_boxes.length > 0 && (
            <div className="card p-4">
              <h4 className="font-semibold text-sm mb-2">AI Detections</h4>
              <div className="space-y-2">
                {report.bounding_boxes.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: severityColor(report.severity) }} />{b.label}</span>
                    <span className="text-muted tabular-nums">{(b.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="card p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2"><ShieldCheck size={16} /> Admin Review</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted block mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)} className="input py-2">
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted block mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input py-2">
                    {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs text-muted block mb-1">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="input py-2" placeholder="Add review remarks…" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={approve} disabled={saving} className="btn-primary text-sm py-2"><CheckCircle2 size={15} /> Approve</button>
                <button onClick={reject} disabled={saving} className="btn-ghost text-sm py-2 text-red-500"><XCircle size={15} /> Reject</button>
                <button onClick={saveAll} disabled={saving} className="btn-ghost text-sm py-2"><Save size={15} /> {saved ? 'Saved!' : 'Save'}</button>
                <button onClick={del} disabled={saving} className="btn-ghost text-sm py-2 text-red-500 ml-auto"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          ) : report.admin_remarks ? (
            <div className="card p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><MessageSquare size={16} /> Admin Remarks</h4>
              <p className="text-sm text-muted">{report.admin_remarks}</p>
            </div>
          ) : null}

          {report.verified_by && (
            <div className="text-xs text-muted flex items-center gap-1.5"><Flag size={12} /> Verified by admin • {report.verified_at && formatDateTime(report.verified_at)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ l, v }: { l: string; v: React.ReactNode }) {
  return <div className="card p-3"><div className="text-xs text-muted">{l}</div><div className="font-semibold text-sm mt-0.5">{v}</div></div>;
}
