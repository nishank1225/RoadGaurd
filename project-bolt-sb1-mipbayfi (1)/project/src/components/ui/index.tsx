import type { ReactNode, CSSProperties } from 'react';

export function Card({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <div onClick={onClick} style={style}
      className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, trend, color = 'primary', delay = 0 }: {
  icon: ReactNode; label: string; value: ReactNode; trend?: string; color?: string; delay?: number;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    accent: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
  };
  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
        {trend && <span className="text-xs text-muted font-medium">{trend}</span>}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold font-display tabular-nums">{value}</div>
        <div className="text-sm text-muted mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function EmptyState({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl surface-2 flex items-center justify-center text-muted mb-4">{icon}</div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      {subtitle && <p className="text-muted text-sm mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Toast({ message, type = 'info', onClose }: { message: string; type?: 'info' | 'success' | 'error'; onClose: () => void }) {
  const colors = {
    info: 'bg-primary-600', success: 'bg-emerald-600', error: 'bg-red-600',
  };
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
      <div className={`${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium`}>
        <span>{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
