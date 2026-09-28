import { useState } from 'react';
import { User, Mail, Phone, Save, Moon, Sun, Bell, Globe, HelpCircle, Info, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Card, Spinner } from '@/components/ui';

export function UserProfile() {
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await updateProfile({ full_name: name, phone }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-display font-bold text-xl">Profile</h1>

      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center text-xl font-bold">
          {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : profile?.full_name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-display font-bold text-lg">{profile?.full_name}</div>
          <div className="text-sm text-muted">{profile?.email}</div>
          <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400 mt-1 capitalize">{profile?.role}</span>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-4">Edit Profile</h3>
        <div className="space-y-4">
          <div><label className="text-sm font-medium block mb-1.5">Full Name</label><div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={name} onChange={(e) => setName(e.target.value)} className="input pl-11" /></div></div>
          <div><label className="text-sm font-medium block mb-1.5">Phone</label><div className="relative"><Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-11" placeholder="+1 234 567 890" /></div></div>
          <div><label className="text-sm font-medium block mb-1.5">Email</label><div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={profile?.email || ''} disabled className="input pl-11 opacity-60" /></div></div>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Spinner size={16} /> : <Save size={16} />} {saved ? 'Saved!' : 'Save Changes'}</button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-3">Preferences</h3>
        <Toggle icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} label="Dark Mode" value={theme === 'dark'} onChange={toggle} />
        <Toggle icon={<Bell size={18} />} label="Push Notifications" value={true} onChange={() => {}} />
        <Row icon={<Globe size={18} />} label="Language" value="English" />
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-3">Support</h3>
        <Row icon={<HelpCircle size={18} />} label="Help & Support" />
        <Row icon={<Info size={18} />} label="About RoadGuard" />
        <Row icon={<ShieldCheck size={18} />} label="Privacy Policy" />
      </Card>

      <button onClick={signOut} className="btn-ghost w-full text-red-500 hover:text-red-600 border-red-200 dark:border-red-500/20"><LogOut size={16} /> Sign Out</button>
    </div>
  );
}

function Toggle({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3"><span className="text-muted">{icon}</span><span className="text-sm font-medium">{label}</span></div>
      <button onClick={onChange} className={`w-11 h-6 rounded-full transition relative ${value ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 cursor-pointer hover:surface-2 -mx-2 px-2 rounded-lg transition">
      <div className="flex items-center gap-3"><span className="text-muted">{icon}</span><span className="text-sm font-medium">{label}</span></div>
      <div className="flex items-center gap-1 text-sm text-muted">{value}<ChevronRight size={16} /></div>
    </div>
  );
}
