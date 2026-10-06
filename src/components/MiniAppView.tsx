import React, { useState, useEffect, useMemo } from 'react';
import { AssetLogo } from './AssetLogo';
import { MiniAppLogo } from './MiniAppLogo';
import {
  Home,
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  RefreshCw,
  ArrowRightLeft,
  X,
  Share2,
  ExternalLink,
  ChevronLeft,
  SlidersHorizontal,
  Flame,
  Coins,
  Crown,
  DollarSign,
  Fuel,
  Check,
  Clock,
  Sparkles,
  Layers,
  ShieldAlert,
  Lock,
  Send,
  Copy,
  QrCode,
  Zap,
  BarChart3,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface MiniAppItem {
  key: string;
  symbol: string;
  name: string;
  persianName: string;
  category: 'crypto' | 'gold' | 'fiat' | 'oil';
  priceToman: number;
  priceUsd?: number;
  dayChange: number;
  highToman: number;
  lowToman: number;
  sparkline: number[];
}

interface MiniAppData {
  highlights: MiniAppItem[];
  crypto: MiniAppItem[];
  gold: MiniAppItem[];
  fiat: MiniAppItem[];
  oil: MiniAppItem[];
  serverTime: string;
}

interface MiniAppViewProps {
  onBackToDashboard?: () => void;
  isStandalone?: boolean;
}

export const MiniAppView: React.FC<MiniAppViewProps> = ({ onBackToDashboard, isStandalone = false }) => {
  const [data, setData] = useState<MiniAppData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'index' | 'markets' | 'converter' | 'watchlist'>('index');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'gold' | 'fiat' | 'oil' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MiniAppItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('modasr_favorites');
      return saved ? JSON.parse(saved) : ['usd', 'usdt', 'gold18', 'seke_emami', 'btc', 'ton'];
    } catch {
      return ['usd', 'usdt', 'gold18', 'seke_emami', 'btc', 'ton'];
    }
  });

  // Converter state
  const [convFromKey, setConvFromKey] = useState<string>('btc');
  const [convAmount, setConvAmount] = useState<string>('1');
  const [convToUnit, setConvToUnit] = useState<'toman' | 'usd'>('toman');

  // Chart Timeframe state for detail modal
  const [chartTimeframe, setChartTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');

  // Canonical Secret Link for mini MODASR arz (100% public, prevents Google 403 Forbidden)
  const secretLink = useMemo(() => {
    if (data && (data as any).brand?.publicMiniAppUrl) {
      return (data as any).brand.publicMiniAppUrl;
    }
    if (typeof window === 'undefined') return 'https://t.me/Modasr_Arzbot';
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-') + '/mini-modasr-arz';
    }
    return `${origin}/mini-modasr-arz`;
  }, [data]);

  // Telegram WebApp SDK initialization
  const tgUser = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0A0E17');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0A0E17');
        return tg.initDataUnsafe?.user || null;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      } catch {}
    }
  };

  const fetchData = async (isManual: boolean = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/miniapp/data');
      if (res.ok) {
        const json = await res.json();
        if (json && json.ok && json.data) {
          setData(json.data);
        }
      }
    } catch {
      // Graceful background retry without noisy error logs
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic();
    setFavorites((prev) => {
      const updated = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem('modasr_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Combine all items into a unified list
  const allItems: MiniAppItem[] = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, MiniAppItem>();
    [...data.highlights, ...data.crypto, ...data.gold, ...data.fiat, ...data.oil].forEach((item) => {
      if (!map.has(item.key)) {
        map.set(item.key, item);
      }
    });
    return Array.from(map.values());
  }, [data]);

  // Filtered Items based on active tab, category and search
  const filteredItems = useMemo(() => {
    let list = allItems;

    if (activeNav === 'watchlist' || selectedCategory === 'favorites') {
      list = list.filter((item) => favorites.includes(item.key));
    } else if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.symbol.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.persianName.includes(q)
      );
    }

    return list;
  }, [allItems, selectedCategory, activeNav, favorites, searchQuery]);

  // Converter Calculations
  const selectedConvItem = useMemo(() => {
    return allItems.find((i) => i.key === convFromKey) || allItems[0] || null;
  }, [allItems, convFromKey]);

  const convResult = useMemo(() => {
    if (!selectedConvItem) return { toman: 0, usd: 0 };
    const num = parseFloat(convAmount) || 0;
    const toman = Math.round(num * selectedConvItem.priceToman);
    const usdRate = selectedConvItem.priceUsd || (selectedConvItem.priceToman / 268300);
    const usd = parseFloat((num * usdRate).toFixed(2));
    return { toman, usd };
  }, [selectedConvItem, convAmount]);

  // Formatter helpers
  const fmtNum = (num?: number) => (num !== undefined ? Math.round(num).toLocaleString('en-US') : '0');
  const fmtUsd = (num?: number) => {
    if (num === undefined) return '0.00';
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(2);
    return num.toFixed(4);
  };

  // Coin & Asset Logo Renderer
  const renderCoinIcon = (symbol: string, category: string, size: number = 36) => {
    return <AssetLogo symbol={symbol} category={category} size={size} />;
  };

  // Sparkline mini SVG curve
  const renderSparklineSvg = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(' L ')}`;
    const strokeColor = isPositive ? '#10B981' : '#F43F5E';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Key Benchmark Items for Index Dashboard
  const usdtItem = useMemo(() => {
    return allItems.find((i) => i.key === 'usdt' || i.symbol === 'USDT' || i.key === 'usd') || allItems[0] || null;
  }, [allItems]);

  const gold18Item = useMemo(() => {
    return allItems.find((i) => i.key === 'gold18' || i.symbol === 'GOLD18') || null;
  }, [allItems]);

  const coinItem = useMemo(() => {
    return allItems.find((i) => i.key === 'seke_emami' || i.symbol === 'SEKE_EMAMI') || null;
  }, [allItems]);

  const btcItem = useMemo(() => {
    return allItems.find((i) => i.key === 'btc' || i.symbol === 'BTC') || null;
  }, [allItems]);

  const ethItem = useMemo(() => {
    return allItems.find((i) => i.key === 'eth' || i.symbol === 'ETH') || null;
  }, [allItems]);

  const oilItem = useMemo(() => {
    return allItems.find((i) => i.key === 'oil_brent' || i.symbol === 'OIL_BRENT') || null;
  }, [allItems]);

  const goldOunceItem = useMemo(() => {
    return allItems.find((i) => i.key === 'gold_ounce' || i.symbol === 'GOLD_OUNCE') || null;
  }, [allItems]);

  // Top Movers for Index View
  const topMovers = useMemo(() => {
    if (!allItems.length) return [];
    return [...allItems].sort((a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange)).slice(0, 5);
  }, [allItems]);

  // Share to Telegram
  const handleShare = (item: MiniAppItem) => {
    triggerHaptic();
    const shareText = `📊 نرخ لحظه‌ای ${item.persianName} (${item.symbol}):\n▫️ ${fmtNum(item.priceToman)} تومان\n${item.priceUsd ? `💵 $${fmtUsd(item.priceUsd)} dollar\n` : ''}${item.dayChange >= 0 ? '🟢' : '🔴'} ${item.dayChange >= 0 ? '+' : ''}${item.dayChange}%\n\n📱 مینی‌اپ mini MODASR arz:\n${secretLink}\n\n🤖 ربات: @Modasr_Arzbot\n📢 کانال: @MODASR_ARZ`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(secretLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-['Vazirmatn',sans-serif] pb-24 select-none relative max-w-md mx-auto shadow-2xl overflow-x-hidden border-x border-slate-900/60">
      
      {/* 1. TOP HEADER & IDENTITY */}
      <header className="sticky top-0 z-30 bg-[#070B14]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <MiniAppLogo logoUrl={(data as any)?.brand?.miniAppLogoUrl} size={40} className="border-amber-500/50 shadow-md shadow-amber-500/20" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#070B14] animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#070B14]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white tracking-tight">
                  {(data as any)?.brand?.title || 'mini MODASR arz'}
                </h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  ⚡ شاخص زنده
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{(data as any)?.brand?.subtitle || 'فید زنده بایننس و TGJU'}</span>
                {tgUser && <span className="text-cyan-400 font-bold">• {tgUser.first_name}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic();
                fetchData(true);
              }}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all flex items-center gap-1"
              title="به‌روزرسانی قیمت‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {!isStandalone && onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white active:scale-95 transition-all flex items-center gap-1"
                title="بازگشت به پنل مدیریت"
              >
                <span>پنل وب</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا نماد ارز (بیت کوین، طلا، تتر، USD...)"
            className="w-full pr-10 pl-9 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* 2. TAB: INDEX (شاخص کل و پیشخوان خفن mini MODASR arz) */}
      {activeNav === 'index' && !searchQuery && (
        <div className="px-3.5 pt-3 space-y-4 animate-fadeIn">
          
          {/* Hero Cyber Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>شاخص لحظه‌ای بازارهای مالی</span>
                </div>
                <h2 className="text-base font-black text-white tracking-tight">
                  پیشخوان هوشمند {(data as any)?.brand?.title || 'mini MODASR arz'}
                </h2>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
                  {(data as any)?.brand?.subtitle || 'اتصال آنی به API بایننس، نوبیتکس و صرافی‌های ارزی تهران با نرخ تضمینی زنده'}
                </p>
              </div>

              <div className="flex-shrink-0">
                <MiniAppLogo
                  logoUrl={(data as any)?.brand?.miniAppLogoUrl}
                  size={52}
                  className="shadow-xl shadow-cyan-500/30 border-amber-500/40"
                />
              </div>
            </div>

            {/* Status Live Feed Indicator inside Index Hero */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300 font-medium text-[11px]">اتصال پایدار • استعلام زنده و بدون تاخیر قیمت‌ها</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                <span>100% Live Sync</span>
              </div>
            </div>
          </div>

          {/* 4 Major Market Index Cards */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>۴ شاخص کلیدی بازار امروز</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Real-time Feed</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Index 1: USDT / USD */}
              {usdtItem && (
                <div
                  onClick={() => {
                    triggerHaptic();
                    setSelectedItem(usdtItem);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/40 cursor-pointer active:scale-95 transition-all shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {renderCoinIcon('USDT', 'crypto', 24)}
                      <span className="text-[11px] font-bold text-slate-200">تتر / دلار</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      usdtItem.dayChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {usdtItem.dayChange >= 0 ? '+' : ''}{usdtItem.dayChange}%
                    </span>
                  </div>
                  <div className="text-sm font-black text-white font-mono tracking-tight mt-1">
                    {fmtNum(usdtItem.priceToman)} <span className="text-[9px] font-sans text-slate-400 font-normal">تومان</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>نرخ حواله آزاد</span>
                    <span className="text-cyan-400 font-mono">1.00 USD</span>
                  </div>
                </div>
              )}

              {/* Index 2: 18K Gold */}
              {gold18Item && (
                <div
                  onClick={() => {
                    triggerHaptic();
                    setSelectedItem(gold18Item);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer active:scale-95 transition-all shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {renderCoinIcon('GOLD18', 'gold', 24)}
                      <span className="text-[11px] font-bold text-amber-300">طلای ۱۸ عیار</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      gold18Item.dayChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {gold18Item.dayChange >= 0 ? '+' : ''}{gold18Item.dayChange}%
                    </span>
                  </div>
                  <div className="text-sm font-black text-white font-mono tracking-tight mt-1">
                    {fmtNum(gold18Item.priceToman)} <span className="text-[9px] font-sans text-slate-400 font-normal">تومان</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>هر گرم خام</span>
                    <span className="text-amber-400 font-mono">750/1000</span>
                  </div>
                </div>
              )}

              {/* Index 3: Emami Coin */}
              {coinItem && (
                <div
                  onClick={() => {
                    triggerHaptic();
                    setSelectedItem(coinItem);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-yellow-500/40 cursor-pointer active:scale-95 transition-all shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {renderCoinIcon('SEKE_EMAMI', 'gold', 24)}
                      <span className="text-[11px] font-bold text-slate-200">سکه امامی</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      coinItem.dayChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {coinItem.dayChange >= 0 ? '+' : ''}{coinItem.dayChange}%
                    </span>
                  </div>
                  <div className="text-sm font-black text-white font-mono tracking-tight mt-1">
                    {fmtNum(coinItem.priceToman)} <span className="text-[9px] font-sans text-slate-400 font-normal">تومان</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>طرح جدید</span>
                    <span className="text-emerald-400 font-mono">تهران</span>
                  </div>
                </div>
              )}

              {/* Index 4: Bitcoin BTC */}
              {btcItem && (
                <div
                  onClick={() => {
                    triggerHaptic();
                    setSelectedItem(btcItem);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-yellow-500/40 cursor-pointer active:scale-95 transition-all shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {renderCoinIcon('BTC', 'crypto', 24)}
                      <span className="text-[11px] font-bold text-slate-200">بیت‌کوین (BTC)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      btcItem.dayChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {btcItem.dayChange >= 0 ? '+' : ''}{btcItem.dayChange}%
                    </span>
                  </div>
                  <div className="text-sm font-black text-white font-mono tracking-tight mt-1">
                    ${fmtUsd(btcItem.priceUsd)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>معادل بازار:</span>
                    <span className="text-cyan-400 font-mono">{fmtNum(btcItem.priceToman)} ت</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Global Commodities & Energy Strip */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                <span>کامودیتی‌های جهانی و انرژی</span>
              </span>
              <span className="text-[10px] text-slate-500">Global Spot Market</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {oilItem && (
                <div
                  onClick={() => setSelectedItem(oilItem)}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 cursor-pointer hover:border-cyan-500/30 transition-all"
                >
                  <div className="text-[10px] text-slate-400">نفت برنت</div>
                  <div className="text-xs font-black text-white font-mono mt-0.5">${fmtUsd(oilItem.priceUsd)}</div>
                  <div className={`text-[9px] font-mono mt-0.5 ${oilItem.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {oilItem.dayChange >= 0 ? '+' : ''}{oilItem.dayChange}%
                  </div>
                </div>
              )}

              {goldOunceItem && (
                <div
                  onClick={() => setSelectedItem(goldOunceItem)}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 cursor-pointer hover:border-amber-500/30 transition-all"
                >
                  <div className="text-[10px] text-slate-400">انس جهانی طلا</div>
                  <div className="text-xs font-black text-amber-300 font-mono mt-0.5">${fmtUsd(goldOunceItem.priceUsd)}</div>
                  <div className={`text-[9px] font-mono mt-0.5 ${goldOunceItem.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {goldOunceItem.dayChange >= 0 ? '+' : ''}{goldOunceItem.dayChange}%
                  </div>
                </div>
              )}

              {ethItem && (
                <div
                  onClick={() => setSelectedItem(ethItem)}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/60 cursor-pointer hover:border-indigo-500/30 transition-all"
                >
                  <div className="text-[10px] text-slate-400">اتریوم (ETH)</div>
                  <div className="text-xs font-black text-indigo-300 font-mono mt-0.5">${fmtUsd(ethItem.priceUsd)}</div>
                  <div className={`text-[9px] font-mono mt-0.5 ${ethItem.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ethItem.dayChange >= 0 ? '+' : ''}{ethItem.dayChange}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Volatile / Movers Section */}
          {topMovers.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>پرنوسان‌ترین دارایی‌های امروز</span>
                </span>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setActiveNav('markets');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  مشاهده همه بازار ↗
                </button>
              </div>

              <div className="space-y-2">
                {topMovers.slice(0, 3).map((item) => {
                  const isPositive = item.dayChange >= 0;
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        triggerHaptic();
                        setSelectedItem(item);
                      }}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/30 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        {renderCoinIcon(item.key || item.symbol, item.category, 32)}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">{item.persianName}</span>
                            <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-800/80">
                              {item.symbol}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.priceUsd ? `$${fmtUsd(item.priceUsd)}` : 'نرخ داخلی'}
                          </div>
                        </div>
                      </div>

                      <div className="text-left flex flex-col items-end">
                        <div className="text-xs font-black text-white font-mono tracking-tight">
                          {fmtNum(item.priceToman)} <span className="text-[9px] font-sans text-slate-400">تومان</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold mt-0.5 px-1.5 py-0.2 rounded-md ${
                          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {isPositive ? '+' : ''}{item.dayChange}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Navigation Tiles */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => {
                triggerHaptic();
                setActiveNav('converter');
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/40 text-right active:scale-95 transition-all shadow-md group"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">ماشین‌حساب ارزها</div>
              <div className="text-[10px] text-slate-400 mt-0.5">تبدیل آنی کریپتو، طلا و دلار به تومان</div>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setActiveNav('markets');
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/40 text-right active:scale-95 transition-all shadow-md group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">تابلوی کامل قیمت‌ها</div>
              <div className="text-[10px] text-slate-400 mt-0.5">۵۰+ نماد طلا، سکه، رمزارز و فیات</div>
            </button>
          </div>

          {/* Official Channel & Telegram Bot Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0E1621] to-slate-950 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MiniAppLogo logoUrl={(data as any)?.brand?.miniAppLogoUrl} size={40} className="shadow-md shadow-cyan-600/20" />
                <div>
                  <h3 className="text-xs font-bold text-white">کانال رسمی @MODASR_ARZ</h3>
                  <p className="text-[10px] text-slate-400">تحلیل‌ها، گزارش‌های لحظه‌ای و اخبار بازار</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://t.me/MODASR_ARZ"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>عضویت در کانال</span>
              </a>

              <a
                href="https://t.me/Modasr_Arzbot?start=start"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
              >
                <span>ربات تلگرام</span>
              </a>
            </div>
          </div>

        </div>
      )}

      {/* 2. MAIN MARKETS TAB */}
      {activeNav === 'markets' && (
        <div className="px-3 pt-3 space-y-4">
          
          {/* Top Ticker Highlights (Swipeable Cards) */}
          {data?.highlights && data.highlights.length > 0 && !searchQuery && (
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>شاخص‌های اصلی بازار</span>
                </span>
                <span className="text-[10px] text-slate-500">نرخ رسمی تهران & کریپتو</span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
                {data.highlights.map((item) => {
                  const isPositive = item.dayChange >= 0;
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        triggerHaptic();
                        setSelectedItem(item);
                      }}
                      className="min-w-[136px] flex-shrink-0 snap-start rounded-2xl p-3 bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer active:scale-95 transition-all shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {renderCoinIcon(item.key || item.symbol, item.category, 28)}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {isPositive ? '+' : ''}{item.dayChange}%
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-300 truncate">{item.persianName}</div>
                      <div className="text-xs font-black text-white mt-1 font-mono tracking-tight">
                        {fmtNum(item.priceToman)} <span className="text-[9px] font-sans text-slate-400">تومان</span>
                      </div>
                      {item.priceUsd !== undefined && item.category !== 'fiat' && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ${fmtUsd(item.priceUsd)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {[
              { id: 'all', label: '🔥 همه', icon: Flame },
              { id: 'crypto', label: '🪙 رمزارزها', icon: Coins },
              { id: 'gold', label: '👑 طلا و سکه', icon: Crown },
              { id: 'fiat', label: '💵 ارزهای فیات', icon: DollarSign },
              { id: 'oil', label: '🛢️ نفت و گاز', icon: Fuel },
              { id: 'favorites', label: '⭐ نشان‌شده‌ها', icon: Star },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedCategory(cat.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Asset List Rows */}
          <div className="space-y-2">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400">در حال دریافت داده‌های زنده بازار...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                موردی یافت نشد.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isPositive = item.dayChange >= 0;
                const isFav = favorites.includes(item.key);

                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      triggerHaptic();
                      setSelectedItem(item);
                    }}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/30 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                  >
                    {/* Left Icon & Names */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderCoinIcon(item.key || item.symbol, item.category, 36)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">{item.persianName}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold px-1 rounded bg-slate-800/80">
                            {item.symbol}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.priceUsd ? `$${fmtUsd(item.priceUsd)}` : item.name}
                        </div>
                      </div>
                    </div>

                    {/* Middle Sparkline */}
                    <div className="hidden sm:block">
                      {renderSparklineSvg(item.sparkline, isPositive)}
                    </div>

                    {/* Right Prices & Change */}
                    <div className="text-left flex items-center gap-2.5">
                      <div className="flex flex-col items-end">
                        <div className="text-xs font-black text-white font-mono tracking-tight">
                          {fmtNum(item.priceToman)} <span className="text-[9px] font-sans text-slate-400">تومان</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold mt-0.5 px-1.5 py-0.2 rounded-md ${
                          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {isPositive ? '+' : ''}{item.dayChange}%
                        </span>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(item.key, e)}
                        className={`p-1.5 rounded-lg active:scale-90 transition-all ${
                          isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. CONVERTER TAB (مبدل زنده ارزها) */}
      {activeNav === 'converter' && (
        <div className="px-4 pt-4 space-y-5 animate-fadeIn">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-black text-white">ماشین‌حساب و مبدل نرخ ارزها</h2>
            <p className="text-[11px] text-slate-400">تبدیل لحظه‌ای هر رمزارز، طلا، سکه یا دلار به تومان و بالعکس</p>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            {/* From Asset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">انتخاب ارز مبدا:</label>
              <select
                value={convFromKey}
                onChange={(e) => {
                  triggerHaptic();
                  setConvFromKey(e.target.value);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:border-cyan-500 focus:outline-none"
              >
                {allItems.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.persianName} ({i.symbol}) - {fmtNum(i.priceToman)} تومان
                  </option>
                ))}
              </select>
            </div>

            {/* Input Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">مقدار برای محاسبه:</label>
                <div className="flex items-center gap-1">
                  {['0.5', '1', '5', '10', '100'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        triggerHaptic();
                        setConvAmount(chip);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-cyan-400 font-mono hover:bg-slate-700 active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                value={convAmount}
                onChange={(e) => setConvAmount(e.target.value)}
                placeholder="1"
                step="any"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-lg font-mono font-bold text-white focus:border-cyan-500 focus:outline-none text-left"
              />
            </div>

            {/* Equal Divider */}
            <div className="flex items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Calculation Result */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-center">
              <span className="text-[11px] text-slate-400 block">ارزش معادل در بازار ایران:</span>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {fmtNum(convResult.toman)} <span className="text-xs text-white font-sans">تومان</span>
              </div>
              <div className="text-xs font-mono text-cyan-300">
                ≈ ${fmtUsd(convResult.usd)} USD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WATCHLIST TAB */}
      {activeNav === 'watchlist' && (
        <div className="px-4 pt-4 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span>فهرست نشان‌شده‌ها (علاقه‌مندی‌های شما)</span>
            </h2>
            <span className="text-[10px] text-slate-400">{favorites.length} ارز ذخیره شده</span>
          </div>

          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Star className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">هنوز ارزی را ستاره‌دار نکرده‌اید.</p>
                <p className="text-[11px] text-slate-500">برای پین کردن ارزها، در صفحه قیمت‌ها روی ستاره کنار هر ارز بزنید.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isPositive = item.dayChange >= 0;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      triggerHaptic();
                      setSelectedItem(item);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      {renderCoinIcon(item.key || item.symbol, item.category, 36)}
                      <div>
                        <div className="font-bold text-xs text-white">{item.persianName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.symbol}</div>
                      </div>
                    </div>
                    <div className="text-left flex items-center gap-3">
                      <div>
                        <div className="text-xs font-black text-white font-mono">
                          {fmtNum(item.priceToman)} <span className="text-[9px] font-sans text-slate-400">تومان</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? '+' : ''}{item.dayChange}%
                        </span>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(item.key, e)}
                        className="text-amber-400 p-1 active:scale-90"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE DETAIL BOTTOM SHEET MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-0 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0C121E] border-t border-slate-700/80 rounded-t-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {renderCoinIcon(selectedItem.key || selectedItem.symbol, selectedItem.category, 42)}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white">{selectedItem.persianName}</h3>
                    <span className="text-xs font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                      {selectedItem.symbol}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{selectedItem.name}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">نرخ لحظه‌ای به تومان:</span>
                <div className="text-xl font-black text-white font-mono mt-0.5 tracking-tight">
                  {fmtNum(selectedItem.priceToman)} <span className="text-xs font-sans text-slate-400">تومان</span>
                </div>
                {selectedItem.priceUsd && (
                  <div className="text-xs font-mono text-cyan-300 mt-0.5">
                    ≈ ${fmtUsd(selectedItem.priceUsd)} USD
                  </div>
                )}
              </div>

              <div className="text-left">
                <span className={`text-xs font-black px-2 py-1 rounded-xl flex items-center gap-1 font-mono ${
                  selectedItem.dayChange >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedItem.dayChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{selectedItem.dayChange >= 0 ? '+' : ''}{selectedItem.dayChange}%</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">تغییرات ۲۴ ساعته</span>
              </div>
            </div>

            {/* 24h High & Low Range Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-900">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>کمترین: <b className="text-white font-mono">{fmtNum(selectedItem.lowToman)}</b></span>
                <span>بیشترین: <b className="text-white font-mono">{fmtNum(selectedItem.highToman)}</b></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full w-full"></div>
              </div>
            </div>

            {/* Timeframe Selector & Interactive Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">نمودار نوسان قیمت:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                  {(['24h', '7d', '30d', '1y'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        triggerHaptic();
                        setChartTimeframe(tf);
                      }}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        chartTimeframe === tf ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Chart Box */}
              <div className="rounded-2xl p-4 bg-slate-950/90 border border-slate-800 flex items-center justify-center">
                <img
                  src={`/api/bot/card-preview?symbol=${encodeURIComponent(selectedItem.symbol)}&t=${Date.now()}`}
                  alt="Chart Preview"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleShare(selectedItem)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>اشتراک در تلگرام</span>
              </button>

              <button
                onClick={() => toggleFavorite(selectedItem.key)}
                className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-cyan-600/20 transition-all"
              >
                <Star className={`w-4 h-4 ${favorites.includes(selectedItem.key) ? 'fill-current text-amber-300' : ''}`} />
                <span>{favorites.includes(selectedItem.key) ? 'حذف از نشان‌شده‌ها' : 'افزودن به نشان‌شده‌ها'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM FLOATING NAVIGATION BAR (TELEGRAM MINI-APP STYLE) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0A0E17]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2">
        <div className="flex items-center justify-around">
          
          {/* Tab 1: Index / Home */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveNav('index');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              activeNav === 'index' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">شاخص</span>
          </button>

          {/* Tab 2: Markets */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveNav('markets');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              activeNav === 'markets' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold">بازارها</span>
          </button>

          {/* Tab 3: Converter */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveNav('converter');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              activeNav === 'converter' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-[10px] font-bold">مبدل ارز</span>
          </button>

          {/* Tab 4: Watchlist */}
          <button
            onClick={() => {
              triggerHaptic();
              setActiveNav('watchlist');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              activeNav === 'watchlist' ? 'text-amber-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Star className={`w-5 h-5 ${activeNav === 'watchlist' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">نشان‌شده‌ها</span>
          </button>

          {/* Tab 5: Channel */}
          <a
            href="https://t.me/MODASR_ARZ"
            target="_blank"
            rel="noreferrer"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-500 hover:text-cyan-400 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="text-[10px] font-bold">کانال</span>
          </a>

        </div>
      </nav>

    </div>
  );
};
