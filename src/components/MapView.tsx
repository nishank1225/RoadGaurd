import { useEffect, useRef, useState } from 'react';
import { Flame, MapPin } from 'lucide-react';
import type { Report } from '@/lib/types';
import { severityColor } from '@/lib/format';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export const INDIA_CENTER: [number, number] = [22.5937, 79.9629];
export const INDIA_ZOOM = 5;

declare global {
  interface Window { L?: any; }
}

function waitForLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    const timer = setInterval(() => {
      if (window.L) { clearInterval(timer); resolve(window.L); }
    }, 100);
  });
}

function markerIcon(color: string, pulse = false) {
  const ring = pulse
    ? `<span class="rg-marker-ping" style="background:${color}"></span>`
    : '';
  const html = `<div style="position:relative">${ring}<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div></div>`;
  return window.L.divIcon({
    html,
    className: 'rg-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const SEVERITY_INTENSITY: Record<string, number> = {
  low: 0.3, medium: 0.55, high: 0.8, critical: 1.0,
};

export function MapView({ reports, center, onSelect, height = '100%', zoom }: {
  reports: Report[];
  center?: [number, number];
  onSelect?: (r: Report) => void;
  height?: string;
  zoom?: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [showHeat, setShowHeat] = useState(false);

  useEffect(() => {
    let cancelled = false;
    waitForLeaflet().then((L) => {
      if (cancelled || !elRef.current || mapRef.current) return;
      const c: [number, number] = center || INDIA_CENTER;
      const z = zoom ?? INDIA_ZOOM;
      mapRef.current = L.map(elRef.current, {
        center: c, zoom: z, zoomControl: true, scrollWheelZoom: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
      }).addTo(mapRef.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove old heat layer
    if (heatRef.current) { heatRef.current.remove(); heatRef.current = null; }

    const geoReports = reports.filter((r) => r.latitude != null && r.longitude != null);

    // Add markers (always present, but hidden when heatmap is on)
    geoReports.forEach((r) => {
      const color = severityColor(r.severity);
      const pulse = r.severity === 'critical';
      const marker = L.marker([r.latitude, r.longitude], { icon: markerIcon(color, pulse) });
      const html = `<div style="min-width:200px;font-family:Inter,sans-serif">
        <img src="${r.image_url}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px" />
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">${DAMAGE_TYPE_LABEL[r.damage_type]}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px">
          ${SEVERITY_LABEL[r.severity]} • ${STATUS_LABEL[r.status]}
        </div>
        <div style="font-size:11px;color:#64748b">${formatDateTime(r.created_at)}</div>
        <div style="font-size:11px;color:#64748b">Confidence ${(r.confidence * 100).toFixed(0)}%</div>
      </div>`;
      marker.bindPopup(html);
      marker.on('click', () => { if (onSelect) onSelect(r); });
      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Add heat layer
    if (L.heatLayer && geoReports.length > 0) {
      const points = geoReports.map((r) => [
        r.latitude, r.longitude, SEVERITY_INTENSITY[r.severity] ?? 0.5,
      ]);
      heatRef.current = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.0: '#10b981', 0.3: '#84cc16', 0.5: '#f59e0b', 0.7: '#f97316', 1.0: '#ef4444' },
      });
    }

    // Apply visibility
    applyLayerVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, onSelect, ready]);

  const applyLayerVisibility = () => {
    if (!mapRef.current) return;
    if (showHeat && heatRef.current && !mapRef.current.hasLayer(heatRef.current)) {
      heatRef.current.addTo(mapRef.current);
    }
    if (!showHeat && heatRef.current && mapRef.current.hasLayer(heatRef.current)) {
      heatRef.current.remove();
    }
    markersRef.current.forEach((m) => {
      if (showHeat && mapRef.current.hasLayer(m)) m.remove();
      if (!showHeat && !mapRef.current.hasLayer(m)) m.addTo(mapRef.current);
    });
  };

  useEffect(() => {
    applyLayerVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeat, ready]);

  useEffect(() => {
    if (center && mapRef.current) mapRef.current.setView([center[0], center[1]], zoom ?? mapRef.current.getZoom());
  }, [center, zoom]);

  return (
    <div className="rg-map-container relative" style={{ height, width: '100%' }}>
      <div ref={elRef} style={{ height: '100%', width: '100%' }} />
      <button
        onClick={() => setShowHeat((v) => !v)}
        className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold surface border border-base shadow-lg hover:shadow-xl transition-all"
        style={{ zIndex: 1000 }}
      >
        {showHeat ? <><MapPin size={15} /> Show Markers</> : <><Flame size={15} /> Show Heatmap</>}
      </button>
    </div>
  );
}

export function SeverityLegend() {
  const items = [
    { c: '#10b981', l: 'Low' }, { c: '#f59e0b', l: 'Medium' },
    { c: '#f97316', l: 'High' }, { c: '#ef4444', l: 'Critical' },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full" style={{ background: i.c }} />
          <span className="text-muted">{i.l}</span>
        </div>
      ))}
    </div>
  );
}

export function LiveBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 text-xs font-medium">
      <span className="relative flex w-2.5 h-2.5">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-muted">Live</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{count}</span>
      <span className="text-muted">reports</span>
    </div>
  );
}
