import React, { useEffect, useState } from 'react';
import {
  Lock,
  LogIn,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MiniAppLogo } from './MiniAppLogo';
import { useTheme } from '../context/ThemeContext';

interface LoginScreenProps {
  configured: boolean;
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ configured, onSuccess }) => {
  const { theme, toggleTheme, isWhite } = useTheme();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockLeft, setLockLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lockLeft]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || lockLeft > 0 || !password.trim()) return;
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

      // Trigger error shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);

      if (res.status === 429) {
        setLockLeft(data.retryAfterSec || 900);
        setError('تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً کمی صبر کنید.');
      } else if (res.status === 503) {
        setError('رمز عبور پنل هنوز روی سرور تنظیم نشده است.');
      } else {
        setError('رمز عبور وارد شده نادرست است.');
      }
    } catch {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setBusy(false);
    }
  };

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mm = String(Math.floor(lockLeft / 60)).padStart(2, '0');
  const ss = String(lockLeft % 60).padStart(2, '0');

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 ${
      isWhite ? 'bg-neutral-100 text-black' : 'bg-[#060913] text-slate-100'
    } overflow-hidden select-none font-['Vazirmatn',sans-serif] transition-colors duration-200`}>
      {/* Dynamic Ambient Background Lights */}
      {!isWhite && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.55, 0.35],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/10 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.25, 0.45, 0.25],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-600/15 to-purple-600/10 blur-3xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        </div>
      )}

      {/* Main Login Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: isShaking ? [-10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{
          duration: isShaking ? 0.5 : 0.6,
          ease: 'easeOut',
        }}
        className="relative z-10 w-full max-w-md"
      >
        <div className={`relative rounded-3xl ${
          isWhite
            ? 'bg-white border border-neutral-200 shadow-2xl text-black'
            : 'bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 shadow-2xl shadow-cyan-950/40 text-slate-100'
        } p-6 sm:p-8 space-y-6 overflow-hidden transition-colors duration-200`}>
          
          {/* Theme Toggle Button (Corner) */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
                isWhite
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
              title={isWhite ? 'تغییر به حالت شب 🌙' : 'تغییر به حالت تک سفید با متن سیاه ☀️'}
            >
              {isWhite ? (
                <>
                  <Moon className="w-4 h-4 text-cyan-600" />
                  <span className="text-[10px]">شب 🌙</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px]">تک سفید ☀️</span>
                </>
              )}
            </button>
          </div>

          {/* Subtle Top Glow Line */}
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

          {/* Header Brand Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative cursor-pointer group"
            >
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-500/30 via-cyan-500/30 to-amber-500/30 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <MiniAppLogo size={76} className="relative z-10 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/25" />
              <div className="absolute -bottom-1 -right-1 z-20 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
              </div>
            </motion.div>

            <div className="space-y-1">
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
                isWhite ? 'text-black' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-300'
              }`}>
                پنل مدیریت MODASR ARZ
              </h1>
              <p className={`text-xs ${isWhite ? 'text-neutral-600' : 'text-slate-400'} font-medium`}>
                سامانه هوشمند استعلام زنده قیمت ارز، طلا و رمزارز
              </p>
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              isWhite ? 'bg-neutral-100 border border-neutral-300 text-neutral-800' : 'bg-slate-950/70 border border-slate-800 text-slate-300'
            } text-[11px]`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-mono ${isWhite ? 'text-neutral-600' : 'text-slate-400'}`}>Security Gate • SSL 256-Bit</span>
            </div>
          </div>

          {/* Unconfigured Password Notice */}
          {!configured ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-amber-950/20 p-5 text-sm space-y-3 text-amber-200 shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5 font-bold text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>رمز عبور مدیریت تنظیم نشده است</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-100/80">
                برای تنظیم رمز عبور پنل ادمین، کافیست دستور زیر را در خط فرمان سرور اجرا نموده و سپس صفحه را رفرش فرمایید:
              </p>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/30 font-mono text-xs">
                <span dir="ltr" className="text-cyan-300 font-bold tracking-wider">
                  modasr passwd
                </span>
                <button
                  type="button"
                  onClick={() => copyCommand('modasr passwd')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors text-[11px] font-sans font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی دستور'}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* Login Form */
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>رمز عبور پنل مدیریت</span>
                  </label>
                  {lockLeft > 0 && (
                    <span className="text-[11px] text-rose-400 font-mono font-bold animate-pulse">
                      قفل موقت ({mm}:{ss})
                    </span>
                  )}
                </div>

                <div
                  className={`relative rounded-2xl transition-all duration-300 border ${
                    isFocused
                      ? 'border-cyan-500/80 shadow-lg shadow-cyan-500/15 bg-slate-950'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className={`w-4 h-4 transition-colors ${isFocused ? 'text-cyan-400' : ''}`} />
                  </div>

                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus
                    autoComplete="current-password"
                    dir="ltr"
                    disabled={busy || lockLeft > 0}
                    placeholder="••••••••••••"
                    className="w-full py-3.5 pr-10 pl-11 bg-transparent text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    disabled={busy || lockLeft > 0}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    aria-label="نمایش / مخفی‌سازی رمز"
                  >
                    {show ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Banner with Smooth Transition */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="flex-1 leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={busy || lockLeft > 0 || !password.trim()}
                whileHover={busy || lockLeft > 0 || !password.trim() ? {} : { scale: 1.015 }}
                whileTap={busy || lockLeft > 0 || !password.trim() ? {} : { scale: 0.985 }}
                className="w-full relative group overflow-hidden py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-600 hover:from-amber-400 hover:via-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <LogIn className="w-4 h-4 text-slate-950 transition-transform group-hover:-translate-x-0.5" />
                )}
                <span>{busy ? 'در حال تایید و ورود...' : 'ورود به پنل مدیریت'}</span>
              </motion.button>
            </form>
          )}

          {/* Quick MiniApp Link Divider */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>مینی‌اپ عمومی بدون نیاز به لاگین:</span>
            </span>
            <a
              href="/?view=miniapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>مشاهده مینی‌اپ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-[11px] text-slate-500 font-mono tracking-wider">
            mini MODASR arz • Encrypted Administration
          </p>
          <p className="text-[10px] text-slate-600">
            تمامی حقوق محفوظ است © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
