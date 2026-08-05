import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, KeyRound, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ensureAdminAccount } from '@/lib/setup';

export function Login({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
  const { signIn, sendOtp, verifyOtpAndSignIn } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [setupState, setSetupState] = useState<'running' | 'done' | 'skipped'>('running');

  useEffect(() => {
    ensureAdminAccount()
      .then(() => setSetupState('done'))
      .catch(() => setSetupState('done'));
  }, []);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email === 'admin@roadguard') {
      setSetupState('running');
      await ensureAdminAccount().catch(() => {});
      setSetupState('done');
    }
    setLoading(true);
    try { await signIn(email, password); }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg.includes('Invalid login') ? 'Invalid email or password. The admin account may still be provisioning — please wait a few seconds and try again.' : msg);
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
      <div className="mt-4 p-3 rounded-xl surface-2 text-xs text-muted flex items-center justify-between gap-2">
        <span>Admin demo account</span>
        <button type="button" onClick={() => { setEmail('admin@roadguard'); setPassword('admin@2026'); setMode('password'); }}
          className="text-primary-600 font-semibold hover:underline">Fill credentials</button>
      </div>
      {setupState === 'running' && (
        <div className="mt-2 text-xs text-muted text-center flex items-center justify-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          Provisioning admin account…
        </div>
      )}
      <p className="text-center text-sm text-muted mt-4">
        Don't have an account? <button onClick={onSwitch} className="text-primary-600 font-semibold hover:underline">Sign up</button>
      </p>
    </AuthShell>
  );
}

export function Register({ onSwitch }: { onSwitch: () => void }) {
  const { sendOtp, verifyOtpAndSignUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await sendOtp(email); setStep(2); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to send code'); }
    finally { setLoading(false); }
  };

  const verifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await verifyOtpAndSignUp(email, token, password, name); }
    catch (err) { setError(err instanceof Error ? err.message : 'Verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title={step === 1 ? 'Create account' : 'Verify your email'} subtitle={step === 1 ? 'Join RoadGuard to report road damage' : `Enter the 6-digit code sent to ${email}`}>
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3 animate-fade-in"><AlertCircle size={16} /> {error}</div>}
          <Field icon={<Mail size={18} />} label="Full name">
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input pl-11" placeholder="Jane Doe" />
          </Field>
          <Field icon={<Mail size={18} />} label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="you@example.com" />
          </Field>
          <Field icon={<Lock size={18} />} label="Password">
            <input type={password ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-11 pr-11" placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[rgb(var(--text))]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Sending code…</span> : <>Send verification code <KeyRound size={18} /></>}
          </button>
          <p className="text-xs text-muted text-center">A one-time code will be emailed to verify your address.</p>
        </form>
      ) : (
        <form onSubmit={verifyAndCreate} className="space-y-4 animate-fade-in">
          {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-3"><AlertCircle size={16} /> {error}</div>}
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl p-3">
            <CheckCircle2 size={16} /> Code sent to {email}
          </div>
          <Field icon={<KeyRound size={18} />} label="One-time code">
            <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} className="input pl-11 tracking-[0.4em] font-bold text-center" placeholder="000000" />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying…</span> : <>Verify & create account <ArrowRight size={18} /></>}
          </button>
          <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn-ghost w-full">
            <span className="flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back</span>
          </button>
        </form>
      )}
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
            <h2 className="font-display font-extrabold text-4xl leading-tight">AI-powered road<br />damage detection</h2>
            <p className="text-white/70 mt-4 max-w-md">Capture road images, get instant ML damage analysis, and track repairs in real time across your city.</p>
            <div className="flex gap-6 mt-8">
              {[['6', 'Damage types'], ['Real-time', 'Sync'], ['ML', 'Detection']].map(([n, l]) => (
                <div key={l}><div className="text-2xl font-bold">{n}</div><div className="text-white/60 text-sm">{l}</div></div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-sm">Securing roads with machine learning</p>
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
