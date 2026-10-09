import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  Layers,
  Palette,
  Eye,
  Sliders,
  Zap,
} from 'lucide-react';
import { MiniAppView } from './MiniAppView';
import { MiniAppLogo } from './MiniAppLogo';

interface MiniAppPreviewPanelProps {
  onOpenFullscreen: () => void;
  statusData?: any;
  onOpenApiHub?: () => void;
}

export const MiniAppPreviewPanel: React.FC<MiniAppPreviewPanelProps> = ({ onOpenFullscreen, statusData, onOpenApiHub }) => {
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Logo & Identity Customizer State
  const [logoUrl, setLogoUrl] = useState('');
  const [title, setTitle] = useState('mini MODASR arz');
  const [subtitle, setSubtitle] = useState('پیشخوان هوشمند طلا، ارز و کریپتو');
  const [savingBrand, setSavingBrand] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch current adConfig / logo configuration
  const fetchCurrentConfig = async () => {
    try {
      const res = await fetch('/api/bot/ad-config');
      if (res.ok) {
        const json = await res.json();
        if (json.adConfig) {
          setLogoUrl(json.adConfig.miniAppLogoUrl || '');
          if (json.adConfig.miniAppTitle) setTitle(json.adConfig.miniAppTitle);
          if (json.adConfig.miniAppSubtitle) setSubtitle(json.adConfig.miniAppSubtitle);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(miniAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle local image file upload with automatic high-res canvas scaling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 384;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
          setLogoUrl(optimizedDataUrl);
          setFeedback({
            type: 'success',
            message: 'تصویر انتخاب و بهینه‌سازی شد! برای اعمال در مینی‌اپ روی «ذخیره تغییرات لوگو» کلیک کنید.',
          });
        } else {
          setLogoUrl(rawData);
        }
      };
      img.onerror = () => {
        setLogoUrl(rawData);
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'خطا در خواندن فایل تصویر' });
    };
    reader.readAsDataURL(file);
  };

  // Save changes to backend
  const handleSaveBrand = async () => {
    try {
      setSavingBrand(true);
      setFeedback(null);
      const res = await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miniAppLogoUrl: logoUrl.trim(),
          miniAppTitle: title.trim() || 'mini MODASR arz',
          miniAppSubtitle: subtitle.trim() || 'پیشخوان هوشمند طلا، ارز و کریپتو',
        }),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: '✅ لوگو و مشخصات مینی‌اپ با موفقیت ذخیره شد و در تمامی پلتفرم‌ها به‌روزرسانی گشت.',
        });
        setReloadKey((prev) => prev + 1);
      } else {
        setFeedback({ type: 'error', message: 'خطا در ذخیره‌سازی لوگو' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'خطای شبکه' });
    } finally {
      setSavingBrand(false);
    }
  };

  // Reset to default luxury brand SVG logo
  const handleResetToDefault = () => {
    setLogoUrl('');
    setTitle('mini MODASR arz');
    setSubtitle('پیشخوان هوشمند طلا، ارز و کریپتو');
    setFeedback({
      type: 'success',
      message: 'لوگوی پیش‌فرض ۳بعدی طلایی انتخاب شد. برای اعمال روی «ذخیره تغییرات» بزنید.',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <MiniAppLogo logoUrl={logoUrl} size={48} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">مینی‌اپ اختصاصی {title}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  ⚡ شاخص زنده و لینک مخفی فعال
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                مینی‌اپ فوق‌پیشرفته <b className="text-cyan-300 font-mono">{title}</b> با تابلوی شاخص‌های کلان بازار، اتصال بدون واسطه به API بایننس و TGJU، چارت‌های تعاملی و ماشین‌حساب مبدل ارز همراه با دسترسی مستقیم و لینک مخفی.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenApiHub && (
              <button
                onClick={onOpenApiHub}
                className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-purple-500/10"
                title="پیکربندی Endpointها و APIهای مینی‌اپ"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span>تنظیمات API مینی‌اپ</span>
              </button>
            )}

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

      {/* Main Grid: Mobile Simulator Frame + Logo Customizer & BotFather Setup */}
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
              <MiniAppView key={reloadKey} isStandalone={true} />
            </div>
          </div>
        </div>

        {/* Right Column: Logo Customizer & Telegram BotFather Setup */}
        <div className="lg:col-span-6 space-y-6">

          {/* LOGO & IDENTITY EDITOR STUDIO */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>تنظیم و ویرایش لوگوی مینی‌اپ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      ⚡ شخصی‌سازی آنی
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">لوگو و هویت بصری مینی‌اپ را به آسانی تغییر دهید یا تصویر دلخواه بارگذاری کنید</p>
                </div>
              </div>

              <MiniAppLogo logoUrl={logoUrl} size={50} className="shadow-lg shadow-amber-500/20" />
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Logo Options Selector */}
            <div className="space-y-4">
              
              {/* Option A: Upload Local Image File */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>آپلود تصویر جدید از دستگاه (PNG, JPG, WebP, SVG)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">حداکثر ۲ مگابایت</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="miniapp-logo-file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="miniapp-logo-file"
                    className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>انتخاب فایل تصویر...</span>
                  </label>
                  {logoUrl && logoUrl.startsWith('data:') && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>تصویر با موفقیت بارگذاری شد</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Option B: Direct Image URL */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>یا وارد کردن آدرس اینترنتی مستقیم تصویر (Image URL):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl('')}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      title="پاک کردن"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Subtitle Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">عنوان مینی‌اپ:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="mini MODASR arz"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">توضیح زیر عنوان:</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="پیشخوان هوشمند طلا، ارز و کریپتو"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action Buttons: Save & Reset */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleResetToDefault}
                  type="button"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی به لوگوی ۳بعدی اصلی</span>
                </button>

                <button
                  onClick={handleSaveBrand}
                  disabled={savingBrand}
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  {savingBrand ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingBrand ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات لوگو'}</span>
                </button>
              </div>

            </div>
          </div>
          
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

        </div>

      </div>

    </div>
  );
};
