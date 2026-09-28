import { useState } from 'react';
import { X, MapPin, Clock, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Trash2, Save, MessageSquare, Flag, Send, Building2, Phone, Mail, Globe, Loader2, Grid3x3, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Report, ReportStatus, Priority, GridCell } from '@/lib/types';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL, PRIORITY_LABEL } from '@/lib/types';
import { Badge } from '@/components/ui';
import { severityBgClass, statusBgClass, priorityBgClass, severityColor, formatDateTime } from '@/lib/format';
import { DetectionCanvas } from '@/components/DetectionCanvas';
import { useAuth } from '@/context/AuthContext';
import { logAudit, notifyUser, createComplaint, BBMP_AUTHORITY } from '@/lib/services';

export function ReportDetail({ report, onClose, isAdmin = false, onChanged }: {
  report: Report; onClose: () => void; isAdmin?: boolean; onChanged?: () => void;
}) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [priority, setPriority] = useState<Priority>(report.priority);
  const [remarks, setRemarks] = useState(report.admin_remarks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);

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
            <Info l="Severity Score" v={`${report.severity_score?.toFixed(1) ?? '0'} / 5`} />
            <Info l="Created" v={formatDateTime(report.created_at)} />
            <Info l="Updated" v={formatDateTime(report.updated_at)} />
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-primary-600" />
              <span className="text-sm font-semibold">Damage Breakdown</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-xl font-display font-bold">{report.pothole_count ?? 0}</div><div className="text-xs text-muted">Potholes</div></div>
              <div><div className="text-xl font-display font-bold">{report.crack_count ?? 0}</div><div className="text-xs text-muted">Cracks</div></div>
              <div><div className="text-xl font-display font-bold">{report.edge_damage_count ?? 0}</div><div className="text-xs text-muted">Edge Damage</div></div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary-600" />
              <span className="text-sm font-semibold">Deterioration Risk</span>
              <span className="text-xs text-muted ml-auto">{((report.deterioration_risk ?? 0) * 100).toFixed(0)}% probability</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${(report.deterioration_risk ?? 0) > 0.7 ? 'bg-red-500' : (report.deterioration_risk ?? 0) > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(report.deterioration_risk ?? 0) * 100}%` }} />
            </div>
          </div>

          {report.grid_map && report.grid_map.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Grid3x3 size={16} className="text-primary-600" />
                <span className="text-sm font-semibold">Spatial Severity Map</span>
                <span className="text-xs text-muted ml-auto">3×3 grid</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto">
                {report.grid_map.map((cell, i) => <GridCellBox key={i} cell={cell} />)}
              </div>
            </div>
          )}

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
              <button onClick={() => setShowComplaint(true)} className="btn-ghost text-sm py-2.5 w-full border border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 mt-1">
                <Send size={15} /> Raise Complaint to BBMP
              </button>
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
      {showComplaint && (
        <ComplaintModal report={report} raisedBy={profile?.id || ''} onClose={() => setShowComplaint(false)} onLodged={() => { setShowComplaint(false); onChanged?.(); }} />
      )}
    </div>
  );
}

function ComplaintModal({ report, raisedBy, onClose, onLodged }: {
  report: Report; raisedBy: string; onClose: () => void; onLodged: () => void;
}) {
  const defaultSubject = `Road Damage Complaint — ${DAMAGE_TYPE_LABEL[report.damage_type]} at ${report.location_text || 'Bengaluru'}`;
  const defaultMessage = `To the Commissioner,\n\nBruhat Bengaluru Mahanagara Palike (BBMP)\nHudson Circle, Bengaluru 560002\n\nSubject: Road damage — ${DAMAGE_TYPE_LABEL[report.damage_type]} (${SEVERITY_LABEL[report.severity]} severity)\n\nDear Sir/Madam,\n\nI am writing to formally report a road damage issue that requires urgent attention from the BBMP road maintenance wing.\n\nDamage Details:\n- Type: ${DAMAGE_TYPE_LABEL[report.damage_type]}\n- Severity: ${SEVERITY_LABEL[report.severity]}\n- AI Confidence: ${(report.confidence * 100).toFixed(1)}%\n- Road Health Score: ${report.road_health_score}/100\n- Potholes detected: ${report.pothole_count ?? 0}\n- Cracks detected: ${report.crack_count ?? 0}\n\nLocation:\n- Address: ${report.location_text || 'Not specified'}\n- GPS Coordinates: ${report.latitude?.toFixed(5) || 'N/A'}, ${report.longitude?.toFixed(5) || 'N/A'}\n- OpenStreetMap: https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}\n\nPhotographic Evidence:\n- Image URL: ${report.image_url}\n\nThe damage has been verified through our road monitoring system (RoadGuard) with photographic evidence attached. Given the severity level, prompt repair is requested to prevent accidents and further deterioration.\n\nI request BBMP to kindly inspect the location and initiate repair work at the earliest. An acknowledgement and reference number would be appreciated.\n\nThank you,\nRoadGuard Monitoring System`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [lodging, setLodging] = useState(false);
  const [error, setError] = useState('');

  const handleLodge = async () => {
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required'); return; }
    setLodging(true); setError('');
    try {
      await createComplaint({
        report_id: report.id,
        raised_by: raisedBy,
        authority_name: BBMP_AUTHORITY.name,
        authority_email: BBMP_AUTHORITY.email,
        authority_phone: BBMP_AUTHORITY.phone,
        authority_helpline: BBMP_AUTHORITY.helpline,
        subject, message,
        latitude: report.latitude, longitude: report.longitude, location_text: report.location_text,
        status: 'lodged', lodged_at: new Date().toISOString(),
      });
      await logAudit('complaint_lodged', 'authority_complaints', report.id, { authority: 'BBMP' });
      onLodged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to lodge complaint');
    } finally { setLodging(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 glass border-b border-base p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold flex items-center gap-2"><Send size={18} className="text-primary-600" /> Raise Complaint to BBMP</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:surface-2"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="card p-4 bg-primary-50/50 dark:bg-primary-500/5 border-primary-200 dark:border-primary-500/20">
            <div className="flex items-start gap-3">
              <Building2 size={20} className="text-primary-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-semibold">{BBMP_AUTHORITY.name}</div>
                <div className="text-muted text-xs mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5"><Mail size={11} /> {BBMP_AUTHORITY.email}</div>
                  <div className="flex items-center gap-1.5"><Phone size={11} /> {BBMP_AUTHORITY.phone} • Helpline {BBMP_AUTHORITY.helpline}</div>
                  <div className="flex items-center gap-1.5"><Globe size={11} /> {BBMP_AUTHORITY.website}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">Auto-filled from report</div>
            <div className="flex gap-3">
              <img src={report.image_url} className="w-24 h-24 rounded-lg object-cover" alt="Damage" />
              <div className="grid grid-cols-1 gap-1 text-sm flex-1">
                <div><span className="text-muted">Damage:</span> {DAMAGE_TYPE_LABEL[report.damage_type]}</div>
                <div><span className="text-muted">Severity:</span> {SEVERITY_LABEL[report.severity]}</div>
                <div><span className="text-muted">GPS:</span> {report.latitude?.toFixed(5) ?? 'N/A'}, {report.longitude?.toFixed(5) ?? 'N/A'}</div>
                <div><span className="text-muted">Location:</span> {report.location_text || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input py-2.5" />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Complaint Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={14} className="input py-2.5 font-mono text-xs leading-relaxed" />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex gap-2">
            <button onClick={handleLodge} disabled={lodging} className="btn-primary text-sm py-2.5 flex items-center gap-2">
              {lodging ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {lodging ? 'Lodging…' : 'Lodge Complaint'}
            </button>
            <button onClick={onClose} className="btn-ghost text-sm py-2.5">Cancel</button>
          </div>
          <p className="text-xs text-muted">Lodging records the complaint in the system with status "Lodged". Use the authority contact details above to forward via email or helpline 1533.</p>
        </div>
      </div>
    </div>
  );
}

function Info({ l, v }: { l: string; v: React.ReactNode }) {
  return <div className="card p-3"><div className="text-xs text-muted">{l}</div><div className="font-semibold text-sm mt-0.5">{v}</div></div>;
}

function GridCellBox({ cell }: { cell: GridCell }) {
  const intensity = Math.min(cell.severity / 5, 1);
  const bg = cell.damage_count === 0
    ? 'bg-surface-2'
    : intensity > 0.7 ? 'bg-red-400 dark:bg-red-500/60'
    : intensity > 0.4 ? 'bg-amber-400 dark:bg-amber-500/60'
    : 'bg-emerald-400 dark:bg-emerald-500/60';
  return (
    <div className={`aspect-square rounded-lg ${bg} flex items-center justify-center transition-all`}>
      {cell.damage_count > 0 && <span className="text-xs font-bold text-white">{cell.damage_count}</span>}
    </div>
  );
}
