import React, { useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { MiniAppView } from './MiniAppView';

interface MiniAppPreviewPanelProps {
  onOpenFullscreen: () => void;
  statusData?: any;
}

export const MiniAppPreviewPanel: React.FC<MiniAppPreviewPanelProps> = ({ onOpenFullscreen, statusData }) => {
  const [copied, setCopied] = useState(false);

  // Compute public-safe mini app URL (never expose ais-dev which triggers Google 403 Forbidden)
  const miniAppUrl = React.useMemo(() => {
    if (statusData?.publicMiniAppUrl) {
      return statusData.publicMiniAppUrl;
    }
    if (typeof window === 'undefined') return 'https://t.me/Modasr_Arzbot';
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-') + '/mini-modasr-arz';
    }
    return `${origin}/mini-modasr-arz`;
  }, [statusData]);

  const tgBotLink = `https://t.me/Modasr_Arzbot`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(miniAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 border border-cyan-400/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">مینی‌اپ اختصاصی mini MODASR arz</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  ⚡ شاخص زنده و لینک مخفی فعال
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                مینی‌اپ فوق‌پیشرفته <b className="text-cyan-300 font-mono">mini MODASR arz</b> با تابلوی شاخص‌های کلان بازار، اتصال بدون واسطه به API بایننس و TGJU، چارت‌های تعاملی و ماشین‌حساب مبدل ارز همراه با دسترسی مستقیم و لینک مخفی.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenFullscreen}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>مشاهده تمام‌صفحه مینی‌اپ</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'لینک مخفی کپی شد!' : 'کپی لینک مخفی mini MODASR arz'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Mobile Simulator Frame + BotFather Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Mobile Mockup */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
              <span>پیش‌نمایش زنده در قاب گوشی تلفن همراه</span>
            </span>
          </div>

          {/* Smartphone Frame (iPhone 16 Pro Style) */}
          <div className="w-[380px] h-[780px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-[6px] border-slate-800 relative overflow-hidden ring-1 ring-slate-700/50">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-4 border border-slate-800"></div>
              <div className="w-2 h-2 rounded-full bg-slate-900"></div>
            </div>

            {/* Inner Screen View */}
            <div className="w-full h-full rounded-[38px] overflow-hidden bg-[#070B14] relative">
              <MiniAppView isStandalone={true} />
            </div>
          </div>
        </div>

        {/* Right Column: Telegram BotFather Setup & Features */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Box 1: How to set up in BotFather */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">نحوه اتصال مینی‌اپ به دکمه منوی ربات (BotFather)</h3>
                <p className="text-[11px] text-slate-400">تا دکمه مینی‌اپ مثل ربات CoinPJ همیشه پایین چت ربات نمایش داده شود</p>
              </div>
            </div>

            <ol className="text-xs text-slate-300 space-y-2.5 leading-relaxed pr-4 list-decimal marker:text-cyan-400 marker:font-bold">
              <li>
                در تلگرام وارد بات رسمی <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 font-bold underline">@BotFather</a> شوید.
              </li>
              <li>
                دستور <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono">/setmenubutton</code> را ارسال کنید.
              </li>
              <li>
                ربات خود یعنی <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono">@Modasr_Arzbot</code> را انتخاب نمایید.
              </li>
              <li>
                لینک مینی‌اپ زیر را برای بات‌فادر بفرستید:
                <div className="mt-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 flex items-center justify-between select-all">
                  <span className="truncate">{miniAppUrl}</span>
                  <button onClick={handleCopyLink} className="p-1 hover:text-white text-slate-400">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
              <li>
                عنوان دکمه را مثلاً <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-bold">📱 mini MODASR arz</code> یا <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-bold">💎 شاخص قیمت‌ها</code> وارد کنید.
              </li>
              <li>
                تمام! اکنون هر کاربری وارد بات شما شود، دکمه مینی‌اپ را پایین صفحه می‌بیند و با یک ضربه مینی‌اپ باز می‌شود.
              </li>
            </ol>
          </div>

          {/* Box 2: 403 Forbidden Explanation & Public Links */}
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-300">راهنمای رفع خطای ۴۰۳ گوگل (Error 403 Forbidden):</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  علت ارور در عکس ارسالی: آدرس‌های <code className="font-mono text-amber-300">ais-dev</code> به اکانت جیمیل توسعه‌دهنده قفل هستند.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <p>
                ۱. اگر در کروم گوشی خود وارد جیمیل توسعه‌دهنده (<code className="font-mono text-cyan-300">modasrdorkhane11251@gmail.com</code>) شوید، لینک بلافاصله باز می‌شود.
              </p>
              <p>
                ۲. برای دسترسی عمومی دیگران و بدون نیاز به ورود به گوگل، از آدرس عمومی اشتراک‌گذاری استفاده کنید:
              </p>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 flex items-center justify-between select-all">
                <span className="truncate">https://ais-pre-zskvaylyhohvurwbbahz3f-866989204783.europe-west2.run.app/mini-modasr-arz</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://ais-pre-zskvaylyhohvurwbbahz3f-866989204783.europe-west2.run.app/mini-modasr-arz');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="p-1 hover:text-white text-slate-400"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Box 3: Key Features Checklist */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>امکانات و ویژگی‌های پیاده‌سازی شده در این مینی‌اپ:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>طراحی دارک لاکچری (CoinPJ Style)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>نرخ زنده بایننس و TGJU با خطای ۰٪</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>ماشین‌حساب مبدل ارز به تومان</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>اسپارک‌لاین و نمودار نوسان ۷ روزه</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>لیست علاقه‌مندی‌ها و نشان‌شده‌ها</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>اشتراک مستقیم در چت‌های تلگرام</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
