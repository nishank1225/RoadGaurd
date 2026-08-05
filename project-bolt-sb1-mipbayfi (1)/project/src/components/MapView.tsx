import { useEffect, useRef, useState } from 'react';
import type { Report } from '@/lib/types';
import { severityColor } from '@/lib/format';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export const INDIA_CENTER: [number, number] = [22.5937, 79.9629];
export const INDIA_ZOOM = 5;

declare global {
  interface Window { google?: any; }
}

function waitForGoogleMaps(): Promise<any> {
  return new Promise((resolve) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const timer = setInterval(() => {
      if (window.google?.maps) { clearInterval(timer); resolve(window.google.maps); }
    }, 100);
  });
}

function markerIcon(color: string, pulse = false): string {
  const ring = pulse
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:${color};opacity:0.3;animation:rg-ping 1.6s ease-out infinite"></div>`
    : '';
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="8" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    </svg>`
  )}`;
}

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
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    waitForGoogleMaps().then((maps) => {
      if (cancelled || !elRef.current) return;
      const c: [number, number] = center || INDIA_CENTER;
      const z = zoom ?? INDIA_ZOOM;
      mapRef.current = new maps.Map(elRef.current, {
        center: { lat: c[0], lng: c[1] },
        zoom: z,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [{ featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'on' }] }],
      });
      infoRef.current = new maps.InfoWindow();
      setReady(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    reports.forEach((r) => {
      if (r.latitude == null || r.longitude == null) return;
      const color = severityColor(r.severity);
      const pulse = r.severity === 'critical';
      const marker = new maps.Marker({
        position: { lat: r.latitude, lng: r.longitude },
        map: mapRef.current,
        icon: { url: markerIcon(color, pulse), scaledSize: new maps.Size(28, 28) },
        animation: pulse ? maps.Animation.BOUNCE : null,
      });
      const html = `<div style="min-width:200px;font-family:Inter,sans-serif">
        <img src="${r.image_url}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px" />
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">${DAMAGE_TYPE_LABEL[r.damage_type]}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px">
          ${SEVERITY_LABEL[r.severity]} • ${STATUS_LABEL[r.status]}
        </div>
        <div style="font-size:11px;color:#64748b">${formatDateTime(r.created_at)}</div>
        <div style="font-size:11px;color:#64748b">Confidence ${(r.confidence * 100).toFixed(0)}%</div>
      </div>`;
      maps.event.addListener(marker, 'click', () => {
        infoRef.current.setContent(html);
        infoRef.current.open(mapRef.current, marker);
        if (onSelect) onSelect(r);
      });
      markersRef.current.push(marker);
    });
  }, [reports, onSelect, ready]);

  useEffect(() => {
    if (center && mapRef.current) mapRef.current.setCenter({ lat: center[0], lng: center[1] });
    if (zoom != null && mapRef.current) mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  return (
    <div className="rg-map-container" style={{ height, width: '100%' }}>
      <div ref={elRef} style={{ height: '100%', width: '100%' }} />
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
