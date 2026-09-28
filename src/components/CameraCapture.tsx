import { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, ImageIcon } from 'lucide-react';

export function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing }, audio: false,
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError('Camera access denied. You can upload a photo instead.');
      }
    }
    start();
    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  const snap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 960;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-display font-semibold text-lg">Capture Road Damage</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={22} /></button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center gap-4">
            <Camera size={48} className="opacity-50" />
            <p className="text-sm opacity-80">{error}</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary">
              <Upload size={18} /> Upload Photo
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-72 h-72 border-2 border-white/40 rounded-2xl" />
        </div>
      </div>
      <div className="p-6 flex items-center justify-center gap-6">
        <button onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"><RefreshCw size={22} /></button>
        <button onClick={snap} disabled={!!error}
          className="w-18 h-18 p-1 rounded-full border-4 border-white/80 disabled:opacity-40">
          <div className="w-full h-full rounded-full bg-white" />
        </button>
        <button onClick={() => fileRef.current?.click()} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20">
          <ImageIcon size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onCapture(f); }} />
      </div>
    </div>
  );
}
