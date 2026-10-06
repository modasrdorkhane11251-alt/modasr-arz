import React, { useState } from 'react';
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
} from 'lucide-react';

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
  const [customUrl, setCustomUrl] = useState<string>('');
  const [dropPending, setDropPending] = useState<boolean>(true);
  const [settingWebhook, setSettingWebhook] = useState<boolean>(false);
  const [deletingWebhook, setDeletingWebhook] = useState<boolean>(false);
  const [pollingLoading, setPollingLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
          message: '⚡ سرویس اتصال مستقیم (Long Polling) فعال شد. اکنون ربات با حداکثر سرعت و بدون نیاز به وب‌هوک به پیام‌های تلگرام پاسخ می‌دهد!',
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
                    ? '⚡ اتصال مستقیم تلگرام فعال است (پاسخ‌دهی آنی لحظه‌ای)'
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
                  ? 'سرور به صورت پیوسته پیام‌های ارسالی کاربران در تلگرام را دریافت و فوراً پردازش و پاسخ ارسال می‌کند.'
                  : isWebhookActive
                  ? `وبهوک فعال روی: ${currentUrl}`
                  : 'برای پاسخ‌دهی خودکار دکمه "فعال‌سازی اتصال مستقیم" را بزنید.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
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
            <span>آخرین پیام خطای وبهوک تلگرام: {lastError}</span>
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
              <span>رفع تداخل و راه‌اندازی مجدد</span>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Controls */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Method 1: Direct Real-Time Polling (Recommended) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-sm text-white">اتصال مستقیم تلگرام (Long Polling - روش پیشنهادی)</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                پایدار و سریع
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              این روش پیام‌های جدید را مستقیماً از سرورهای تلگرام خوانده و فوراً قیمت طلا، بیت‌کوین و محاسبات را به کاربر پاسخ می‌دهد؛ نیازی به باز بودن پورت خارجی یا دامنه HTTPS عمومی ندارد.
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
                    : 'شروع اتصال مستقیم لحظه‌ای (Start Polling)'}
                </span>
              </button>
            </div>
          </div>

          {/* Method 2: Webhook Mode */}
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
                صرف‌نظر از پیام‌های قدیمی در صف (Drop Pending Updates)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleSetWebhook}
                disabled={settingWebhook}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Link2 className={`w-4 h-4 ${settingWebhook ? 'animate-spin' : ''}`} />
                <span>{settingWebhook ? 'در حال ثبت...' : 'ست کردن وب‌هوک (Set Webhook)'}</span>
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

          {/* Token Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-sm text-white">توکن رسمی و یکتای ربات تلگرام</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                تک توکن رسمی (@Modasr_Arzbot)
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={activeToken}
                onChange={(e) => setActiveToken(e.target.value)}
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>توکن فعال در سرور: <code className="text-cyan-300 font-mono">{activeToken ? `${activeToken.substring(0, 10)}...` : 'تنظیم نشده (وارد شده در فایل .env)'}</code></span>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Bot Details */}
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-sm text-white">مشخصات ربات در تلگرام</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">نام ربات:</span>
                <span className="font-semibold text-slate-100">{statusData?.botInfo?.result?.first_name || 'ربات تلگرام'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">یوزرنیم:</span>
                <span className="font-mono text-cyan-400 dir-ltr">{statusData?.botInfo?.result?.username ? `@${statusData.botInfo.result.username}` : '@Bot'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">شناسه عددی (Bot ID):</span>
                <span className="font-mono text-slate-200">{statusData?.botInfo?.result?.id || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">شناسه مالک (Admin ID):</span>
                <span className="font-mono text-amber-400">{statusData?.currentConfig?.adminId || 'تعریف نشده'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">وضعیت اتصال:</span>
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
