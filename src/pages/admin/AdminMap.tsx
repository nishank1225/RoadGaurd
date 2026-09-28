import { useState } from 'react';
import { Map as MapIcon, Layers, Activity } from 'lucide-react';
import type { Report } from '@/lib/types';
import { MapView, SeverityLegend, LiveBadge, INDIA_CENTER, INDIA_ZOOM } from '@/components/MapView';
import { Card } from '@/components/ui';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { severityBgClass, statusBgClass, formatDateTime } from '@/lib/format';
import { ReportDetail } from '@/components/ReportDetail';

export function AdminMap({ reports }: { reports: Report[] }) {
  const [selected, setSelected] = useState<Report | null>(null);
  const withLoc = reports.filter((r) => r.latitude != null && r.longitude != null);

  if (selected) return <ReportDetail report={selected} onClose={() => setSelected(null)} isAdmin onChanged={() => {}} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl flex items-center gap-2"><MapIcon size={20} /> Map</h1>
          <p className="text-muted text-sm">{withLoc.length} mapped reports • real-time feed</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LiveBadge count={withLoc.length} />
          <SeverityLegend />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden h-[65vh]">
          <MapView reports={withLoc} center={INDIA_CENTER} zoom={INDIA_ZOOM} onSelect={setSelected} />
        </Card>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto">
          <Card><div className="flex items-center gap-2 text-sm text-muted"><Activity size={16} /> Click markers for details • {withLoc.length} total</div></Card>
          {withLoc.map((r) => (
            <Card key={r.id} className="p-3 cursor-pointer hover:shadow-card-hover" onClick={() => setSelected(r)}>
              <div className="flex gap-3">
                <img src={r.image_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                  <div className="text-xs text-muted">{r.reporter?.full_name || 'User'}</div>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`badge ${severityBgClass(r.severity)}`}>{SEVERITY_LABEL[r.severity]}</span>
                    <span className={`badge ${statusBgClass(r.status)}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
