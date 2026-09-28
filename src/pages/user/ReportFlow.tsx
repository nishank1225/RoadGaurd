import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, Check, X, MapPin, AlertCircle, Zap, RefreshCw, Gauge, Grid3x3, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeImage } from '@/lib/detection';
import { uploadReportImage } from '@/lib/storage';
import { logAudit, notifyUser, getAppSettings, countReportsToday } from '@/lib/services';
import type { DetectionResult, GridCell } from '@/lib/types';
import { DAMAGE_TYPE_LABEL, SEVERITY_LABEL, PRIORITY_LABEL } from '@/lib/types';
import { severityBgClass, severityColor } from '@/lib/format';
import { DetectionCanvas } from '@/components/DetectionCanvas';

type Stage = 'capture' | 'analyzing' | 'review' | 'uploading' | 'done' | 'error';

type GPSState = 'idle' | 'fetching' | 'success' | 'denied' | 'error';

export function ReportFlow({ onDone }: { onDone: () => void }) {
  const { profile } = useAuth();
  const [stage, setStage] = useState<Stage>('capture');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsState, setGpsState] = useState<GPSState>('idle');
  const [locationText, setLocationText] = useState('');
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(10);
  const [usedToday, setUsedToday] = useState(0);
  const [limitLoading, setLimitLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const [s, used] = await Promise.all([getAppSettings(), countReportsToday(profile.id)]);
        setLimit(s.daily_report_limit);
        setUsedToday(used);
      } catch { /* default to 10 */ }
      finally { setLimitLoading(false); }
    })();
  }, [profile]);

  const remaining = Math.max(0, limit - usedToday);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } },
      );
      if (!res.ok) return '';
      const data = await res.json();
      return data.display_name || '';
    } catch { return ''; }
  };

  const captureGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { setGpsState('error'); resolve(null); return; }
      setGpsState('fetching');
      let resolved = false;
      const done = (pos: { lat: number; lng: number } | null) => {
        if (resolved) return; resolved = true; resolve(pos);
      };
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGps(result); setGpsState('success');
          reverseGeocode(result.lat, result.lng).then((addr) => {
            if (addr) setLocationText(addr);
          });
          done(result);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setGpsState('denied');
          else setGpsState('error');
          done(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
      setTimeout(() => done(null), 18000);
    });
  };

  const retryGPS = async () => {
    await captureGPS();
  };

  const handleFile = async (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f)); setStage('analyzing'); setError('');
    setLocationText('');
    const pos = await captureGPS();
    try {
      const res = await analyzeImage(f, f.name);
      setResult(res); setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed'); setStage('error');
    }
  };

  const submit = async () => {
    if (!file || !result || !profile) return;
    if (remaining <= 0) { setError(`You've reached the daily limit of ${limit} reports.`); setStage('error'); return; }
    setStage('uploading');
    try {
      const imageUrl = await uploadReportImage(file, profile.id);
      const locText = locationText || (gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : '');
      const { data, error } = await supabase.from('reports').insert({
        image_url: imageUrl,
        damage_type: result.damage_type,
        severity: result.severity,
        confidence: result.confidence,
        road_health_score: result.road_health_score,
        prediction_time_ms: result.prediction_time_ms,
        bounding_boxes: result.bounding_boxes,
        pothole_count: result.pothole_count,
        crack_count: result.crack_count,
        edge_damage_count: result.edge_damage_count,
        severity_score: result.severity_score,
        grid_map: result.grid_map,
        deterioration_risk: result.deterioration_risk,
        maintenance_priority: result.maintenance_priority,
        latitude: gps?.lat ?? null,
        longitude: gps?.lng ?? null,
        location_text: locText,
        status: 'pending',
      }).select().single();
      if (error) throw error;
      await logAudit('report_created', 'reports', data.id, { damage_type: result.damage_type });
      // notify admins
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').eq('is_active', true);
      if (admins) {
        await Promise.all(admins.map((a) => notifyUser(a.id, 'new_report', 'New report submitted',
          `${DAMAGE_TYPE_LABEL[result.damage_type]} • ${SEVERITY_LABEL[result.severity]} severity`, data.id)));
      }
      setStage('done');
      setUsedToday((u) => u + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed'); setStage('error');
    }
  };

  const reset = () => { setFile(null); setPreview(''); setResult(null); setGps(null); setError(''); setStage('capture'); };

  if (stage === 'capture') return <CaptureStage onFile={handleFile} limit={limit} remaining={remaining} loading={limitLoading} />;

  if (stage === 'analyzing') return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-primary-600 text-white flex items-center justify-center"><Zap size={36} /></div>
        <div className="absolute inset-0 rounded-2xl border-4 border-primary-500/30 animate-ping" />
      </div>
      <h2 className="font-display font-bold text-xl mt-6">Running analysis</h2>
      <p className="text-muted text-sm mt-2">Detecting road damage from the image…</p>
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );

  if (stage === 'done') return (
    <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
      <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Check size={40} /></div>
      <h2 className="font-display font-bold text-xl mt-6">Report submitted!</h2>
      <p className="text-muted text-sm mt-2 text-center max-w-sm">Your report has been sent for admin verification. You'll be notified when it's reviewed.</p>
      <div className="flex gap-3 mt-6">
        <button onClick={reset} className="btn-ghost"><RefreshCw size={16} /> New report</button>
        <button onClick={onDone} className="btn-primary">View history</button>
      </div>
    </div>
  );

  if (stage === 'error') return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-600 flex items-center justify-center"><X size={32} /></div>
      <h2 className="font-display font-bold text-xl mt-4">Something went wrong</h2>
      <p className="text-muted text-sm mt-2">{error}</p>
      <button onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );

  // review
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl">Review detection</h2>
        <p className="text-muted text-sm mt-1">Confirm before submitting this report</p>
      </div>

      <div className="card p-4">
        <DetectionCanvas imageUrl={preview} boxes={result!.bounding_boxes} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoBox label="Damage Type" value={DAMAGE_TYPE_LABEL[result!.damage_type]} />
        <InfoBox label="Severity">
          <span className={`badge ${severityBgClass(result!.severity)}`}>{SEVERITY_LABEL[result!.severity]}</span>
        </InfoBox>
        <InfoBox label="Confidence" value={`${(result!.confidence * 100).toFixed(1)}%`} />
        <InfoBox label="Road Health Score" value={result!.road_health_score} />
        <InfoBox label="Prediction Time" value={`${result!.prediction_time_ms} ms`} />
        <InfoBox label="Detections" value={result!.bounding_boxes.length} />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-primary-600" />
          <span className="text-sm font-semibold">Damage Breakdown</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="text-2xl font-display font-bold">{result!.pothole_count}</div><div className="text-xs text-muted">Potholes</div></div>
          <div><div className="text-2xl font-display font-bold">{result!.crack_count}</div><div className="text-xs text-muted">Cracks</div></div>
          <div><div className="text-2xl font-display font-bold">{result!.edge_damage_count}</div><div className="text-xs text-muted">Edge Damage</div></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoBox label="Severity Score" value={`${result!.severity_score} / 5`} />
        <InfoBox label="Maintenance Priority">
          <span className={`badge ${severityBgClass(result!.maintenance_priority === 'urgent' ? 'critical' : result!.maintenance_priority === 'high' ? 'high' : 'medium')}`}>{PRIORITY_LABEL[result!.maintenance_priority]}</span>
        </InfoBox>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-primary-600" />
          <span className="text-sm font-semibold">Deterioration Risk</span>
          <span className="text-xs text-muted ml-auto">{(result!.deterioration_risk * 100).toFixed(0)}% probability</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${result!.deterioration_risk > 0.7 ? 'bg-red-500' : result!.deterioration_risk > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${result!.deterioration_risk * 100}%` }} />
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Grid3x3 size={16} className="text-primary-600" />
          <span className="text-sm font-semibold">Spatial Severity Map</span>
          <span className="text-xs text-muted ml-auto">3×3 grid of detected damage</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
          {result!.grid_map.map((cell, i) => (
            <GridCellBox key={i} cell={cell} />
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-primary-600" />
          <span className="text-sm font-semibold">GPS Location</span>
          {gpsState === 'fetching' && <span className="text-xs text-muted ml-auto flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Acquiring satellite…</span>}
          {gpsState === 'success' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-auto" />}
          {gpsState === 'denied' && <span className="text-xs text-amber-600 ml-auto">Permission denied</span>}
          {gpsState === 'error' && <span className="text-xs text-red-500 ml-auto">Unavailable</span>}
        </div>
        {gps ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</div>
            {locationText ? <div className="text-xs text-muted">{locationText}</div> : <div className="text-xs text-muted">Resolving address…</div>}
            <a href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lng}`} target="_blank" rel="noreferrer" className="text-xs text-primary-600 font-medium inline-flex items-center gap-1">
              <MapPin size={11} /> View on map
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-muted">
              {gpsState === 'denied' ? 'Location permission was denied. Please allow location access in your browser settings to attach GPS coordinates.' : 'Could not capture GPS. You can retry or submit without location.'}
            </div>
            <button onClick={retryGPS} disabled={gpsState === 'fetching'} className="btn-ghost text-xs py-2 flex items-center gap-1.5">
              {gpsState === 'fetching' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Retry GPS
            </button>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle size={16} /> <span>Maintenance recommendation: {result!.severity === 'critical' ? 'Immediate repair required' : result!.severity === 'high' ? 'Schedule urgent repair' : result!.severity === 'medium' ? 'Monitor and plan repair' : 'Routine inspection'}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={reset} className="btn-ghost flex-1"><X size={16} /> Discard</button>
        <button onClick={submit} disabled={stage === 'uploading'} className="btn-primary flex-1">
          {stage === 'uploading' ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Check size={16} /> Submit Report</>}
        </button>
      </div>
    </div>
  );
}

