import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Splash } from '@/pages/auth/Splash';
import { Login, Register, ForgotPassword } from '@/pages/auth/AuthPages';
import { UserApp } from '@/pages/user/UserApp';
import { AdminApp } from '@/pages/admin/AdminApp';
import { Spinner } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';

type AuthScreen = 'login' | 'register' | 'forgot';

function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  if (screen === 'register') return <Register onSwitch={() => setScreen('login')} />;
  if (screen === 'forgot') return <ForgotPassword onBack={() => setScreen('login')} />;
  return <Login onSwitch={() => setScreen('register')} onForgot={() => setScreen('forgot')} />;
}

function Gate() {
  const { state, profile } = useAuth();

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center surface">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center mb-4"><ShieldCheck size={28} /></div>
        <Spinner size={24} />
      </div>
    );
  }
  if (state === 'unauthenticated') return <AuthFlow />;
  if (!profile) return <AuthFlow />; // profile not yet loaded
  if (profile.role === 'admin') return <AdminApp />;
  return <UserApp />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        {showSplash ? <Splash onDone={() => setShowSplash(false)} /> : <Gate />}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
