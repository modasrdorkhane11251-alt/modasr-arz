import React, { useCallback, useEffect, useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { LoginScreen } from './LoginScreen';
import { detectMiniApp } from '../lib/miniApp';

type GateState = 'checking' | 'login' | 'ready';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMiniApp = detectMiniApp();
  const [state, setState] = useState<GateState>(isMiniApp ? 'ready' : 'checking');
  const [configured, setConfigured] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setConfigured(data.configured !== false);
      setState(data.authenticated ? 'ready' : 'login');
    } catch {
      setState('login');
    }
  }, []);

  useEffect(() => {
    if (!isMiniApp) {
      check();
      const interval = setInterval(check, 60000);
      return () => clearInterval(interval);
    }
  }, [isMiniApp, check]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setState('login');
    }
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (state === 'login') {
    return <LoginScreen configured={configured} onSuccess={() => setState('ready')} />;
  }

  return (
    <>
      {children}
      {!isMiniApp && (
        <button
          onClick={logout}
          className="fixed bottom-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300 hover:text-rose-300 hover:border-rose-500/40 backdrop-blur"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </button>
      )}
    </>
  );
};
