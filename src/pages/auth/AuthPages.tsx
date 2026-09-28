import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, KeyRound, CheckCircle2, Loader2, ArrowLeft, User, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GoogleButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 rounded-xl border border-base surface-1 font-semibold text-sm flex items-center justify-center gap-3 hover:surface-2 transition disabled:opacity-60"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[rgb(var(--border))]" />
      <span className="text-xs text-muted font-medium">or</span>
      <div className="flex-1 h-px bg-[rgb(var(--border))]" />
    </div>
  );
}

export function Login({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
  const { signIn, sendOtp, verifyOtpAndSignIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed'); }
    finally { setGoogleLoading(false); }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await signIn(email, password); }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg.includes('Invalid login') ? 'Invalid email or password.' : msg);
    }
    finally { setLoading(false); }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await sendOtp(email); setOtpSent(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to send code'); }
    finally { setLoading(false); }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await verifyOtpAndSignIn(email, token); }
    catch (err) { setError(err instanceof Error ? err.message : 'Verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to monitor road conditions">
      <GoogleButton onClick={handleGoogle} loading={googleLoading} label="Continue with Google" />
      <Divider />
      <div className="flex gap-1 p-1 rounded-xl surface-2 mb-5">
        <button onClick={() => { setMode('password'); setError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === 'password' ? 'bg-primary-600 text-white' : 'text-muted'}`}>Password</button>
        <button onClick={() => { setMode('otp'); setError(''); setOtpSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === 'otp' ? 'bg-primary-600 text-white' : 'text-muted'}`}>Email code</button>
      </div>
      {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3 mb-4 animate-fade-in"><AlertCircle size={16} /> {error}</div>}
      {mode === 'password' ? (
        <form onSubmit={submitPassword} className="space-y-4">
          <Field icon={<Mail size={18} />} label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="you@example.com" />
          </Field>
          <Field icon={<Lock size={18} />} label="Password">
            <input type={password ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-11 pr-11" placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[rgb(var(--text))]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </Field>
          <div className="flex justify-end">
            <button type="button" onClick={onForgot} className="text-sm text-primary-600 hover:underline font-medium">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
      ) : !otpSent ? (
        <form onSubmit={sendCode} className="space-y-4">
          <Field icon={<Mail size={18} />} label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="you@example.com" />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Sending code…' : <>Send code <KeyRound size={18} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl p-3">
            <CheckCircle2 size={16} /> Code sent to {email}
          </div>
          <Field icon={<KeyRound size={18} />} label="One-time code">
            <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} className="input pl-11 tracking-[0.4em] font-bold text-center" placeholder="000000" />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Verifying…' : <>Verify & sign in <ArrowRight size={18} /></>}
          </button>
          <button type="button" onClick={() => setOtpSent(false)} className="btn-ghost w-full">Use a different email</button>
        </form>
      )}
      <p className="text-center text-sm text-muted mt-6">
        No account? <button onClick={onSwitch} className="text-primary-600 font-semibold hover:underline">Create one</button>
      </p>
    </AuthShell>
  );
}

export function Register({ onSwitch }: { onSwitch: () => void }) {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-up failed'); }
    finally { setGoogleLoading(false); }
  };

  const captureLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
        setLocError('');
      },
      (err) => {
        setLocLoading(false);
        let msg = 'Failed to capture location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser and try again.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable. Please try again.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('A valid email address is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Contact Number is required.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!coords) {
      setError('Current location is required before account creation. Please click "Capture Current Location".');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name.trim(), phone.trim(), coords.lat, coords.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Join RoadGuard to report and monitor road conditions">
      <GoogleButton onClick={handleGoogle} loading={googleLoading} label="Sign up with Google" />
      <Divider />
      <form onSubmit={handleCreateAccount} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3 animate-fade-in">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        <Field icon={<User size={18} />} label="Full Name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input pl-11"
            placeholder="Enter your full name"
          />
        </Field>
        <Field icon={<Mail size={18} />} label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-11"
            placeholder="Enter your email"
          />
        </Field>
        <Field icon={<Phone size={18} />} label="Contact Number">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input pl-11"
            placeholder="Enter your phone number"
          />
        </Field>
        <Field icon={<Lock size={18} />} label="Password">
          <input
            type={show ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-11 pr-11"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[rgb(var(--text))]"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </Field>

        <div>
          <label className="block text-sm font-medium mb-1.5">Location</label>
          <button
            type="button"
            onClick={captureLocation}
            disabled={locLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-base surface-1 hover:surface-2 font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 mb-2"
          >
            <MapPin size={18} className="text-primary-600" />
            {locLoading ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Capturing Location…</span>
            ) : (
              '📍 Capture Current Location'
            )}
          </button>

          {coords && (
            <div className="surface-2 p-3 rounded-xl border border-emerald-500/30 text-sm space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <CheckCircle2 size={15} /> Location captured:
              </div>
              <div className="text-xs text-muted font-mono">Latitude: {coords.lat.toFixed(6)}</div>
              <div className="text-xs text-muted font-mono">Longitude: {coords.lng.toFixed(6)}</div>
            </div>
          )}

          {locError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3 animate-fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{locError}</span>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Creating account…</span>
          ) : (
            <>Create Account <ArrowRight size={18} /></>
          )}
        </button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account? <button onClick={onSwitch} className="text-primary-600 font-semibold hover:underline">Sign in</button>
      </p>
    </AuthShell>
  );
}

export function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await resetPassword(email); setSent(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll send you a recovery link">
      {sent ? (
        <div className="text-center py-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Mail size={26} /></div>
          <p className="text-sm text-muted">Check your email for a reset link.</p>
          <button onClick={onBack} className="btn-ghost mt-5">Back to login</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3"><AlertCircle size={16} /> {error}</div>}
          <Field icon={<Mail size={18} />} label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="you@example.com" />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Sending…' : 'Send reset link'}</button>
          <button type="button" onClick={onBack} className="btn-ghost w-full">Back to login</button>
        </form>
      )}
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#000000,#171717 40%,#262626)' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #404040 0%, transparent 50%), radial-gradient(circle at 80% 80%, #171717 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"><ShieldCheck size={24} /></div>
            <span className="font-display font-bold text-xl">RoadGuard</span>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-4xl leading-tight">Report and track<br />road damage</h2>
            <p className="text-white/70 mt-4 max-w-md">Capture road images, get instant damage analysis, and track repairs in real time across your city.</p>
            <div className="flex gap-6 mt-8">
              {[['6', 'Damage types'], ['Real-time', 'Sync'], ['Live', 'Map']].map(([n, l]) => (
                <div key={l}><div className="text-2xl font-bold">{n}</div><div className="text-white/60 text-sm">{l}</div></div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-sm">Building safer roads together</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 surface">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white"><ShieldCheck size={22} /></div>
            <span className="font-display font-bold text-lg">RoadGuard</span>
          </div>
          <h1 className="font-display font-bold text-2xl">{title}</h1>
          <p className="text-muted mt-1.5 mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        {children}
      </div>
    </div>
  );
}
