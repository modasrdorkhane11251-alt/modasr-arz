import React, { useState } from 'react';
import {
  Bot,
  RefreshCw,
  Send,
  ShieldCheck,
  Power,
  Activity,
  ExternalLink,
  Smartphone,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  Menu,
  Sparkles,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { NavigationDrawer } from './NavigationDrawer';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  botInfo: any;
  webhookInfo: any;
  botStatus: boolean;
  onRefresh: () => void;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  botInfo,
  webhookInfo,
  botStatus,
  onRefresh,
  loading,
  activeTab,
  setActiveTab,
}) => {
  const isWebhookSet = !!(webhookInfo?.result?.url && webhookInfo.result.url.length > 0);
  const botUsername = botInfo?.result?.username || 'Modasr_Arzbot';

  // Theme context
  const { theme, toggleTheme, isWhite } = useTheme();

  // Navigation Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Backup modal state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastedJson, setPastedJson] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        await executeRestore(parsed);
      } catch (err: any) {
        setBackupFeedback({ type: 'error', text: 'فایل بک‌آپ نامعتبر است (فرمت JSON معتبر نیست).' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePastedRestore = async () => {
    if (!pastedJson.trim()) {
      setBackupFeedback({ type: 'error', text: 'لطفاً متن بک‌آپ JSON را وارد کنید.' });
      return;
    }
    try {
      const parsed = JSON.parse(pastedJson.trim());
      await executeRestore(parsed);
    } catch {
      setBackupFeedback({ type: 'error', text: 'کد JSON وارد شده نامعتبر است.' });
    }
  };

  const executeRestore = async (backupPayload: any) => {
    try {
      setRestoring(true);
      setBackupFeedback(null);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: backupPayload }),
      });
      const data = await res.json();
      if (data?.ok || data?.success) {
        setBackupFeedback({
          type: 'success',
          text: data.message || '✅ اطلاعات و تنظیمات ربات با موفقیت بازیابی شدند.',
        });
        setPastedJson('');
        onRefresh();
      } else {
        setBackupFeedback({
          type: 'error',
          text: `❌ خطا در بازیابی: ${data?.message || data?.error || 'نامشخص'}`,
        });
      }
    } catch (err: any) {
      setBackupFeedback({ type: 'error', text: `خطا در برقراری ارتباط: ${err.message}` });
    } finally {
      setRestoring(false);
    }
  };

  const navItems = [
    { id: 'webhook', label: 'تنظیم و وضعیت وبهوک', icon: Activity },
    { id: 'simulator', label: 'شبیه‌ساز و تست پیام', icon: Send },
    { id: 'prices', label: 'تابلوی زنده قیمت‌ها', icon: RefreshCw },
    { id: 'miniapp', label: '📱 mini MODASR arz', icon: Smartphone },
    { id: 'admin', label: 'آمار و مدیریت ادمین', icon: ShieldCheck },
    { id: 'apis', label: '⚡ مرکز جامع APIها', icon: Zap },
    { id: 'logs', label: 'لاگ رویدادها', icon: Bot },
  ];

  return (
    <header className={`border-b ${isWhite ? 'border-neutral-200 bg-white/95 text-black shadow-sm' : 'border-slate-800 bg-slate-900/80 text-white'} backdrop-blur-md sticky top-0 z-40 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Logo & Bot Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isWhite ? 'border-white' : 'border-slate-900'} ${
                  botStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
                title={botStatus ? 'ربات فعال است' : 'ربات خاموش است'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-bold ${isWhite ? 'text-black' : 'text-white'} tracking-wide`}>
                  ربات تلگرام ارز و طلا
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-mono font-bold">
                  v2.0 Webhook
                </span>
              </div>
              <div className={`flex items-center gap-3 text-xs ${isWhite ? 'text-neutral-800' : 'text-slate-400'} mt-0.5`}>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${isWhite ? 'text-neutral-900 hover:text-cyan-700 font-bold' : 'text-slate-400 hover:text-cyan-400'} flex items-center gap-1 transition-colors font-mono`}
                >
                  @{botUsername}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isWebhookSet ? (
                    <span className={`${isWhite ? 'text-emerald-800 font-bold' : 'text-emerald-500 font-medium'} flex items-center gap-1`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      وبهوک متصل
                    </span>
                  ) : (
                    <span className={`${isWhite ? 'text-amber-800 font-bold' : 'text-amber-500 font-medium'} flex items-center gap-1`}>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      در انتظار تنظیم وبهوک
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Actions: Active section indicator and ONLY Drawer button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Current Active Section Badge */}
            {(() => {
              const currentTab = navItems.find((n) => n.id === activeTab) || navItems[0];
              const CurrentIcon = currentTab.icon;
              return (
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
                    isWhite
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200'
                  } text-xs font-bold`}
                >
                  <CurrentIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>بخش جاری: {currentTab.label}</span>
                </div>
              );
            })()}

            {/* Direct Project ZIP Download Button */}
            <a
              href="/api/download-zip"
              download="modasr-arz-project.zip"
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md border ${
                isWhite
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 shadow-emerald-500/10'
              }`}
              title="دانلود فایل زیپ کامل پروژه برای گیت‌هاب"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">دانلود ZIP پروژه 📦</span>
              <span className="sm:hidden">ZIP 📦</span>
            </a>

            {/* Drawer Button (کشو / دسترسی به تمام بخش‌ها، تنظیمات و ابزارها) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2.5 transition-all active:scale-95 shadow-md border ${
                isWhite
                  ? 'bg-amber-50 hover:bg-amber-100/90 text-neutral-950 border-2 border-amber-500/60 shadow-amber-500/10 ring-1 ring-amber-500/20'
                  : 'bg-gradient-to-r from-amber-500/25 via-cyan-500/20 to-purple-500/20 hover:from-amber-500/35 hover:to-purple-500/35 text-amber-300 hover:text-white border border-amber-500/40 shadow-amber-500/10'
              }`}
              title="باز کردن منوی کشویی و دسترسی سریع به تمام بخش‌ها"
            >
              <Menu className={`w-5 h-5 ${isWhite ? 'text-amber-600 stroke-[2.5]' : 'text-amber-400'}`} />
              <span className={`text-sm font-black ${isWhite ? 'text-neutral-950' : 'text-amber-300'}`}>
                منوی کشویی (کشو) 📑
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Drawer (کشو) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botInfo={botInfo}
        webhookInfo={webhookInfo}
        botStatus={botStatus}
        onRefresh={onRefresh}
        onOpenBackup={() => {
          setBackupFeedback(null);
          setIsBackupModalOpen(true);
        }}
        loading={loading}
      />

      {/* Backup & Restore Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">سامانه پشتیبان‌گیری و بازیابی (Backup & Restore)</h3>
                  <p className="text-[11px] text-slate-400">ذخیره و بازیابی تمام دکمه‌ها، رنگ‌ها، ایموجی‌ها و کاربران</p>
                </div>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Alert */}
            {backupFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                  backupFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {backupFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{backupFeedback.text}</span>
              </div>
            )}

            {/* Step 1: Export / Download Backup */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">۱. دریافت و دانلود فایل بک‌آپ (Export)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                  JSON Format
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                شامل لیست کامل کاربران، گروه‌ها، لیست سیاه، دکمه‌های شیشه‌ای، کدهای رنگ HEX، ایموجی‌های پرمیوم، تنظیمات ارسال به کانال و لاگ‌ها.
              </p>
              <a
                href="/api/backup/export"
                download={`modasr-arz-backup-${new Date().toISOString().split('T')[0]}.json`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>📥 دانلود فایل بک‌آپ کامل (.json)</span>
              </a>
            </div>

            {/* Step 2: Import / Restore Backup */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">۲. بازیابی از فایل بک‌آپ (Import & Restore)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  Upload File
                </span>
              </div>

              {/* Upload Input */}
              <label className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-900/60 flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-900 transition-all group">
                <FileJson className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{restoring ? 'در حال بازیابی...' : '📂 انتخاب فایل بک‌آپ JSON از کامپیوتر'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  disabled={restoring}
                  className="hidden"
                />
              </label>

              {/* Paste JSON expander / input */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">یا کد متنی JSON بک‌آپ را اینجا قرار دهید:</span>
                <textarea
                  rows={2}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='{"version":"2.0.0", "data": { ... }}'
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePastedRestore}
                  disabled={restoring || !pastedJson.trim()}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{restoring ? 'در حال بازیابی...' : 'بازیابی از کد متنی'}</span>
                </button>
              </div>
            </div>

            {/* Step 3: Complete Project Source ZIP for GitHub */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">۳. دریافت سورس‌کد کامل پروژه برای گیت‌هاب (Full Project ZIP)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  ZIP Package
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                بسته کامل شامل کدهای سرور Express، فرانت‌اند React، استایل‌ها، انواع TypeScript، دیتابیس داده‌ها و تنظیمات، بدون وابستگی‌های اضافی و آماده آپلود در گیت‌هاب.
              </p>
              <a
                href="/api/download-zip"
                download="modasr-arz-project.zip"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>📦 دانلود مستقیم سورس‌کد کامل پروژه (modasr-arz-project.zip)</span>
              </a>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

