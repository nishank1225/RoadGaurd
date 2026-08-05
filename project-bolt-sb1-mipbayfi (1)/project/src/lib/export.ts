import type { Report, Profile } from './types';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from './types';
import { formatDateTime } from './format';

export function exportReportsCSV(reports: Report[]): void {
  const headers = ['ID', 'Damage Type', 'Severity', 'Confidence', 'Road Health', 'Status', 'Latitude', 'Longitude', 'Location', 'Created', 'Priority'];
  const rows = reports.map((r) => [
    r.id.slice(0, 8),
    DAMAGE_TYPE_LABEL[r.damage_type],
    SEVERITY_LABEL[r.severity],
    (r.confidence * 100).toFixed(1) + '%',
    r.road_health_score,
    STATUS_LABEL[r.status],
    r.latitude ?? '',
    r.longitude ?? '',
    r.location_text,
    formatDateTime(r.created_at),
    r.priority,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  download(new Blob([csv], { type: 'text/csv' }), `roadguard-reports-${Date.now()}.csv`);
}

export function exportReportsPDF(reports: Report[], profile?: Profile): void {
  const win = window.open('', '_blank');
  if (!win) return;
  const rows = reports.map((r) => `
    <tr>
      <td>${DAMAGE_TYPE_LABEL[r.damage_type]}</td>
      <td><span class="sev sev-${r.severity}">${SEVERITY_LABEL[r.severity]}</span></td>
      <td>${(r.confidence * 100).toFixed(1)}%</td>
      <td>${r.road_health_score}</td>
      <td>${STATUS_LABEL[r.status]}</td>
      <td>${r.latitude ? r.latitude.toFixed(4) : '-'}</td>
      <td>${formatDateTime(r.created_at)}</td>
    </tr>`).join('');
  win.document.write(`<!doctype html><html><head><title>RoadGuard Reports</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}
      h1{color:#2563eb;margin:0 0 4px;font-size:24px}
      .meta{color:#64748b;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f1f5f9;text-align:left;padding:8px;border-bottom:2px solid #e2e8f0}
      td{padding:8px;border-bottom:1px solid #e2e8f0}
      .sev{padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
      .sev-low{background:#d1fae5;color:#065f46}
      .sev-medium{background:#fef3c7;color:#92400e}
      .sev-high{background:#ffedd5;color:#9a3412}
      .sev-critical{background:#fee2e2;color:#991b1b}
      .footer{margin-top:24px;color:#94a3b8;font-size:11px}
    </style></head><body>
    <h1>RoadGuard — Report Export</h1>
    <div class="meta">Generated ${new Date().toLocaleString()}${profile ? ` by ${profile.full_name}` : ''} • ${reports.length} reports</div>
    <table><thead><tr>
      <th>Damage Type</th><th>Severity</th><th>Confidence</th><th>Health</th><th>Status</th><th>Lat</th><th>Date</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">RoadGuard ML Road Damage Detection System</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
