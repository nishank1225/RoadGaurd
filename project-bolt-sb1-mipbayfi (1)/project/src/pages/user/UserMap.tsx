import { useState } from 'react';
import { Map as MapIcon, Navigation, Layers } from 'lucide-react';
import type { Report } from '@/lib/types';
import { MapView, SeverityLegend, LiveBadge, INDIA_CENTER, INDIA_ZOOM } from '@/components/MapView';
import { Card } from '@/components/ui';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { severityBgClass, statusBgClass, formatDateTime } from '@/lib/format';

export function UserMap({ reports }: { reports: Report[] }) {
  const [selected, setSelected] = useState<Report | null>(null);
  const withLoc = reports.filter((r) => r.latitude != null && r.longitude != null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl flex items-center gap-2"><MapIcon size={20} /> Map</h1>
          <p className="text-muted text-sm">{withLoc.length} mapped reports across India</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LiveBadge count={withLoc.length} />
          <SeverityLegend />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden h-[60vh]">
          <MapView reports={withLoc} center={INDIA_CENTER} zoom={INDIA_ZOOM} onSelect={setSelected} />
        </Card>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selected ? (
            <Card className="animate-scale-in">
              <img src={selected.image_url} className="w-full h-40 object-cover rounded-xl mb-3" alt="" />
              <h3 className="font-display font-bold">{DAMAGE_TYPE_LABEL[selected.damage_type]}</h3>
              <div className="flex gap-2 mt-2">
                <span className={`badge ${severityBgClass(selected.severity)}`}>{SEVERITY_LABEL[selected.severity]}</span>
                <span className={`badge ${statusBgClass(selected.status)}`}>{STATUS_LABEL[selected.status]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <Info l="Confidence" v={`${(selected.confidence * 100).toFixed(0)}%`} />
                <Info l="Health" v={selected.road_health_score} />
                <Info l="Lat" v={selected.latitude?.toFixed(4)} />
                <Info l="Lng" v={selected.longitude?.toFixed(4)} />
              </div>
              <div className="text-xs text-muted mt-3">{formatDateTime(selected.created_at)}</div>
              <a href={`https://www.openstreetmap.org/directions?from=&to=${selected.latitude},${selected.longitude}`}
                target="_blank" rel="noreferrer" className="btn-primary w-full mt-4">
                <Navigation size={16} /> Navigate
              </a>
            </Card>
          ) : (
            <>
              <Card><div className="flex items-center gap-2 text-sm text-muted"><Layers size={16} /> Select a marker to view details</div></Card>
              {withLoc.slice(0, 8).map((r) => (
                <Card key={r.id} className="p-3 cursor-pointer hover:shadow-card-hover" onClick={() => setSelected(r)}>
                  <div className="flex gap-3">
                    <img src={r.image_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                      <div className="text-xs text-muted">{r.latitude?.toFixed(3)}, {r.longitude?.toFixed(3)}</div>
                      <span className={`badge ${severityBgClass(r.severity)} mt-1`}>{SEVERITY_LABEL[r.severity]}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ l, v }: { l: string; v?: React.ReactNode }) {
  return <div><div className="text-xs text-muted">{l}</div><div className="font-semibold">{v ?? '-'}</div></div>;
}
