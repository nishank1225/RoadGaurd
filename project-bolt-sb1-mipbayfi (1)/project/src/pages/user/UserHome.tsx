import { useEffect, useState } from 'react';
import { MapPin, CloudSun, TrendingUp, AlertTriangle, CheckCircle2, Clock, Activity, Navigation, Camera, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Report } from '@/lib/types';
import { Card, StatCard, Badge, EmptyState } from '@/components/ui';
import { ProgressBar, DonutChart } from '@/components/Charts';
import { severityBgClass, statusBgClass, timeAgo, severityColor } from '@/lib/format';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';

export function UserHome({ reports, onNavigate }: { reports: Report[]; onNavigate: (t: any) => void }) {
  const { profile } = useAuth();
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; cond: string } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const t = 20 + Math.round((Math.sin(pos.coords.latitude + Date.now() / 1e7) * 8));
        setWeather({ temp: t, cond: ['Clear', 'Cloudy', 'Light rain'][Math.abs(Math.round(pos.coords.latitude * 7)) % 3] });
      },
      () => { setGps({ lat: 6.9271, lng: 79.8612 }); setWeather({ temp: 28, cond: 'Clear' }); },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const approved = reports.filter((r) => r.status === 'approved');
  const pending = reports.filter((r) => ['pending', 'submitted', 'under_review'].includes(r.status));
  const rejected = reports.filter((r) => r.status === 'rejected');
  const critical = reports.filter((r) => r.severity === 'critical');
  const avgHealth = reports.length ? Math.round(reports.reduce((s, r) => s + r.road_health_score, 0) / reports.length) : 100;

  const sevData = (['low', 'medium', 'high', 'critical'] as const).map((s) => ({
    label: SEVERITY_LABEL[s], value: reports.filter((r) => r.severity === s).length, color: severityColor(s),
  }));

  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 18) return 'Good afternoon'; return 'Good evening'; };

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <Card className="relative overflow-hidden border-0 text-white" >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1e3a8a,#2563eb 60%,#3b82f6)' }} />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative z-10 p-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">{greeting()},</p>
              <h1 className="font-display font-bold text-2xl">{profile?.full_name || 'Driver'}</h1>
            </div>
            <div className="flex items-center gap-2">
              {weather && <div className="text-right"><div className="flex items-center gap-1.5 justify-end"><CloudSun size={20} /><span className="font-semibold">{weather.temp}°</span></div><div className="text-xs text-white/70">{weather.cond}</div></div>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-white/80">
            <MapPin size={16} />
            {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Locating…'}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-white/70">Road Health Score</div>
              <div className="text-2xl font-bold font-display">{avgHealth}</div>
            </div>
            <button onClick={() => onNavigate('camera')} className="bg-white/15 backdrop-blur hover:bg-white/25 transition rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-semibold">
              <Camera size={16} /> New Report
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Activity size={20} />} label="Total Reports" value={reports.length} color="primary" delay={0} />
        <StatCard icon={<Clock size={20} />} label="Pending" value={pending.length} color="warning" delay={60} />
        <StatCard icon={<CheckCircle2 size={20} />} label="Verified" value={approved.length} color="success" delay={120} />
        <StatCard icon={<AlertTriangle size={20} />} label="Critical" value={critical.length} color="danger" delay={180} />
      </div>

      {/* Road condition summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">Severity Distribution</h3>
          {reports.length > 0 ? <DonutChart data={sevData} /> : <EmptyState icon={<TrendingUp size={28} />} title="No data yet" subtitle="Reports will appear here" />}
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-4">Road Condition Summary</h3>
          <div className="space-y-4">
            <ProgressBar label="Road Health" value={avgHealth} color={avgHealth > 70 ? '#10b981' : avgHealth > 40 ? '#f59e0b' : '#ef4444'} />
            <ProgressBar label="Verified Rate" value={reports.length ? Math.round((approved.length / reports.length) * 100) : 0} color="#10b981" />
            <ProgressBar label="Critical Rate" value={reports.length ? Math.round((critical.length / reports.length) * 100) : 0} color="#ef4444" />
          </div>
          {gps && (
            <button onClick={() => onNavigate('map')} className="btn-ghost w-full mt-5">
              <Navigation size={16} /> View nearby damages on map
            </button>
          )}
        </Card>
      </div>

      {/* Recent detections */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Recent Detections</h3>
          <button onClick={() => onNavigate('history')} className="text-sm text-primary-600 font-medium hover:underline">View all</button>
        </div>
        {reports.length === 0 ? (
          <EmptyState icon={<Camera size={28} />} title="No reports yet" subtitle="Capture a road image to start detecting damage"
            action={<button onClick={() => onNavigate('camera')} className="btn-primary"><Camera size={16} /> Create report</button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.slice(0, 6).map((r) => (
              <div key={r.id} className="rounded-xl border border-base overflow-hidden hover:shadow-card-hover transition group">
                <div className="relative h-32 overflow-hidden">
                  <img src={r.image_url} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                  <span className={`badge absolute top-2 left-2 ${severityBgClass(r.severity)}`}>{SEVERITY_LABEL[r.severity]}</span>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm">{DAMAGE_TYPE_LABEL[r.damage_type]}</div>
                  <div className="text-xs text-muted mt-1 flex items-center justify-between">
                    <span>{(r.confidence * 100).toFixed(0)}% confidence</span>
                    <span>{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="mt-2"><Badge className={statusBgClass(r.status)}>{STATUS_LABEL[r.status]}</Badge></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
