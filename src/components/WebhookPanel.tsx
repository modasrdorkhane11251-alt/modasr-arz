import React, { useState, useEffect } from 'react';
import {
  Link2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Copy,
  Check,
  Shield,
  Key,
  Globe,
  Radio,
  Server,
  Terminal,
  Zap,
  Pause,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Gauge,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface LatencyTestResult {
  latencyMs: number;
  status: 'connected' | 'error';
  httpStatus?: number;
  testedAt: string;
  serverTimestamp?: number;
  uptime?: number;
  errorMessage?: string;
}

interface WebhookPanelProps {
  statusData: any;
  onRefresh: () => void;
  onSetWebhook: (url: string, dropPending: boolean, token?: string) => Promise<any>;
  onDeleteWebhook: (dropPending: boolean, token?: string) => Promise<any>;
  onStartPolling: (token?: string, force?: boolean) => Promise<any>;
  onStopPolling: () => Promise<any>;
  activeToken: string;
  setActiveToken: (token: string) => void;
}

export const WebhookPanel: React.FC<WebhookPanelProps> = ({
  statusData,
  onRefresh,
  onSetWebhook,
  onDeleteWebhook,
  onStartPolling,
  onStopPolling,
  activeToken,
  setActiveToken,
}) => {
  const { isWhite } = useTheme();
  const [customUrl, setCustomUrl] = useState<string>('');
  const [dropPending, setDropPending] = useState<boolean>(true);
  const [settingWebhook, setSettingWebhook] = useState<boolean>(false);
  const [deletingWebhook, setDeletingWebhook] = useState<boolean>(false);
  const [pollingLoading, setPollingLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Latency test state
  const [isTestingLatency, setIsTestingLatency] = useState<boolean>(false);
  const [latencyResult, setLatencyResult] = useState<LatencyTestResult | null>(null);

  // ============================================================================
  // NEW: Credentials form state (bot token + admin ID)
  // ============================================================================
  const [credToken, setCredToken] = useState<string>('');
  const [credAdminId, setCredAdminId] = useState<string>('');
  const [credMasked, setCredMasked] = useState<string>('');
  const [credHasToken, setCredHasToken] = useState<boolean>(false);
  const [savingCred, setSavingCred] = useState<boolean>(false);
  const [credFeedback, setCredFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCredStatus = async () => {
    try {
      const r = await fetch('/api/config/credentials/status');
      if (r.ok) {
        const d = await r.json();
        setCredMasked(d.maskedToken || '');
        setCredHasToken(!!d.hasToken);
        setCredAdminId(d.adminId || '');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCredStatus();
  }, []);

  const handleSaveCredentials = async () => {
    setSavingCred(true);
    setCredFeedback(null);
    try {
      const payload: any = {};
      if (credToken.trim()) payload.botToken = credToken.trim();
      if (credAdminId.trim()) payload.adminId = credAdminId.trim();

      if (Object.keys(payload).length === 0) {
        setCredFeedback({ type: 'error', text: 'هیچ مقداری وارد نشده' });
        setSavingCred(false);
        return;
      }

      const r = await fetch('/api/config/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.ok) {
        setCredFeedback({ type: 'success', text: '✅ ذخیره شد. سرور در ۱ ثانیه ری‌استارت می‌شود...' });
        setCredToken('');
        // Reload page after restart
        setTimeout(() => {
          fetchCredStatus();
          onRefresh();
        }, 5000);
      } else {
        setCredFeedback({ type: 'error', text: `❌ ${d.message || 'خطا در ذخیره'}` });
      }
    } catch (e: any) {
      setCredFeedback({ type: 'error', text: `خطا: ${e.message}` });
    } finally {
      setSavingCred(false);
    }
  };

  // ============================================================================
  // Latency test
  // ============================================================================

  const testServerLatency = async () => {
    setIsTestingLatency(true);
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`/api/ping?_t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        setLatencyResult({
          latencyMs: duration,
          status: 'connected',
          httpStatus: response.status,
          testedAt: new Date().toLocaleTimeString('fa-IR'),
          serverTimestamp: data.timestamp,
          uptime: data.uptime,
        });
      } else {
        setLatencyResult({
          latencyMs: duration,
          status: 'error',
          httpStatus: response.status,
          testedAt: new Date().toLocaleTimeString('fa-IR'),
          errorMessage: `پاسخ ناموفق سرور: HTTP ${response.status} ${response.statusText || ''}`,
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);
      const isTimeout = err.name === 'AbortError';
      setLatencyResult({
        latencyMs: duration,
        status: 'error',
        testedAt: new Date().toLocaleTimeString('fa-IR'),
        errorMessage: isTimeout ? 'تایم‌اوت پاسخ سرور (۶ ثانیه)' : (err.message || 'خطا در برقراری ارتباط با سرور'),
      });
    } finally {
      setIsTestingLatency(false);
    }
  };

  useEffect(() => {
    testServerLatency();
  }, []);

  const defaultWebhookUrl = statusData?.defaultWebhookUrl || '';
  const webhookResult = statusData?.webhookInfo?.result;
  const currentUrl = webhookResult?.url || '';
  const isWebhookActive = !!(currentUrl && currentUrl.length > 0);
  const isPollingActive = statusData?.pollingStatus?.isRunning ?? false;
  const pollingLastError = statusData?.pollingStatus?.lastError || null;
  const pendingCount = webhookResult?.pending_update_count ?? 0;
  const lastError = webhookResult?.last_error_message;
  const lastErrorDate = webhookResult?.last_error_date
    ? new Date(webhookResult.last_error_date * 1000).toLocaleString('fa-IR')
    : null;

  const targetUrl = customUrl.trim() || defaultWebhookUrl;

  const handleStartPolling = async (force: boolean = false) => {
    try {
      setPollingLoading(true);
      setFeedback(null);
      const res = await onStartPolling(activeToken, force);
      if (res?.ok) {
        setFeedback({
          type: 'success',
          message: '⚡ سرویس اتصال مستقیم (Long Polling) فعال شد. اکنون ربات با حداکثر سرعت پاسخ می‌دهد!',
        });
        onRefresh();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'خطا در فعال‌سازی Polling' });
    } finally {
      setPollingLoading(false);
    }
  };

  const handleStopPolling = async () => {
    try {
      setPollingLoading(true);
      await onStopPolling();
      setFeedback({ type: 'success', message: 'سرویس Polling متوقف شد.' });
      onRefresh();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'خطا در توقف Polling' });
    } finally {
      setPollingLoading(false);
    }
  };

  const handleSetWebhook = async () => {
    try {
      setSettingWebhook(true);
      setFeedback(null);
      const res = await onSetWebhook(targetUrl, dropPending, activeToken);
      if (res?.ok) {
        setFeedback({
          type: 'success',
          message: `✅ وبهوک با موفقیت روی آدرس زیر ثبت شد:\n${targetUrl}`,
        });
        onRefresh();
      } else {
        setFeedback({
          type: 'error',
          message: `❌ خطا در ثبت وبهوک: ${res?.description || res?.error || 'ناشناخته'}`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'خطا در برقراری ارتباط' });
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm('آیا از حذف وبهوک تلگرام مطمئن هستید؟')) return;
    try {
      setDeletingWebhook(true);
      setFeedback(null);
      const res = await onDeleteWebhook(dropPending, activeToken);
      if (res?.ok) {
        setFeedback({ type: 'success', message: '✅ وبهوک با موفقیت از سرور تلگرام حذف شد.' });
        onRefresh();
      } else {
        setFeedback({
          type: 'error',
          message: `❌ خطا در حذف وبهوک: ${res?.description || res?.error || 'ناشناخته'}`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'خطا در ارتباط' });
    } finally {
      setDeletingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Active Mode Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isPollingActive
            ? 'bg-cyan-950/25 border-cyan-500/40 text-cyan-300'
            : isWebhookActive
            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                isPollingActive
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : isWebhookActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isPollingActive ? (
                <Zap className="w-6 h-6 animate-pulse" />
              ) : isWebhookActive ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {isPollingActive
                    ? '⚡ اتصال مستقیم تلگرام فعال است'
                    : isWebhookActive
                    ? '🟢 اتصال وب‌هوک فعال است'
                    : '🟡 ربات در انتظار اتصال'}
                </h3>
                {isPollingActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    ACTIVE POLLING
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {isPollingActive
                  ? 'سرور به صورت پیوسته پیام‌ها را دریافت و پردازش می‌کند.'
                  : isWebhookActive
                  ? `وبهوک فعال روی: ${currentUrl}`
                  : 'برای پاسخ‌دهی خودکار دکمه "فعال‌سازی اتصال مستقیم" را بزنید.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={testServerLatency}
              disabled={isTestingLatency}
              title="تست تاخیر سرور"
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                latencyResult?.status === 'connected'
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 shadow-sm'
                  : latencyResult?.status === 'error'
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 shadow-sm'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isTestingLatency ? 'animate-spin' : ''}`} />
              <span className="font-mono">
                {isTestingLatency ? 'در حال پینگ...' : latencyResult ? `${latencyResult.latencyMs} ms` : 'تست تاخیر'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  latencyResult?.status === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : latencyResult?.status === 'error'
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'bg-slate-400'
                }`}
              />
            </button>

            {isPollingActive ? (
              <button
                onClick={handleStopPolling}
                disabled={pollingLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>توقف Polling</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartPolling(false)}
                disabled={pollingLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>فعال‌سازی اتصال مستقیم</span>
              </button>
            )}
          </div>
        </div>

        {lastError && !isPollingActive && (
          <div className="mt-3 pt-3 border-t border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>آخرین خطای وبهوک: {lastError}</span>
          </div>
        )}

        {pollingLastError && !isPollingActive && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{pollingLastError}</span>
            </div>
            <button
              onClick={() => handleStartPolling(true)}
              disabled={pollingLoading}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${pollingLoading ? 'animate-spin' : ''}`} />
              <span>راه‌اندازی مجدد</span>
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs whitespace-pre-wrap ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* ===================================================================== */}
      {/* NEW: Bot Credentials Configuration Card                              */}
      {/* ===================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-sm text-white">توکن رسمی و آیدی ادمین</h2>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              credHasToken
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {credHasToken ? '🟢 توکن ست شده' : '🔴 توکن ندارد'}
          </span>
        </div>

        {credFeedback && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              credFeedback.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            {credFeedback.text}
          </div>
        )}

        <div className="space-y-3">
          {credMasked && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500">توکن فعلی: </span>
              <span className="text-cyan-300">{credMasked}</span>
            </div>
          )}

          {/* Bot Token input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              توکن جدید ربات (از @BotFather):
            </label>
            <input
              type="text"
              value={credToken}
              onChange={(e) => setCredToken(e.target.value)}
              placeholder="123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              اگه می‌خوای توکن فعلی بمونه، این فیلد رو خالی بذار.
            </p>
          </div>

          {/* Admin ID input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              آیدی عددی ادمین (از @userinfobot):
            </label>
            <input
              type="text"
              value={credAdminId}
              onChange={(e) => setCredAdminId(e.target.value)}
              placeholder="123456789"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              فقط عدد، بدون @ یا فاصله
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveCredentials}
            disabled={savingCred || (!credToken.trim() && !credAdminId.trim())}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40"
          >
            {savingCred ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>💾 ذخیره و ری‌استارت ربات</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            ⚠️ توکن به‌صورت امن در <code className="text-cyan-400">.env</code> سرور ذخیره می‌شود.
            هیچ‌وقت به مرورگر برنمی‌گردد.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Controls */}
        <div className="lg:col-span-2 space-y-5">

          {/* Method 1: Polling */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-sm text-white">اتصال مستقیم (Long Polling)</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                پایدار
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              این روش پیام‌ها را مستقیماً از سرورهای تلگرام خوانده و فوراً پاسخ می‌دهد؛ نیازی به دامنه HTTPS عمومی ندارد.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={isPollingActive ? handleStopPolling : () => handleStartPolling(false)}
                disabled={pollingLoading}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  isPollingActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-600/20'
                }`}
              >
                {isPollingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>
                  {pollingLoading
                    ? 'در حال تغییر وضعیت...'
                    : isPollingActive
                    ? 'توقف اتصال مستقیم'
                    : 'شروع اتصال مستقیم (Start Polling)'}
                </span>
              </button>
            </div>
          </div>

          {/* Method 2: Webhook */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-sm text-white">تنظیم آدرس وب‌هوک (Webhook URL)</h2>
              </div>
              <span className="text-xs text-slate-400">Endpoint: /api/telegram/webhook</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 flex items-center justify-between">
                <span>آدرس سرور برای دریافت آپدیت‌ها:</span>
                <span className="text-[11px] text-cyan-400 font-mono">HTTPS</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={customUrl || defaultWebhookUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/telegram/webhook"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(customUrl || defaultWebhookUrl)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="کپی آدرس"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="dropPending2"
                type="checkbox"
                checked={dropPending}
                onChange={(e) => setDropPending(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="dropPending2" className="text-xs text-slate-300 cursor-pointer select-none">
                صرف‌نظر از پیام‌های قدیمی در صف
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleSetWebhook}
                disabled={settingWebhook}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Link2 className={`w-4 h-4 ${settingWebhook ? 'animate-spin' : ''}`} />
                <span>{settingWebhook ? 'در حال ثبت...' : 'ست کردن وب‌هوک'}</span>
              </button>

              <button
                onClick={handleDeleteWebhook}
                disabled={deletingWebhook || !isWebhookActive}
                className="py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف وب‌هوک</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Latency & Bot Details */}
        <div className="space-y-5">

          {/* Latency Card */}
          <div
            className={`border rounded-2xl p-5 shadow-xl transition-all space-y-4 ${
              isWhite ? 'bg-white border-neutral-200 text-black' : 'bg-slate-900/90 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-sm">تست وضعیت اتصال سرور</h2>
              </div>

              <div className="flex items-center gap-2">
                {isTestingLatency ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>در حال تست...</span>
                  </span>
                ) : latencyResult ? (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-3 w-3">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          latencyResult.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${
                          latencyResult.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        latencyResult.status === 'connected'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {latencyResult.status === 'connected' ? '🟢 متصل' : '🔴 خطا'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">نامشخص</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={testServerLatency}
              disabled={isTestingLatency}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 ${
                latencyResult?.status === 'error'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-600/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-600/20'
              }`}
            >
              <Activity className={`w-4 h-4 ${isTestingLatency ? 'animate-spin' : ''}`} />
              <span>{isTestingLatency ? 'در حال سنجش...' : 'تست در لحظه اتصال سرور'}</span>
            </button>

            {latencyResult && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  latencyResult.status === 'connected'
                    ? isWhite
                      ? 'bg-emerald-50/80 border-emerald-200 text-neutral-800'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : isWhite
                    ? 'bg-rose-50/80 border-rose-200 text-neutral-800'
                    : 'bg-rose-950/25 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <Gauge className={`w-4 h-4 ${latencyResult.status === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="text-xs font-semibold">تاخیر:</span>
                  </div>
                  <span className={`font-mono text-base font-extrabold ${latencyResult.status === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {latencyResult.latencyMs} ms
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>وضعیت:</span>
                    <span className="font-bold">
                      {latencyResult.status === 'connected' ? '🟢 سالم' : '🔴 خطا'}
                    </span>
                  </div>

                  {latencyResult.httpStatus && (
                    <div className="flex justify-between">
                      <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>HTTP:</span>
                      <span className="font-mono font-bold text-emerald-400">{latencyResult.httpStatus} OK</span>
                    </div>
                  )}

                  {latencyResult.uptime !== undefined && (
                    <div className="flex justify-between">
                      <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>آپ‌تایم:</span>
                      <span className="font-mono">
                        {Math.floor(latencyResult.uptime / 60)} دقیقه و {latencyResult.uptime % 60} ثانیه
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>زمان تست:</span>
                    <span className="font-mono">{latencyResult.testedAt}</span>
                  </div>

                  {latencyResult.errorMessage && (
                    <div className="pt-1.5 text-rose-300 text-[11px] border-t border-rose-500/20">
                      ⚠️ {latencyResult.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bot Details Card */}
          <div className={`border rounded-2xl p-5 shadow-xl space-y-4 ${
            isWhite ? 'bg-white border-neutral-200 text-black' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex items-center gap-2 border-b border-inherit pb-3">
              <Server className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-sm">مشخصات ربات در تلگرام</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`flex justify-between py-1.5 border-b ${isWhite ? 'border-neutral-100' : 'border-slate-800/60'}`}>
                <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>نام ربات:</span>
                <span className="font-semibold">{statusData?.botInfo?.result?.first_name || 'ربات تلگرام'}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isWhite ? 'border-neutral-100' : 'border-slate-800/60'}`}>
                <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>یوزرنیم:</span>
                <span className="font-mono text-cyan-400 dir-ltr">{statusData?.botInfo?.result?.username ? `@${statusData.botInfo.result.username}` : '@Bot'}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isWhite ? 'border-neutral-100' : 'border-slate-800/60'}`}>
                <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>شناسه عددی:</span>
                <span className="font-mono">{statusData?.botInfo?.result?.id || '—'}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isWhite ? 'border-neutral-100' : 'border-slate-800/60'}`}>
                <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>شناسه مالک:</span>
                <span className="font-mono text-amber-400">{statusData?.currentConfig?.adminId || 'تعریف نشده'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className={isWhite ? 'text-neutral-500' : 'text-slate-400'}>وضعیت:</span>
                <span className="text-emerald-400 font-semibold">
                  {isPollingActive ? '⚡ لحظه‌ای (Polling)' : isWebhookActive ? '🟢 وب‌هوک' : 'در انتظار'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
