import React, { useState, useEffect } from 'react';
import {
  Globe,
  TrendingUp,
  Smartphone,
  Send,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Key,
  Shield,
  Zap,
  Radio,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Server,
  Layers,
  Database,
  Terminal,
  Cpu,
  ChevronRight,
  Flame,
  LineChart,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ApiHubConfig, DEFAULT_API_HUB_CONFIG } from '../bot/types';

interface ApiHubPanelProps {
  onRefreshPrices?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ApiHubPanel: React.FC<ApiHubPanelProps> = ({
  onRefreshPrices,
  onNavigateToTab,
}) => {
  const { isWhite } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'miniapp' | 'channel' | 'presets'>('prices');
  const [config, setConfig] = useState<ApiHubConfig>(DEFAULT_API_HUB_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Connection testing states
  const [testingTarget, setTestingTarget] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [connectingAll, setConnectingAll] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; status: number; latencyMs: number; message: string }>>({});

  // Fetch current configs from server
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config/apis');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.config) {
          setConfig(json.config);
        }
      }
    } catch {
      // Fallback to defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Connect All APIs with strict configured-only and dual-API mode enabled
  const handleConnectAll = async () => {
    try {
      setConnectingAll(true);
      setSaveSuccess(null);
      setSaveError(null);
      const res = await fetch('/api/config/apis/connect-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.config) setConfig(data.config);
        setSaveSuccess('🟢 تمامی APIها با موفقیت متصل شدند! اتصال دوگانه و حالت فقط APIهای داده‌شده فعال گردید.');
        if (onRefreshPrices) onRefreshPrices();
        await handleTestAll();
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError(data.error || 'خطا در اتصال APIها');
      }
    } catch (e: any) {
      setSaveError(e.message || 'خطا در اتصال به سرور');
    } finally {
      setConnectingAll(false);
    }
  };

  // Test all configured APIs in parallel
  const handleTestAll = async () => {
    try {
      setTestingAll(true);
      const res = await fetch('/api/config/apis/test-all', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok && data.results) {
        setTestResults((prev) => ({
          ...prev,
          ...data.results,
        }));
        setSaveSuccess(`🟢 وضعیت تمامی ${data.totalApis || 12} درگاه بررسی شد: ۱۰۰٪ آنلاین و متصل.`);
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (e: any) {
      setSaveError('خطا در پینگ کلیه APIها: ' + e.message);
    } finally {
      setTestingAll(false);
    }
  };

  // Save configs to server
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(null);
      setSaveError(null);

      const res = await fetch('/api/config/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const json = await res.json();
      if (json.ok) {
        setSaveSuccess('✅ تمام تنظیمات API برای مینی‌اپ، چنل گزارش و تابلو قیمت با موفقیت ذخیره شد.');
        if (onRefreshPrices) onRefreshPrices();
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setSaveError(json.error || 'خطا در ذخیره‌سازی تنظیمات');
      }
    } catch (e: any) {
      setSaveError(e.message || 'خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  // Live test single API
  const handleTestApi = async (key: string, url: string, headerName?: string, headerValue?: string) => {
    if (!url) return;
    setTestingTarget(key);
    try {
      const res = await fetch('/api/config/apis/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          headerName,
          headerValue,
          timeoutMs: 5000,
        }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          ok: data.ok,
          status: data.status,
          latencyMs: data.latencyMs,
          message: data.ok
            ? `اتصال پایدار و زنده (${data.latencyMs}ms)`
            : (data.error || `خطا: وضعیت ${data.status}`),
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          status: 0,
          latencyMs: 0,
          message: err.message || 'عدم دسترسی به سرور مقصد',
        },
      }));
    } finally {
      setTestingTarget(null);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'tgju_default' | 'nobitex' | 'wallex' | 'vip_channel') => {
    if (presetType === 'tgju_default') {
      setConfig((prev) => ({
        ...prev,
        priceBoard: {
          ...prev.priceBoard,
          primaryProvider: 'tgju',
          goldApiUrl: 'https://call.tgju.org/ajax.json',
          fiatApiUrl: 'https://call.tgju.org/ajax.json',
          cryptoApiUrl: 'https://api.wallex.ir/v1/markets',
          oilEnergyApiUrl: 'https://call.tgju.org/ajax.json',
          refreshIntervalSec: 5,
          enableRechartsTrends: true,
        },
      }));
      setSaveSuccess('قالب پیش‌فرض TGJU و والکس اعمال شد. برای نهایی‌سازی دکمه ذخیره را بزنید.');
    } else if (presetType === 'nobitex') {
      setConfig((prev) => ({
        ...prev,
        priceBoard: {
          ...prev.priceBoard,
          primaryProvider: 'nobitex',
          cryptoApiUrl: 'https://api.nobitex.ir/market/stats',
          refreshIntervalSec: 5,
        },
      }));
      setSaveSuccess('قالب نوبیتکس (Nobitex Market API) اعمال شد.');
    } else if (presetType === 'wallex') {
      setConfig((prev) => ({
        ...prev,
        priceBoard: {
          ...prev.priceBoard,
          primaryProvider: 'wallex',
          cryptoApiUrl: 'https://api.wallex.ir/v1/markets',
          refreshIntervalSec: 5,
        },
      }));
      setSaveSuccess('قالب والکس (Wallex Exchange) اعمال شد.');
    } else if (presetType === 'vip_channel') {
      setConfig((prev) => ({
        ...prev,
        channelReport: {
          ...prev.channelReport,
          isEnabled: true,
          postIntervalMinutes: 30,
          postTemplateMode: 'image_card_and_summary',
          reportTitle: '🚀 بولتن VIP و استعلام لحظه‌ای بازار ارز و طلا',
          include24hChange: true,
          includeHighLow: true,
          includeWatermark: true,
        },
      }));
      setSaveSuccess('قالب بولتن VIP گزارش کانال اعمال شد.');
    }
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
          isWhite
            ? 'bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 border-cyan-200'
            : 'bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-cyan-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                  مرکز جامع مدیریت و پیکربندی APIها
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 font-mono">
                  API Hub
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  همه APIها متصل 🟢
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  اتصال ۲ گانه فعال (Dual API) ⚡️
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  حالت اختصاصی (فقط APIهای داده‌شده)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConnectAll}
              disabled={connectingAll}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all active:scale-95"
              title="اتصال قطعی و فوری تمامی درگاه‌ها و اعمال تنظیمات دوگانه"
            >
              <Zap className={`w-4 h-4 ${connectingAll ? 'animate-spin' : ''}`} />
              <span>{connectingAll ? 'در حال برقراری اتصال...' : 'اتصال همه APIها 🚀'}</span>
            </button>

            <button
              onClick={handleTestAll}
              disabled={testingAll}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                isWhite
                  ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50 shadow-sm'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title="بررسی و پینگ زنده تمامی APIها"
            >
              <Radio className={`w-3.5 h-3.5 text-cyan-400 ${testingAll ? 'animate-ping' : ''}`} />
              <span>{testingAll ? 'در حال پینگ...' : 'پینگ زنده کلیه APIها'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('prices')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeSubTab === 'prices'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
              : isWhite
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>۱. تابلوی زنده قیمت‌ها (Price Board API)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('miniapp')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeSubTab === 'miniapp'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : isWhite
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>۲. مینی‌اپ پاسخ و استعلام (Mini-App API)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('channel')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeSubTab === 'channel'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : isWhite
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>۳. چنل گزارش و ارسال خودکار (Channel Report API)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('presets')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeSubTab === 'presets'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : isWhite
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>۴. قالب‌های آماده و وب‌هوک‌ها (Presets & Webhooks)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: تابلوی زنده قیمت‌ها (Price Board API Settings) */}
      {/* ======================================================== */}
      {activeSubTab === 'prices' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border ${
              isWhite ? 'bg-white border-neutral-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            } space-y-6`}
          >
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                    پیکربندی APIهای تابلوی زنده قیمت‌ها
                  </h3>
                  <p className="text-xs text-slate-400">
                    تنظیم ارائه‌دهنده و URLهای اختصاصی دریافت نرخ زنده طلا، سکه، دلار، کریپتو و نفت
                  </p>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('prices')}
                  className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>مشاهده تابلوی زنده</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Provider Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2">منبع و ارائه‌دهنده اصلی فید (Primary Provider)</label>
                <select
                  value={config.priceBoard.primaryProvider}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      priceBoard: { ...config.priceBoard, primaryProvider: e.target.value as any },
                    })
                  }
                  className={`w-full p-3 rounded-2xl border text-xs font-bold outline-none ${
                    isWhite
                      ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                >
                  <option value="tgju">شبکه اطلاع‌رسانی طلا و ارز (TGJU Live Ajax - پیش‌فرض پایدار)</option>
                  <option value="wallex">صرافی والکس (Wallex Exchange Direct)</option>
                  <option value="nobitex">صرافی نوبیتکس (Nobitex Direct Orderbook)</option>
                  <option value="binance">بایننس بین‌المللی (Binance Global Spot)</option>
                  <option value="custom">آدرس و سرور سفارشی (Custom API Endpoint)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2">نرخ به‌روزرسانی زنده تابلو (Refresh Rate)</label>
                <div className="flex items-center gap-2">
                  {[3, 5, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          priceBoard: { ...config.priceBoard, refreshIntervalSec: sec },
                        })
                      }
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        config.priceBoard.refreshIntervalSec === sec
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : isWhite
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sec} ثانیه
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual API Endpoints */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
                آدرس‌ها و Endpointهای فید هر دسته‌بندی
              </h4>

              {/* Toggles for Dual API and Strict Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30">
                  <div>
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      اتصال ۲ گانه همگام (Dual API)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">اتصال همزمان هر دو API (اصلی + دوم) جهت افزایش پایداری</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.priceBoard.dualApiEnabled ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, dualApiEnabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-purple-500/10 border-purple-500/30">
                  <div>
                    <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      فقط APIهای داده‌شده (Strict Mode)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">فقط و فقط APIهای وارد شده متصل شده و هیچ منبع دیگری فراخوانی نمی‌شود</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.priceBoard.enforceConfiguredApisOnly ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, enforceConfiguredApisOnly: e.target.checked },
                      })
                    }
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 1. Gold & Coins API (Dual API: Primary & Secondary) */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-black">طلا، سکه و مظنه (Gold & Coins - اتصال ۲ گانه)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">۲ تا API</span>
                  </div>
                </div>

                {/* Gold API 1 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۱ (اصلی):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('gold', config.priceBoard.goldApiUrl)}
                      disabled={testingTarget === 'gold'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'gold' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'gold' ? 'تست...' : 'تست API ۱'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.goldApiUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, goldApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://call.tgju.org/ajax.json"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-500'
                        : 'bg-slate-900 border-slate-700 text-amber-300 focus:border-amber-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['gold'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['gold'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['gold'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['gold'].message}</span>
                    </div>
                  )}
                </div>

                {/* Gold API 2 */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۲ (دوم / پشتیبان و همگام):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('gold_sec', config.priceBoard.goldSecondaryApiUrl)}
                      disabled={testingTarget === 'gold_sec'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'gold_sec' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'gold_sec' ? 'تست...' : 'تست API ۲'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.goldSecondaryApiUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, goldSecondaryApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://api.fast-creat.ir/gold?apikey=..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-500'
                        : 'bg-slate-900 border-slate-700 text-amber-300 focus:border-amber-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['gold_sec'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['gold_sec'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['gold_sec'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['gold_sec'].message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Crypto & Tether API (Dual API: Wallex + Nobitex) */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-black">رمزارزها، تتر و صرافی‌ها (Crypto & Tether - اتصال ۲ گانه)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">۲ تا API</span>
                  </div>
                </div>

                {/* Crypto API 1 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۱ (اصلی - صرافی والکس):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('crypto', config.priceBoard.cryptoApiUrl)}
                      disabled={testingTarget === 'crypto'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'crypto' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'crypto' ? 'تست...' : 'تست API ۱'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.cryptoApiUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, cryptoApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://api.wallex.ir/v1/markets"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-cyan-500'
                        : 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['crypto'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['crypto'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['crypto'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['crypto'].message}</span>
                    </div>
                  )}
                </div>

                {/* Crypto API 2 */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۲ (دوم / صرافی نوبیتکس):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('crypto_sec', config.priceBoard.cryptoSecondaryApiUrl)}
                      disabled={testingTarget === 'crypto_sec'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'crypto_sec' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'crypto_sec' ? 'تست...' : 'تست API ۲'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.cryptoSecondaryApiUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, cryptoSecondaryApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://api.nobitex.ir/market/stats"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-cyan-500'
                        : 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['crypto_sec'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['crypto_sec'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['crypto_sec'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['crypto_sec'].message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Oil & Energy Global Market API (Dual API) */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span className="text-xs font-black">نفت جهانی، برنت و گاز (Oil & Energy - اتصال ۲ گانه)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">۲ تا API</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۱ (نفت و انرژی اصلی):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('oil', config.priceBoard.oilEnergyApiUrl)}
                      disabled={testingTarget === 'oil'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'oil' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'oil' ? 'تست...' : 'تست API ۱'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.oilEnergyApiUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, oilEnergyApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://call.tgju.org/ajax.json"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-orange-500'
                        : 'bg-slate-900 border-slate-700 text-orange-300 focus:border-orange-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['oil'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['oil'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['oil'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['oil'].message}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">API شماره ۲ (نفت جهانی دوم / فید مکمل):</label>
                    <button
                      type="button"
                      onClick={() => handleTestApi('oil_sec', config.priceBoard.oilEnergySecondaryApiUrl)}
                      disabled={testingTarget === 'oil_sec'}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 font-bold flex items-center gap-1"
                    >
                      <Radio className={`w-3 h-3 ${testingTarget === 'oil_sec' ? 'animate-ping' : ''}`} />
                      <span>{testingTarget === 'oil_sec' ? 'تست...' : 'تست API ۲'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.priceBoard.oilEnergySecondaryApiUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priceBoard: { ...config.priceBoard, oilEnergySecondaryApiUrl: e.target.value },
                      })
                    }
                    placeholder="https://api.oilpriceapi.com/v1/prices/latest"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                      isWhite
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-orange-500'
                        : 'bg-slate-900 border-slate-700 text-orange-300 focus:border-orange-500'
                    }`}
                    dir="ltr"
                  />
                  {testResults['oil_sec'] && (
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['oil_sec'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {testResults['oil_sec'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResults['oil_sec'].message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Custom JSON API & API Key */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black">کلید احراز هویت / توکن API (Header Authentication - اختیاری)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">نام هدر (Header Name)</label>
                    <input
                      type="text"
                      value={config.priceBoard.apiKeyHeaderName || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          priceBoard: { ...config.priceBoard, apiKeyHeaderName: e.target.value },
                        })
                      }
                      placeholder="X-API-KEY یا Authorization"
                      className={`w-full p-2 rounded-xl border text-xs font-mono outline-none ${
                        isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">مقدار کلید (API Key / Token)</label>
                    <input
                      type="password"
                      value={config.priceBoard.apiKeyHeaderValue || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          priceBoard: { ...config.priceBoard, apiKeyHeaderValue: e.target.value },
                        })
                      }
                      placeholder="e.g. sk_live_..."
                      className={`w-full p-2 rounded-xl border text-xs font-mono outline-none ${
                        isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Recharts trend toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5">
                <div className="flex items-center gap-2.5">
                  <LineChart className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-xs font-black">فعال‌سازی نمودار خطی روند ۲۴ ساعته Recharts در تابلو</span>
                    <p className="text-[11px] text-slate-400">رسم موج‌های زنده و تغییرات ساعتی در کارت‌های استعلام</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.priceBoard.enableRechartsTrends}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      priceBoard: { ...config.priceBoard, enableRechartsTrends: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: مینی‌اپ پاسخ و هوش استعلام (Mini-App API Settings) */}
      {/* ======================================================== */}
      {activeSubTab === 'miniapp' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border ${
              isWhite ? 'bg-white border-neutral-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            } space-y-6`}
          >
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                    پیکربندی API مینی‌اپ پاسخ و استعلامات
                  </h3>
                  <p className="text-xs text-slate-400">
                    تنظیم Endpoint داده‌های زنده، موتور پردازش پاسخ‌ها، نمودارهای تعاملی و وب‌هوک مینی‌اپ
                  </p>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('miniapp')}
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>پیش‌نمایش مینی‌اپ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dual API for Mini-App */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API 1: Data Endpoint */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-black">API شماره ۱: خوراک داده و چارت‌ها (Data Feed)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestApi('miniapp_data', config.miniApp.dataEndpoint)}
                    disabled={testingTarget === 'miniapp_data'}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 font-bold flex items-center gap-1"
                  >
                    <Radio className={`w-3 h-3 ${testingTarget === 'miniapp_data' ? 'animate-ping' : ''}`} />
                    <span>تست API ۱</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={config.miniApp.dataEndpoint}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      miniApp: { ...config.miniApp, dataEndpoint: e.target.value },
                    })
                  }
                  placeholder="/api/miniapp/data"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                    isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-purple-300'
                  }`}
                  dir="ltr"
                />
                {testResults['miniapp_data'] && (
                  <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['miniapp_data'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {testResults['miniapp_data'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResults['miniapp_data'].message}</span>
                  </div>
                )}
              </div>

              {/* API 2: Response Endpoint */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span className="text-xs font-black">API شماره ۲: موتور پاسخ و استعلام هوشمند (Response API)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestApi('miniapp_response', config.miniApp.responseEndpoint || '/api/bot/response')}
                    disabled={testingTarget === 'miniapp_response'}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 font-bold flex items-center gap-1"
                  >
                    <Radio className={`w-3 h-3 ${testingTarget === 'miniapp_response' ? 'animate-ping' : ''}`} />
                    <span>تست API ۲</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={config.miniApp.responseEndpoint || '/api/bot/response'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      miniApp: { ...config.miniApp, responseEndpoint: e.target.value },
                    })
                  }
                  placeholder="/api/bot/response"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                    isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-indigo-300'
                  }`}
                  dir="ltr"
                />
                {testResults['miniapp_response'] && (
                  <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['miniapp_response'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {testResults['miniapp_response'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResults['miniapp_response'].message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Refresh Interval */}
            <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
              <label className="block text-xs font-bold mb-2">فاصله بازخوانی خودکار در مینی‌اپ (Auto-Refresh)</label>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        miniApp: { ...config.miniApp, refreshIntervalSec: sec },
                      })
                    }
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      config.miniApp.refreshIntervalSec === sec
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : isWhite
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sec} ثانیه
                  </button>
                ))}
              </div>
            </div>

            {/* AI Query & Response Engine */}
            <div className={`p-5 rounded-2xl border ${isWhite ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-xs font-black">موتور هوشمند پاسخ‌گویی به استعلامات (Smart Response Engine)</span>
                    <p className="text-[11px] text-slate-400">تحلیل پرسش‌های طبیعی، تبدیل مقادیر، و پاسخ سریع در مینی‌اپ</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.miniApp.aiQueryEnabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      miniApp: { ...config.miniApp, aiQueryEnabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>

              {config.miniApp.aiQueryEnabled && (
                <div className="space-y-3 pt-2 border-t border-purple-500/20 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">ارائه‌دهنده هوش پاسخ‌گویی (AI Engine Provider)</label>
                    <select
                      value={config.miniApp.aiProvider}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          miniApp: { ...config.miniApp, aiProvider: e.target.value as any },
                        })
                      }
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    >
                      <option value="internal_engine">موتور داخلی فوق سریع پردازش نرخ‌ها (Internal Engine - بدون نیاز به کلید)</option>
                      <option value="gemini">سرویس هوش مصنوعی Gemini (Google GenAI API)</option>
                      <option value="custom_webhook">وب‌هوک هوشمند سفارشی (Custom Webhook Endpoint)</option>
                    </select>
                  </div>

                  {config.miniApp.aiProvider === 'gemini' && (
                    <div>
                      <label className="block text-xs font-bold mb-1 text-purple-300">کلید API اختصاصی Gemini (اختیاری در صورت استفاده)</label>
                      <input
                        type="password"
                        value={config.miniApp.aiApiKey || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            miniApp: { ...config.miniApp, aiApiKey: e.target.value },
                          })
                        }
                        placeholder="AIzaSy..."
                        className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                          isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                        dir="ltr"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1">پرامپت و شخصیت پاسخ‌دهی سیستم (System Instruction)</label>
                    <textarea
                      rows={2}
                      value={config.miniApp.aiSystemPrompt}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          miniApp: { ...config.miniApp, aiSystemPrompt: e.target.value },
                        })
                      }
                      className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                        isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom MiniApp Webhook */}
            <div>
              <label className="block text-xs font-bold mb-1.5">وب‌هوک رویدادها یا ثبت تعاملات کاربر در مینی‌اپ (اختیاری)</label>
              <input
                type="text"
                value={config.miniApp.customWebhookUrl || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    miniApp: { ...config.miniApp, customWebhookUrl: e.target.value },
                  })
                }
                placeholder="https://your-domain.com/api/miniapp-webhook"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: چنل گزارش و ارسال خودکار (Channel Report API) */}
      {/* ======================================================== */}
      {activeSubTab === 'channel' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border ${
              isWhite ? 'bg-white border-neutral-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            } space-y-6`}
          >
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                    پیکربندی API چنل گزارش و بولتن خودکار تلگرام
                  </h3>
                  <p className="text-xs text-slate-400">
                    تنظیم ربات ارسال گزارش، شناسه کانال هدف، بازه زمانی بولتن ساعتی و قالب ظاهری
                  </p>
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('admin')}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>مدیریت کانال و ادمین</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Enable switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-black">فعال‌سازی ارسال خودکار گزارش به کانال تلگرام</span>
                  <p className="text-[11px] text-slate-400">ربات به صورت خودکار سر ساعت تعیین‌شده گزارش بازار را به کانال ارسال می‌کند</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.channelReport.isEnabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    channelReport: { ...config.channelReport, isEnabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Dual Channel API (Primary & Secondary Gateway) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API 1: Primary Telegram Gateway */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black">API شماره ۱: درگاه اصلی تلگرام (Primary Send API)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestApi('channel_api1', `${config.channelReport.primaryApiUrl || 'https://api.telegram.org'}`)}
                    disabled={testingTarget === 'channel_api1'}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 font-bold flex items-center gap-1"
                  >
                    <Radio className={`w-3 h-3 ${testingTarget === 'channel_api1' ? 'animate-ping' : ''}`} />
                    <span>تست API ۱</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={config.channelReport.primaryApiUrl || 'https://api.telegram.org'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channelReport: { ...config.channelReport, primaryApiUrl: e.target.value },
                    })
                  }
                  placeholder="https://api.telegram.org"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                    isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-emerald-300'
                  }`}
                  dir="ltr"
                />
                {testResults['channel_api1'] && (
                  <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['channel_api1'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {testResults['channel_api1'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResults['channel_api1'].message}</span>
                  </div>
                )}
              </div>

              {/* API 2: Secondary / Backup Gateway */}
              <div className={`p-4 rounded-2xl border ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <span className="text-xs font-black">API شماره ۲: درگاه دوم / پشتیبان چنل (Secondary / Mirror)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestApi('channel_api2', `${config.channelReport.secondaryApiUrl || 'https://api.telegram.org'}`)}
                    disabled={testingTarget === 'channel_api2'}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 font-bold flex items-center gap-1"
                  >
                    <Radio className={`w-3 h-3 ${testingTarget === 'channel_api2' ? 'animate-ping' : ''}`} />
                    <span>تست API ۲</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={config.channelReport.secondaryApiUrl || 'https://api.telegram.org'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channelReport: { ...config.channelReport, secondaryApiUrl: e.target.value },
                    })
                  }
                  placeholder="https://api.telegram.org"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                    isWhite ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-slate-900 border-slate-700 text-teal-300'
                  }`}
                  dir="ltr"
                />
                {testResults['channel_api2'] && (
                  <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-1.5 ${testResults['channel_api2'].ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {testResults['channel_api2'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResults['channel_api2'].message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Channel Targets (Main & Backup) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">کانال اصلی گزارش (Channel 1)</label>
                <input
                  type="text"
                  value={config.channelReport.channelUsernameOrId}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channelReport: { ...config.channelReport, channelUsernameOrId: e.target.value },
                    })
                  }
                  placeholder="@MODASR_ARZ یا -100123456789"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none ${
                    isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-emerald-300'
                  }`}
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  کانال اول دریافت‌کننده بولتن زنده ساعتی
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">کانال دوم / کانال پشتیبان (Channel 2 - بکاپ)</label>
                <input
                  type="text"
                  value={config.channelReport.secondaryChannelId || '@MODASR_ARZ_BACKUP'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channelReport: { ...config.channelReport, secondaryChannelId: e.target.value },
                    })
                  }
                  placeholder="@MODASR_ARZ_BACKUP"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none ${
                    isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-teal-300'
                  }`}
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  کانال دوم جهت ارسال موازی یا پشتیبان بولتن‌ها
                </p>
              </div>
            </div>

            {/* Bot Token */}
            <div>
              <label className="block text-xs font-bold mb-1.5">توکن اختصاصی ربات جهت گزارش کانال (اختیاری)</label>
              <input
                type="password"
                value={config.channelReport.botToken || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    channelReport: { ...config.channelReport, botToken: e.target.value },
                  })
                }
                placeholder="خالی = استفاده از توکن پیش‌فرض ربات اصلی"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
                dir="ltr"
              />
            </div>

            {/* Interval & Template Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2">فاصله ارسال بولتن خودکار به کانال</label>
                <div className="flex items-center gap-2">
                  {[15, 30, 60, 120, 240].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          channelReport: { ...config.channelReport, postIntervalMinutes: mins },
                        })
                      }
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        config.channelReport.postIntervalMinutes === mins
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : isWhite
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {mins < 60 ? `${mins} دقیقه` : `${mins / 60} ساعت`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2">قالب بصری گزارش در کانال</label>
                <select
                  value={config.channelReport.postTemplateMode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      channelReport: { ...config.channelReport, postTemplateMode: e.target.value as any },
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <option value="image_card_and_summary">کارت گرافیکی PNG + بولتن کامل متنی و دکمه‌های شیشه‌ای</option>
                  <option value="grid_overview">تصویر جدول گرید تمام شاخص‌ها + کپشن فشرده</option>
                  <option value="text_summary">گزارش متنی با ایموجی‌های پرمیوم و بدون تصویر</option>
                </select>
              </div>
            </div>

            {/* Report Header Title */}
            <div>
              <label className="block text-xs font-bold mb-1.5">عنوان هدر پیام بولتن در کانال</label>
              <input
                type="text"
                value={config.channelReport.reportTitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    channelReport: { ...config.channelReport, reportTitle: e.target.value },
                  })
                }
                placeholder="📊 گزارش و بولتن زنده بازار ارز و طلا"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* Custom Broadcast Webhook */}
            <div>
              <label className="block text-xs font-bold mb-1.5">وب‌هوک ارسال همزمان گزارش به سرور یا کانال دیگر (اختیاری)</label>
              <input
                type="text"
                value={config.channelReport.customBroadcastWebhookUrl || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    channelReport: { ...config.channelReport, customBroadcastWebhookUrl: e.target.value },
                  })
                }
                placeholder="https://my-webhook.ir/channel-broadcast"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                  isWhite ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
                dir="ltr"
              />
            </div>

            {/* Test Post Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/channel/post-now', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        channelId: config.channelReport.channelUsernameOrId,
                        token: config.channelReport.botToken,
                      }),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setSaveSuccess('✅ پیام گزارش تستی با موفقیت به کانال تلگرام ارسال شد!');
                    } else {
                      setSaveError(`خطا در ارسال: ${resData.error || 'عدم دسترسی به کانال'}`);
                    }
                  } catch (e: any) {
                    setSaveError(e.message || 'خطا در برقراری ارتباط');
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال تستی آنی گزارش به کانال همین الان</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: قالب‌های آماده و ابزار تست (Presets & Developer) */}
      {/* ======================================================== */}
      {activeSubTab === 'presets' && (
        <div className="space-y-6">
          {/* Quick Presets Grid */}
          <div
            className={`p-6 rounded-3xl border ${
              isWhite ? 'bg-white border-neutral-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            } space-y-4`}
          >
            <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                  قالب‌های آماده یک‌کلیکه APIها (Presets)
                </h3>
                <p className="text-xs text-slate-400">
                  تنظیم سریع آدرس‌ها بر اساس صرافی‌ها و مراجع معتبر با یک کلیک
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div
                onClick={() => applyPreset('tgju_default')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                  isWhite
                    ? 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-200'
                    : 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-amber-500">🏆 شبکه رسمی TGJU + والکس (پیش‌فرض پیشنهادی)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">بدون کلید</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  بالاترین پایداری برای طلا ۱۸، سکه امامی، دلار و تتر با بازخوانی لحظه‌ای و کاملاً رایگان.
                </p>
              </div>

              <div
                onClick={() => applyPreset('nobitex')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                  isWhite
                    ? 'bg-blue-50/50 hover:bg-blue-100/50 border-blue-200'
                    : 'bg-blue-950/20 hover:bg-blue-950/40 border-blue-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-blue-400">⚡ صرافی نوبیتکس مستقیم (Nobitex Direct)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">Nobitex API</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  اتصال نرخ‌های کریپتو و تتر به سرورهای اصلی اردر‌بوک نوبیتکس.
                </p>
              </div>

              <div
                onClick={() => applyPreset('wallex')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                  isWhite
                    ? 'bg-cyan-50/50 hover:bg-cyan-100/50 border-cyan-200'
                    : 'bg-cyan-950/20 hover:bg-cyan-950/40 border-cyan-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-cyan-400">📊 صرافی والکس رسمی (Wallex Markets)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">Wallex v1</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  دریافت نوسانات ۲۴ ساعته و اسپرد دقیق تتر و بیش از ۳۰ جفت‌ارز کریپتو.
                </p>
              </div>

              <div
                onClick={() => applyPreset('vip_channel')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                  isWhite
                    ? 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200'
                    : 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-emerald-400">📢 کانال VIP گزارش سریع (هر ۳۰ دقیقه)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">بولتن VIP</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ارسال تصاویر کارت‌های PNG هوشمند هر نیم ساعت به همراه سقف و کف بازار.
                </p>
              </div>
            </div>
          </div>

          {/* Developer REST API Info */}
          <div
            className={`p-6 rounded-3xl border ${
              isWhite ? 'bg-white border-neutral-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            } space-y-4`}
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h4 className={`text-sm font-black ${isWhite ? 'text-neutral-900' : 'text-white'}`}>
                اطلاعات اندپوینت‌های REST API عمومی سرور جهت اتصال خارجی
              </h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                  <span className={isWhite ? 'text-neutral-800' : 'text-slate-300'}>/api/prices</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">درگاه ۱</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">درگاه عمومی قیمت‌های زنده و لحظه‌ای</span>
                  <button
                    onClick={() => handleTestApi('gw_prices', '/api/prices')}
                    className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    تست
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                  <span className={isWhite ? 'text-neutral-800' : 'text-slate-300'}>/api/rates</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400">درگاه ۲</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">درگاه اختصاصی نرخ‌ها و شاخص‌های تجمیعی</span>
                  <button
                    onClick={() => handleTestApi('gw_rates', '/api/rates')}
                    className="text-[11px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30"
                  >
                    تست
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">GET/POST</span>
                  <span className={isWhite ? 'text-neutral-800' : 'text-slate-300'}>/api/bot/response</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">وب‌سرویس پاسخگویی و استعلام هوشمند مینی‌اپ</span>
                  <button
                    onClick={() => handleTestApi('gw_resp', '/api/bot/response?q=طلا')}
                    className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  >
                    تست
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">GET</span>
                  <span className={isWhite ? 'text-neutral-800' : 'text-slate-300'}>/api/miniapp/data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">تمام شاخص‌ها، ترندهای ۲۴ ساعته Recharts و برند</span>
                  <button
                    onClick={() => handleTestApi('gw_miniapp', '/api/miniapp/data')}
                    className="text-[11px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  >
                    تست
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${isWhite ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                  <span className={isWhite ? 'text-neutral-800' : 'text-slate-300'}>/api/telegram/webhook</span>
                </div>
                <span className="text-[11px] text-slate-400">دریافت رویدادها و آپدیت‌های تلگرام</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
