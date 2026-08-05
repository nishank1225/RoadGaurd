import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export function Splash({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setTimeout(onDone, 300); return 100; }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#172554,#1e3a8a,#2563eb)' }}>
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 30%, #60a5fa 0%, transparent 40%), radial-gradient(circle at 75% 70%, #3b82f6 0%, transparent 40%)' }} />
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full border border-white/10 animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full border border-white/10 animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center animate-scale-in">
        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl">
          <ShieldCheck size={44} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-white font-display font-extrabold text-3xl tracking-tight">RoadGuard</h1>
        <p className="text-white/60 text-sm mt-1.5 font-medium">ML Road Damage Detection</p>
        <div className="w-44 h-1 bg-white/10 rounded-full mt-10 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="absolute bottom-8 text-white/40 text-xs">Securing roads with AI</div>
    </div>
  );
}
