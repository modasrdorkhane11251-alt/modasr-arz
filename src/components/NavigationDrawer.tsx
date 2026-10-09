import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Activity,
  Send,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Bot,
  Database,
  ExternalLink,
  TrendingUp,
  Sliders,
  Sparkles,
  ChevronLeft,
  Layers,
  Download,
  Github,
  Sun,
  Moon,
  Check,
  Zap,
} from 'lucide-react';
import { MiniAppLogo } from './MiniAppLogo';
import { useTheme } from '../context/ThemeContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  botInfo?: any;
  webhookInfo?: any;
  botStatus: boolean;
  onRefresh: () => void;
  onOpenBackup: () => void;
  loading?: boolean;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  botInfo,
  webhookInfo,
  botStatus,
  onRefresh,
  onOpenBackup,
  loading = false,
}) => {
  const { theme, setTheme, isWhite } = useTheme();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  const botUsername = botInfo?.result?.username || 'Modasr_Arzbot';
  const isWebhookSet = !!(webhookInfo?.result?.url && webhookInfo.result.url.length > 0);

  const mainModules = [
    {
      id: 'webhook',
      title: 'اتصال و مدیریت وبهوک',
      description: 'تنظیم وبهوک، شروع Polling و وضعیت سلامت',
      icon: Activity,
      badge: isWebhookSet ? 'وبهوک فعال' : 'Polling',
      badgeColor: isWebhookSet
        ? isWhite
          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : isWhite
          ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-black'
          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'prices',
      title: 'تابلوی زنده قیمت‌ها',
      description: 'استعلام آنی طلا، سکه، ارز فیات و رمزارز',
      icon: TrendingUp,
      badge: 'فید لحظه‌ای',
      badgeColor: isWhite
        ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'miniapp',
      title: 'مینی‌اپ تلگرام (mini MODASR)',
      description: 'پیش‌نمایش زنده مینی‌اپ، ویرایشگر برند و لوگو',
      icon: Smartphone,
      badge: 'MiniApp',
      badgeColor: isWhite
        ? 'bg-purple-100 text-purple-950 border-purple-300 font-black'
        : 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'simulator',
      title: 'شبیه‌ساز پیام و تست ربات',
      description: 'ارسال و تست پاسخ‌های متنی و استعلام قیمت',
      icon: Send,
      badge: 'کنسول تست',
      badgeColor: isWhite
        ? 'bg-blue-100 text-blue-950 border-blue-300 font-black'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'admin',
      title: 'مدیریت و ارسال خودکار کانال',
      description: 'بولتن ساعتی، دکمه‌های شیشه‌ای و تبلیغات',
      icon: ShieldCheck,
      badge: 'امکانات VIP',
      badgeColor: isWhite
        ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'apis',
      title: 'مرکز جامع مدیریت و اتصال APIها',
      description: 'درج و تنظیم APIهای مینی‌اپ، چنل گزارش و تابلو قیمت',
      icon: Zap,
      badge: 'API Hub',
      badgeColor: isWhite
        ? 'bg-cyan-100 text-cyan-950 border-cyan-300 font-black'
        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'logs',
      title: 'لاگ رویدادها و گزارش‌ها',
      description: 'تاریخچه پیام‌ها، استعلام‌ها و خطاهای سیستم',
      icon: Bot,
      badge: 'لاگ زنده',
      badgeColor: isWhite
        ? 'bg-neutral-200 text-black border-neutral-300 font-black'
        : 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-hidden font-['Vazirmatn',sans-serif]" dir="rtl">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Slide-out Drawer Panel with Spring Animation */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`fixed inset-y-0 right-0 w-[88vw] max-w-[390px] ${
              isWhite ? 'bg-white border-l border-neutral-200 text-black' : 'bg-slate-900 border-l border-slate-800 text-slate-100'
            } shadow-2xl flex flex-col h-full h-[100dvh] overflow-hidden text-right z-10 transition-colors duration-200`}
          >
            {/* Drawer Header */}
            <div className={`p-4 border-b ${isWhite ? 'border-neutral-200 bg-white' : 'border-slate-800 bg-slate-950'} flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <MiniAppLogo size={38} className="shadow-md shadow-amber-500/20 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className={`font-extrabold text-sm ${isWhite ? 'text-black' : 'text-white'} truncate`}>
                      منوی دسترسی سریع (کشو)
                    </h2>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 font-mono font-bold shrink-0">
                      MODASR
                    </span>
                  </div>
                  <p className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate mt-0.5`}>
                    فهرست کامل بخش‌ها و ابزارهای ربات
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${isWhite ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'} transition-colors shrink-0`}
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Bot Health Bar */}
            <div className={`px-4 py-2.5 ${isWhite ? 'bg-neutral-50 border-b border-neutral-200' : 'bg-slate-950/80 border-b border-slate-800/80'} flex items-center justify-between text-xs shrink-0`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${botStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className={`font-bold ${isWhite ? 'text-neutral-900' : 'text-slate-200'} text-[11px]`}>
                  {botStatus ? 'ربات فعال و آنلاین' : 'ربات خاموش'}
                </span>
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${isWhite ? 'bg-neutral-200/80 hover:bg-neutral-300 text-cyan-700' : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'} text-[11px] font-bold transition-all disabled:opacity-50`}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>بروزرسانی داده‌ها</span>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {/* Theme Selector (دو حالت: تک سفید با متن‌های سیا و حالت شب) */}
              <div className={`p-3 rounded-2xl border transition-all ${
                isWhite
                  ? 'bg-neutral-50 border-neutral-200 shadow-sm'
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isWhite ? 'text-black' : 'text-slate-200'}`}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>حالت نمایش سامانه (تم):</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isWhite
                      ? 'bg-black text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {isWhite ? 'تک سفید' : 'حالت شب'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: White Mode (تک سفید با متن‌های سیا) */}
                  <button
                    onClick={() => setTheme('white')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                      isWhite
                        ? 'bg-white border-black text-black shadow-md ring-2 ring-black/10'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black">تک سفید ☀️</span>
                      {isWhite && <Check className="w-3.5 h-3.5 text-emerald-600 mr-0.5" />}
                    </div>
                    <span className="text-[9px] font-medium opacity-80">سفید با متن‌های سیاه</span>
                  </button>

                  {/* Option 2: Night Mode (حالت شب) */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                      !isWhite
                        ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-500 text-cyan-300 shadow-md ring-2 ring-cyan-500/20'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Moon className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black">حالت شب 🌙</span>
                      {!isWhite && <Check className="w-3.5 h-3.5 text-cyan-400 mr-0.5" />}
                    </div>
                    <span className="text-[9px] font-medium opacity-80">تیره و جذاب شبانه</span>
                  </button>
                </div>
              </div>

              {/* 1. Main Navigation Modules */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className={`text-[11px] font-bold ${isWhite ? 'text-neutral-700' : 'text-slate-400'} flex items-center gap-1.5`}>
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    <span>بخش‌های اصلی پنل:</span>
                  </span>
                  <span className={`text-[10px] ${isWhite ? 'text-neutral-500' : 'text-slate-500'} font-mono`}>۶ بخش</span>
                </div>

                <div className="space-y-1.5">
                  {mainModules.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2.5 ${
                          isActive
                            ? isWhite
                              ? 'bg-cyan-50 border-cyan-500 shadow-sm'
                              : 'bg-cyan-950/60 border-cyan-500/70 shadow-md shadow-cyan-950/30'
                            : isWhite
                              ? 'bg-neutral-50/80 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isActive
                                ? 'bg-cyan-500/20 text-cyan-600 border-cyan-500/40'
                                : isWhite
                                  ? 'bg-white text-neutral-700 border-neutral-200'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`text-xs font-black truncate block ${
                                isActive
                                  ? isWhite ? 'text-cyan-800 font-extrabold' : 'text-cyan-300'
                                  : isWhite ? 'text-black font-bold' : 'text-slate-100'
                              }`}
                            >
                              {item.title}
                            </span>
                            <p className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate mt-0.5`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                          <ChevronLeft className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600' : isWhite ? 'text-neutral-400' : 'text-slate-600'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Management & Tools */}
              <div className={`space-y-1.5 pt-2 border-t ${isWhite ? 'border-neutral-200' : 'border-slate-800'}`}>
                <span className={`text-[11px] font-bold ${isWhite ? 'text-neutral-700' : 'text-slate-400'} flex items-center gap-1.5 px-1 mb-1`}>
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>ابزارها و اقدامات ویژه:</span>
                </span>

                <div className="space-y-1.5">
                  {/* Quick Refresh Button inside drawer */}
                  <button
                    onClick={() => {
                      onRefresh();
                    }}
                    disabled={loading}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-all ${
                      isWhite
                        ? 'bg-cyan-50/70 border-cyan-200 hover:bg-cyan-100/70 text-cyan-950'
                        : 'bg-cyan-950/40 border-cyan-800/40 hover:border-cyan-700 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isWhite ? 'text-cyan-900' : 'text-cyan-200'} block truncate`}>بروزرسانی زنده داده‌ها و نرخ‌ها</span>
                        <span className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate block`}>واکشی فوری آخرین وضعیت ربات و بازار</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  </button>

                  {/* Fullscreen MiniApp Launch */}
                  <button
                    onClick={() => {
                      setActiveTab('miniapp-fullscreen');
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-all ${
                      isWhite
                        ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
                        : 'bg-gradient-to-r from-amber-500/10 via-slate-950 to-purple-500/10 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isWhite ? 'text-amber-900' : 'text-amber-200'} block truncate`}>مشاهده تمام‌صفحه مینی‌اپ</span>
                        <span className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate block`}>باز کردن رابط کاربری mini MODASR</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </button>

                  {/* Backup & Restore Trigger */}
                  <button
                    onClick={() => {
                      onOpenBackup();
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-all ${
                      isWhite
                        ? 'bg-purple-50/70 border-purple-200 hover:bg-purple-100/70'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isWhite ? 'text-neutral-900' : 'text-slate-200'} block truncate`}>پشتیبان‌گیری و بازیابی اطلاعات</span>
                        <span className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate block`}>دانلود و آپلود فایل JSON تنظیمات</span>
                      </div>
                    </div>
                    <ChevronLeft className={`w-3.5 h-3.5 ${isWhite ? 'text-neutral-500' : 'text-slate-400'} shrink-0`} />
                  </button>

                  {/* User GitHub Repository Link */}
                  <a
                    href="https://github.com/modasrdorkhane11251-alt/modasr-arz"
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-all ${
                      isWhite
                        ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-900 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isWhite
                          ? 'bg-neutral-900 text-white border-neutral-800'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        <Github className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isWhite ? 'text-neutral-950' : 'text-slate-100'} block truncate`}>
                          گیت‌هاب پروژه (GitHub)
                        </span>
                        <span dir="ltr" className={`text-[10px] ${isWhite ? 'text-neutral-600' : 'text-slate-400'} truncate block font-mono text-right`}>
                          modasrdorkhane11251-alt/modasr-arz
                        </span>
                      </div>
                    </div>
                    <ExternalLink className={`w-3.5 h-3.5 ${isWhite ? 'text-neutral-700' : 'text-slate-400'} shrink-0`} />
                  </a>
                </div>
              </div>

              {/* 3. Telegram External Links */}
              <div className={`space-y-1.5 pt-2 border-t ${isWhite ? 'border-neutral-200' : 'border-slate-800'}`}>
                <span className={`text-[11px] font-bold ${isWhite ? 'text-neutral-700' : 'text-slate-400'} flex items-center gap-1.5 px-1 mb-1`}>
                  <Send className="w-3.5 h-3.5 text-cyan-500" />
                  <span>لینک‌های تلگرام:</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isWhite
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-cyan-500'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300'
                    }`}
                  >
                    <span className="font-bold truncate">ربات تلگرام</span>
                    <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${isWhite ? 'text-neutral-500' : 'text-slate-500'}`} />
                  </a>

                  <a
                    href="https://t.me/MODASR_ARZ"
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isWhite
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-purple-500'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-purple-500/40 hover:text-purple-300'
                    }`}
                  >
                    <span className="font-bold truncate">کانال رسمی</span>
                    <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${isWhite ? 'text-neutral-500' : 'text-slate-500'}`} />
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Footer */}
            <div className={`p-3 border-t ${isWhite ? 'border-neutral-200 bg-neutral-50 text-neutral-800' : 'border-slate-800 bg-slate-950 text-slate-400'} text-center shrink-0`}>
              <p className="text-[10px] font-bold">MODASR ARZ • سامانه جامع مدیریت ارز و طلا</p>
              <p className={`text-[9px] ${isWhite ? 'text-neutral-500' : 'text-slate-500'} font-mono mt-0.5`}>@MODASR_ARZ • Version 2.0</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
