import React from 'react';
import { Bot, RefreshCw, Send, ShieldCheck, Power, Activity, ExternalLink, Smartphone, Download } from 'lucide-react';

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

  const navItems = [
    { id: 'webhook', label: 'تنظیم و وضعیت وبهوک', icon: Activity },
    { id: 'simulator', label: 'شبیه‌ساز و تست پیام', icon: Send },
    { id: 'prices', label: 'تابلوی زنده قیمت‌ها', icon: RefreshCw },
    { id: 'miniapp', label: '📱 mini MODASR arz', icon: Smartphone },
    { id: 'admin', label: 'آمار و مدیریت ادمین', icon: ShieldCheck },
    { id: 'logs', label: 'لاگ رویدادها', icon: Bot },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Logo & Bot Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  botStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
                title={botStatus ? 'ربات فعال است' : 'ربات خاموش است'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  ربات تلگرام ارز و طلا
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  v2.0 Webhook
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors font-mono font-medium"
                >
                  @{botUsername}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isWebhookSet ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      وبهوک متصل
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      در انتظار تنظیم وبهوک
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Actions & Refresh */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <a
              href="/api/download-zip"
              download="modasr-arz-project.zip"
              className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-800/50 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="دانلود فایل فشرده کل پروژه برای گیت‌هاب"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>دانلود سورس کامل (ZIP)</span>
            </a>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              title="بروزرسانی وضعیت"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>بروزرسانی وضعیت</span>
            </button>

            <a
              href={`https://t.me/${botUsername}?start=start`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>باز کردن در تلگرام</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
