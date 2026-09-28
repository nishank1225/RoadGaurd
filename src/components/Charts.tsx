import { useEffect, useState } from 'react';

export function BarChart({ data, height = 200 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 50); return () => clearTimeout(t); }, []);
  return (
    <div className="flex items-end gap-3 justify-around" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[60px]">
          <div className="text-xs font-semibold tabular-nums">{d.value}</div>
          <div className="w-full rounded-t-lg transition-all duration-700 ease-out"
            style={{
              height: animated ? `${(d.value / max) * (height - 50)}px` : '0px',
              background: d.color || 'linear-gradient(180deg,#3b82f6,#2563eb)',
              minHeight: '4px',
            }} />
          <div className="text-[11px] text-muted text-center leading-tight">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, height = 200, color = '#2563eb' }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 50); return () => clearTimeout(t); }, []);
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100; const h = 100;
  const pts = data.map((d, i) => `${(i / (data.length - 1 || 1)) * w},${h - (d.value / max) * h * 0.85 - 8}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <div style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#lc-grad)" style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.8s' }} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
          style={{ strokeDasharray: 300, strokeDashoffset: animated ? 0 : 300, transition: 'stroke-dashoffset 1.2s ease-out' }} />
        {data.map((d, i) => (
          <circle key={i} cx={(i / (data.length - 1 || 1)) * w} cy={h - (d.value / max) * h * 0.85 - 8}
            r="1.2" fill={color} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ${i * 0.1}s` }} />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => <span key={i} className="text-[10px] text-muted">{d.label}</span>)}
      </div>
    </div>
  );
}

export function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 50); return () => clearTimeout(t); }, []);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 40; const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const circle = (
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="12"
              strokeDasharray={`${animated ? len : 0} ${c}`}
              strokeDashoffset={-offset}
              style={{ transition: `stroke-dasharray 1s ease-out ${i * 0.1}s` }} />
          );
          offset += len;
          return circle;
        })}
        <text x="50" y="50" className="rotate-90" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="middle"
          fontSize="14" fontWeight="700" fill="currentColor">{total}</text>
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-muted">{d.label}</span>
            <span className="font-semibold tabular-nums ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = '#2563eb', label }: { value: number; max?: number; color?: string; label?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((value / max) * 100), 50); return () => clearTimeout(t); }, [value, max]);
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1.5"><span className="text-muted">{label}</span><span className="font-semibold tabular-nums">{value}{max === 100 ? '%' : ''}</span></div>}
      <div className="h-2 rounded-full surface-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}