function CaptureStage({ onFile, limit, remaining, loading }: { onFile: (f: File) => void; limit: number; remaining: number; loading: boolean }) {
  const [showCam, setShowCam] = useState(false);
  const reached = remaining <= 0;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="font-display font-bold text-xl">Report Road Damage</h2>
        <p className="text-muted text-sm mt-1">Capture or upload a road image for analysis</p>
      </div>
      {!loading && (
        <div className={`card p-4 mb-4 flex items-center gap-3 ${reached ? 'border-amber-400' : ''}`}>
          <Gauge size={18} className={reached ? 'text-amber-500' : 'text-primary-600'} />
          <div className="flex-1">
            <div className="text-sm font-semibold">Daily report limit</div>
            <div className="text-xs text-muted">
              {reached ? `You've used all ${limit} reports for today. Come back tomorrow.` : `${remaining} of ${limit} remaining today`}
            </div>
          </div>
          <div className={`text-2xl font-display font-bold tabular-nums ${reached ? 'text-amber-500' : 'text-primary-600'}`}>{remaining}/{limit}</div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => setShowCam(true)} disabled={reached} className="card p-8 flex flex-col items-center gap-3 hover:shadow-card-hover hover:-translate-y-1 transition group disabled:opacity-40 disabled:pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-500/10 text-primary-600 flex items-center justify-center group-hover:scale-110 transition"><Camera size={28} /></div>
          <div className="font-semibold">Take Photo</div>
          <div className="text-xs text-muted">Use your camera</div>
        </button>
        <label className={`card p-8 flex flex-col items-center gap-3 transition group ${reached ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:shadow-card-hover hover:-translate-y-1'}`}>
          <div className="w-14 h-14 rounded-2xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center group-hover:scale-110 transition"><Upload size={28} /></div>
          <div className="font-semibold">Upload Image</div>
          <div className="text-xs text-muted">Choose from gallery</div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
      </div>
      <div className="card p-4 mt-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-primary-600 mt-0.5" />
        <p className="text-sm text-muted">For best results, capture a clear photo of the road surface with good lighting. GPS will be automatically attached.</p>
      </div>
      {showCam && <CameraModal onCapture={(f) => { setShowCam(false); onFile(f); }} onClose={() => setShowCam(false)} />}
    </div>
  );
}

function CameraModal({ onCapture, onClose }: { onCapture: (f: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { setErr('Camera unavailable — upload a photo instead.'); }
    })();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const snap = () => {
    if (!videoRef.current) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth || 720; c.height = videoRef.current.videoHeight || 960;
    c.getContext('2d')!.drawImage(videoRef.current, 0, 0, c.width, c.height);
    c.toBlob((b) => { if (b) onCapture(new File([b], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-display font-semibold">Camera</span>
        <button onClick={onClose} className="p-2"><X size={22} /></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        {err ? (
          <div className="text-white text-center p-8">
            <p className="mb-4">{err}</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload size={16} /> Upload</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onCapture(f); }} />
          </div>
        ) : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
      </div>
      {!err && <div className="p-6 flex justify-center"><button onClick={snap} className="w-16 h-16 rounded-full border-4 border-white"><div className="w-full h-full rounded-full bg-white" /></button></div>}
    </div>
  );
}

function InfoBox({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="font-display font-bold text-lg">{value || children}</div>
    </div>
  );
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
