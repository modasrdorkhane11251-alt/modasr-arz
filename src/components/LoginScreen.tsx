import React, { useEffect, useState } from 'react';
import { Lock, LogIn, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  configured: boolean;
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ configured, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockLeft, setLockLeft] = useState(0);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lockLeft]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || lockLeft > 0 || !password) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        onSuccess();
        return;
      }
      if (res.status === 429) {
        setLockLeft(data.retryAfterSec || 900);
        setError('تلاش‌های ناموفق زیاد بود. موقتاً مسدود شدید.');
      } else if (res.status === 503) {
        setError('رمز پنل روی سرور تنظیم نشده است.');
      } else {
        setError('رمز عبور اشتباه است.');
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  };

  const mm = String(Math.floor(lockLeft / 60)).padStart(2, '0');
  const ss = String(lockLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-cyan-300" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-100">پنل مدیریت MODASR ARZ</h1>
          <p className="text-xs text-slate-500 mt-1">برای ادامه وارد شوید</p>
        </div>

        {!configured ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>رمز پنل تنظیم نشده است</span>
            </div>
            <p className="text-xs leading-6 text-amber-100/80">
              روی سرور این دستور را اجرا کنید و بعد صفحه را رفرش کنید:
            </p>
            <code dir="ltr" className="block text-left rounded-lg bg-slate-950/70 px-3 py-2 text-cyan-300 text-xs font-mono">
              modasr passwd
            </code>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">رمز عبور</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label="نمایش رمز"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
                {lockLeft > 0 && (
                  <span dir="ltr" className="font-mono mr-1">
                    ({mm}:{ss})
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || lockLeft > 0 || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-sm font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>ورود به پنل</span>
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-600 mt-4">MODASR ARZ • Secure Admin Access</p>
      </div>
    </div>
  );
};
