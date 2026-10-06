import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Terminal,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  ArrowDownLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { ActivityLog } from '../bot/types';

interface ActivityLogsPanelProps {
  logs: ActivityLog[];
  onRefresh: () => void;
  loading: boolean;
}

export const ActivityLogsPanel: React.FC<ActivityLogsPanelProps> = ({ logs, onRefresh, loading }) => {
  const [filter, setFilter] = useState<'all' | 'outgoing_msg' | 'incoming_msg' | 'errors' | 'system' | 'callback'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    let errorCount = 0;
    let outgoingCount = 0;
    let incomingCount = 0;
    let systemCount = 0;
    let callbackCount = 0;

    for (const log of logs) {
      if (log.status === 'error' || log.status === 'warning') errorCount++;
      if (log.type === 'outgoing_msg') outgoingCount++;
      if (log.type === 'incoming_msg') incomingCount++;
      if (log.type === 'system') systemCount++;
      if (log.type === 'callback') callbackCount++;
    }

    return {
      total: logs.length,
      errorCount,
      outgoingCount,
      incomingCount,
      systemCount,
      callbackCount,
    };
  }, [logs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Category Filter
      if (filter === 'errors') {
        if (log.status !== 'error' && log.status !== 'warning') return false;
      } else if (filter !== 'all') {
        if (log.type !== filter) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const textMatch = (log.text || '').toLowerCase().includes(q);
        const respMatch = (log.response || '').toLowerCase().includes(q);
        const userMatch = String(log.userId || '').includes(q);
        const chatMatch = String(log.chatId || '').includes(q);
        const usernameMatch = (log.username || '').toLowerCase().includes(q);
        return textMatch || respMatch || userMatch || chatMatch || usernameMatch;
      }

      return true;
    });
  }, [logs, filter, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = async () => {
    try {
      setClearing(true);
      const res = await fetch('/api/bot/logs/clear', { method: 'POST' });
      if (res.ok) {
        onRefresh();
        setConfirmClear(false);
      }
    } catch (e) {
      console.error('Failed to clear logs:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">لاگ و رویدادهای زنده ربات (Live Activity Logs)</h3>
              {stats.errorCount > 0 ? (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold animate-pulse">
                  {stats.errorCount} خطا
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  بدون خطا
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              ثبت تمام تعاملات لحظه‌ای، استعلام قیمت‌ها، پاسخ‌های ارسالی و خطاهای ربات تلگرام
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {confirmClear ? (
            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-600/50 p-1 rounded-xl">
              <span className="text-[11px] text-rose-300 font-bold px-2">مطمئنید؟</span>
              <button
                onClick={handleClearLogs}
                disabled={clearing}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all"
              >
                {clearing ? '...' : 'بله، پاک کن'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px]"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="پاکسازی تمام لاگ‌ها"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی لاگ‌ها</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            title="بروزرسانی لاگ‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">کل رویدادها</span>
          <span className="font-bold text-white font-mono">{stats.total}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Send className="w-3 h-3 text-cyan-400" />
            <span>پاسخ‌ها</span>
          </span>
          <span className="font-bold text-cyan-400 font-mono">{stats.outgoingCount}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-blue-400" />
            <span>ورودی</span>
          </span>
          <span className="font-bold text-blue-400 font-mono">{stats.incomingCount}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">سیستم</span>
          <span className="font-bold text-slate-300 font-mono">{stats.systemCount}</span>
        </div>
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
          stats.errorCount > 0 ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-slate-950 border-slate-800/80 text-emerald-400'
        }`}>
          <span className="text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>خطاها</span>
          </span>
          <span className="font-bold font-mono">{stats.errorCount}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        
        {/* Category Pills */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'all' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همه ({stats.total})
          </button>

          <button
            onClick={() => setFilter('outgoing_msg')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'outgoing_msg' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            پاسخ‌های ربات ({stats.outgoingCount})
          </button>

          <button
            onClick={() => setFilter('incoming_msg')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'incoming_msg' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            پیام‌های دریافتی ({stats.incomingCount})
          </button>

          <button
            onClick={() => setFilter('errors')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'errors'
                ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                : stats.errorCount > 0
                ? 'text-rose-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>خطاها ({stats.errorCount})</span>
            {stats.errorCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
          </button>

          <button
            onClick={() => setFilter('system')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'system' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            سیستم ({stats.systemCount})
          </button>

          <button
            onClick={() => setFilter('callback')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'callback' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            دکمه‌ها ({stats.callbackCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در متن، آیدی یا پاسخ..."
            className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
          <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
          <span>هیچ لاگی با فیلتر انتخابی یافت نشد.</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails = !!log.response || !!log.chatId || !!log.userId;
            const isError = log.status === 'error';
            const isWarning = log.status === 'warning';

            return (
              <div
                key={log.id}
                className={`rounded-xl border transition-all text-xs font-mono overflow-hidden ${
                  isError
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Main Log Summary Row */}
                <div
                  onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                  className={`p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                    hasDetails ? 'cursor-pointer select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {log.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {log.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {log.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {log.status === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}

                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        log.type === 'outgoing_msg' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        log.type === 'incoming_msg' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        log.type === 'callback' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {log.type === 'outgoing_msg' ? 'پاسخ ربات' :
                         log.type === 'incoming_msg' ? 'پیام ورودی' :
                         log.type === 'callback' ? 'دکمه' : 'سیستم'}
                      </span>

                      <span className="text-slate-100 font-semibold truncate max-w-sm">
                        {log.text || 'رویداد'}
                      </span>

                      {log.username && (
                        <span className="text-cyan-400/80 text-[10px] dir-ltr font-sans">
                          @{log.username}
                        </span>
                      )}

                      {log.userId && (
                        <span className="text-slate-500 text-[10px]">
                          (ID: {log.userId})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[10px] text-slate-400">
                      {log.timestamp}
                    </span>

                    {hasDetails && (
                      <span className="text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 space-y-2 text-[11px] leading-relaxed">
                    <div className="flex flex-wrap items-center gap-3 text-slate-400 border-b border-slate-800/60 pb-2">
                      {log.chatId && <span>چت آیدی: <code className="text-cyan-300 font-mono">{log.chatId}</code></span>}
                      {log.userId && <span>کاربر: <code className="text-cyan-300 font-mono">{log.userId}</code></span>}
                      <span>شناسه لاگ: <code className="text-slate-400 font-mono">{log.id}</code></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(log.response || log.text || '', log.id);
                        }}
                        className="mr-auto px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px]"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === log.id ? 'کپی شد' : 'کپی متن'}</span>
                      </button>
                    </div>

                    {log.response && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">متن پاسخ کامل ربات / خروجی ارسالی:</span>
                        <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200 text-[10px] font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                          {log.response}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
