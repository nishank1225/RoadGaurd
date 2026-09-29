import { useState, useEffect, useCallback } from 'react';
import { Map as MapIcon, Navigation, Layers, X, Eye, MapPin, AlertCircle } from 'lucide-react';
import type { Report, ReportStatus, Severity } from '@/lib/types';
import { MapView, SeverityLegend, LiveBadge, INDIA_CENTER, INDIA_ZOOM } from '@/components/MapView';
import { Card } from '@/components/ui';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { severityBgClass, statusBgClass, formatDateTime } from '@/lib/format';
import { ReportDetail } from '@/components/ReportDetail';
import { supabase } from '@/lib/supabase';

const LIVE_STATUSES: ReportStatus[] = [
  'submitted',
  'pending',
  'under_review',
  'approved',
  'maintenance_assigned',
  'in_progress',
  'completed',
];

const isValidLocation = (lat: any, lng: any): boolean => {
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export function UserMap({ reports: initialReports }: { reports?: Report[] }) {
  const [fetchedReports, setFetchedReports] = useState<Report[]>(initialReports ?? []);
  const [selected, setSelected] = useState<Report | null>(null);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLiveReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_user_id_fkey(id,full_name,email,avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFetchedReports((data ?? []) as unknown as Report[]);
    } catch (err) {
      console.error('[UserMap] Error fetching live reports from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveReports();

    // Subscribe to realtime updates on reports table
    const channel = supabase
      .channel('user-map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchLiveReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveReports]);

  // Filter live reports with valid locations
  const liveReports = fetchedReports.filter((r) => {
    const isLive = LIVE_STATUSES.includes(r.status) && r.status !== 'rejected' && r.status !== 'closed';
    const validLoc = isValidLocation(r.latitude, r.longitude);

    if (isLive && !validLoc && (r.latitude != null || r.longitude != null)) {
      console.warn(`[UserMap] Excluding report ${r.id} due to invalid location: (${r.latitude}, ${r.longitude})`);
    }

    return isLive && validLoc;
  });

  const severityCounts: Record<Severity, number> = {
    low: liveReports.filter((r) => r.severity === 'low').length,
    medium: liveReports.filter((r) => r.severity === 'medium').length,
    high: liveReports.filter((r) => r.severity === 'high').length,
    critical: liveReports.filter((r) => r.severity === 'critical').length,
  };

  const countLabel = liveReports.length === 1 ? '1 mapped report across India' : `${liveReports.length} mapped reports across India`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-xl flex items-center gap-2"><MapIcon size={20} /> Map</h1>
          <p className="text-muted text-sm">{countLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LiveBadge count={liveReports.length} />
          <SeverityLegend counts={severityCounts} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden h-[60vh] relative">
          {loading && liveReports.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center surface z-10">
              <span className="text-sm text-muted animate-pulse">Loading live map reports...</span>
            </div>
          ) : null}
          <MapView reports={liveReports} center={INDIA_CENTER} zoom={INDIA_ZOOM} onSelect={setSelected} />
        </Card>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selected ? (
            <Card className="animate-scale-in relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold text-base">{DAMAGE_TYPE_LABEL[selected.damage_type]}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg hover:surface-2 text-muted hover:text-foreground transition"
                  title="Clear selection"
                >
                  <X size={16} />
                </button>
              </div>

              {selected.image_url ? (
                <img src={selected.image_url} className="w-full h-40 object-cover rounded-xl mb-3" alt="Report visual evidence" />
              ) : null}

              <div className="flex gap-2 mb-3">
                <span className={`badge ${severityBgClass(selected.severity)}`}>{SEVERITY_LABEL[selected.severity]}</span>
                <span className={`badge ${statusBgClass(selected.status)}`}>{STATUS_LABEL[selected.status]}</span>
              </div>

              <div className="space-y-2 text-sm">
                <Info l="Report ID" v={<span className="font-mono text-xs text-muted">{selected.id}</span>} />
                <Info l="Location" v={selected.location_text || `${selected.latitude?.toFixed(4)}, ${selected.longitude?.toFixed(4)}`} />
                <Info l="Reported Date" v={formatDateTime(selected.created_at)} />
                <Info l="Confidence" v={`${(selected.confidence * 100).toFixed(0)}%`} />
                <Info l="Road Health Score" v={selected.road_health_score} />
                {selected.admin_remarks ? (
                  <Info l="Description / Remarks" v={<span className="text-muted text-xs">{selected.admin_remarks}</span>} />
                ) : null}
              </div>

              <div className="flex gap-2 mt-4">
                {selected.latitude != null && selected.longitude != null && (
                  <a
                    href={`https://www.openstreetmap.org/directions?from=&to=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary flex-1 text-center flex items-center justify-center gap-1.5 text-xs py-2"
                  >
                    <Navigation size={14} /> Navigate
                  </a>
                )}
                <button
                  onClick={() => setShowFullDetail(true)}
                  className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                >
                  <Eye size={14} /> Full Details
                </button>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Layers size={16} /> Select a marker on the map to view report details
                </div>
              </Card>

              {liveReports.length === 0 ? (
                <Card className="p-6 text-center text-muted">
                  <AlertCircle size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">No live reports available</p>
                  <p className="text-xs mt-1 text-muted">There are currently no active road damage reports mapped.</p>
                </Card>
              ) : (
                liveReports.slice(0, 8).map((r) => (
                  <Card
                    key={r.id}
                    className={`p-3 cursor-pointer transition hover:shadow-card-hover ${selected?.id === r.id ? 'ring-2 ring-primary-500' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <div className="flex gap-3">
                      {r.image_url ? (
                        <img src={r.image_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg surface-2 flex items-center justify-center text-muted">
                          <MapPin size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                        <div className="text-xs text-muted truncate">
                          {r.location_text || `${r.latitude?.toFixed(3)}, ${r.longitude?.toFixed(3)}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge ${severityBgClass(r.severity)} text-[10px]`}>{SEVERITY_LABEL[r.severity]}</span>
                          <span className={`badge ${statusBgClass(r.status)} text-[10px]`}>{STATUS_LABEL[r.status]}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {showFullDetail && selected ? (
        <ReportDetail report={selected} onClose={() => setShowFullDetail(false)} />
      ) : null}
    </div>
  );
}

function Info({ l, v }: { l: string; v?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1 border-b border-base/40 last:border-b-0">
      <span className="text-xs text-muted">{l}</span>
      <span className="font-medium text-xs text-right max-w-[60%] truncate">{v ?? '-'}</span>
    </div>
  );
}
