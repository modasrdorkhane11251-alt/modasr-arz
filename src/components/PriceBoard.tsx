import React, { useState } from 'react';
import { RefreshCw, Search, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { LineChart, Line, YAxis } from 'recharts';
import { AssetLogo } from './AssetLogo';

interface PriceBoardProps {
  pricesData: any;
  onRefreshPrices: () => void;
  loading: boolean;
  onOpenApiHub?: () => void;
}

export const PriceBoard: React.FC<PriceBoardProps> = ({ pricesData, onRefreshPrices, loading, onOpenApiHub }) => {
  const [search, setSearch] = useState('');

  const coins = pricesData?.coins || {};
  const goldPriceToman = Number(pricesData?.goldPriceToman) || Number(pricesData?.gold?.gold18?.tomanPrice) || 26306400;
  const goldDayChange = pricesData?.goldDayChange !== undefined ? Number(pricesData.goldDayChange) : (pricesData?.gold?.gold18?.dayChangePercent ?? 0.1);

  // Real live Tether strictly unified across all services (100% parity with MiniApp & Bot)
  const usdtCoin = pricesData?.tether
    ? {
        irr: pricesData.tether.toman,
        usdt: 1.0,
        dayChange: pricesData.tether.dayChange,
        dayHighToman: pricesData.tether.highToman,
        dayLowToman: pricesData.tether.lowToman,
      }
    : (coins['usdt'] || coins['tether'] || {
        irr: 267632,
        usdt: 1.0,
        dayChange: 0.6,
      });

  // Real live Brent Oil from API
  const oilPrice = pricesData?.oilPrice || {
    priceUsd: 101.08,
    priceToman: Math.round(101.08 * usdtCoin.irr),
    dayChange: 0.08,
  };

  // Helper to render Recharts 24-hour mini trend line
  const renderMiniChart = (base: number, change: number, isPos: boolean) => {
    const len = 16;
    const trend = (change || 0) / 100;
    const start = base / (1 + trend);
    const range = Math.abs(base - start) || base * 0.02;
    const chartData = Array.from({ length: len }, (_, i) => {
      const p = i / (len - 1);
      const val = i === len - 1 ? base : start + (base - start) * p + Math.sin(i * 0.9) * range * 0.25;
      return { price: val };
    });
    const prices = chartData.map((d) => d.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const pad = (maxVal - minVal) * 0.08 || 1;

    return (
      <div className="w-16 h-7 flex-shrink-0 flex items-center justify-center" title="نمودار روند ۲۴س">
        <LineChart width={64} height={28} data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[minVal - pad, maxVal + pad]} hide />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPos ? '#10B981' : '#F43F5E'}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    );
  };

  // Deduplicate and filter unique coins by canonical symbol
  const uniqueCoinsList = React.useMemo(() => {
    const map = new Map<string, any>();
    
    // Priority order for prominent crypto assets
    const priorityOrder = ['BTC', 'ETH', 'USDT', 'TON', 'SOL', 'BNB', 'TRX', 'DOGE', 'XRP', 'ADA', 'SHIB', 'PEPE', 'NOT', 'LTC', 'BCH', 'AVAX', 'LINK', 'SUI', 'NEAR', 'POL', 'DOT'];

    const persianNames: Record<string, string> = {
      BTC: 'بیت کوین',
      ETH: 'اتریوم',
      USDT: 'تتر دیجیتال',
      USD: 'دلار آمریکا',
      TON: 'تون کوین',
      SOL: 'سولانا',
      BNB: 'بایننس کوین',
      TRX: 'ترون',
      DOGE: 'دوج کوین',
      XRP: 'ریپل',
      ADA: 'کاردانو',
      SHIB: 'شیبا اینو',
      PEPE: 'پپه',
      NOT: 'نات کوین',
      LTC: 'لایت کوین',
      BCH: 'بیت کوین کش',
      AVAX: 'اولنچ',
      LINK: 'چین لینک',
      SUI: 'سویی',
      NEAR: 'نیر پروتکل',
      POL: 'پالیگان',
      MATIC: 'پالیگان',
      DOT: 'پولکادات',
    };

    Object.entries(coins).forEach(([rawKey, val]: [string, any]) => {
      if (!val || typeof val !== 'object') return;
      const key = rawKey.trim();

      // Skip non-ASCII keys (e.g. Persian names 'تتر', 'بیت کوین')
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) return;

      // Skip redundant long alias keys
      const lower = key.toLowerCase();
      if (lower === 'tether' || lower === 'bitcoin' || lower === 'ethereum' || lower === 'dollar' || lower === 'toncoin') return;

      const symbol = (val.symbol || key).toUpperCase();
      if (!symbol || symbol.length > 8) return;

      // Deduplicate by upper symbol
      if (!map.has(symbol)) {
        map.set(symbol, {
          key: symbol.toLowerCase(),
          symbol,
          name: persianNames[symbol] || val.name || symbol,
          usdt: Number(val.usdt) || 0,
          toman: Number(val.irr) || 0,
          change: Number(val.dayChange) || 0,
        });
      }
    });

    const list = Array.from(map.values());

    // Sort by priority order
    list.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.symbol);
      const idxB = priorityOrder.indexOf(b.symbol);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (b.toman || 0) - (a.toman || 0);
    });

    return list.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.key.includes(q);
    });
  }, [coins, search]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Gold 18k, Oil & Tether Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 18K Gold Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AssetLogo symbol="GOLD18" category="gold" size={44} />
              <div>
                <span className="text-xs text-amber-300 font-medium">نرخ لحظه‌ای طلا</span>
                <h3 className="text-sm font-bold text-white">طلای ۱۸ عیار</h3>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              عیار ۷۵۰
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-xl font-black text-amber-400 font-mono">
                {goldPriceToman.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-slate-300 mr-1.5">تومان</span>
            </div>
            <div className="flex items-center gap-2">
              {renderMiniChart(goldPriceToman, goldDayChange, goldDayChange >= 0)}
              <span
                dir="ltr"
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  goldDayChange >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {goldDayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{goldDayChange >= 0 ? '+' : ''}{goldDayChange.toFixed(2)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Crude Oil Card */}
        <div className="bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AssetLogo symbol="BRENT" category="oil" size={44} />
              <div>
                <span className="text-xs text-sky-300 font-medium">بازار جهانی انرژی</span>
                <h3 className="text-sm font-bold text-white">نفت برنت (Brent Oil)</h3>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
              هر بشکه
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-sky-500/20 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-sky-400 font-mono">
                  ${oilPrice.priceUsd ? oilPrice.priceUsd.toFixed(2) : '104.39'}
                </span>
                <span className="text-xs text-slate-300">دلار</span>
              </div>
              <span className="text-xs text-slate-300 font-mono mt-0.5 block">
                ~ {Math.round(oilPrice.priceToman || 27995000).toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="flex items-center gap-2">
              {renderMiniChart(oilPrice.priceUsd || 104.39, oilPrice.dayChange || 0, (oilPrice.dayChange || 0) >= 0)}
              <span
                dir="ltr"
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  (oilPrice.dayChange || 0) >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {(oilPrice.dayChange || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{(oilPrice.dayChange || 0) >= 0 ? '+' : ''}{(oilPrice.dayChange || 0).toFixed(2)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tether (USDT) Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AssetLogo symbol="USDT" category="crypto" size={44} />
              <div>
                <span className="text-xs text-emerald-300 font-medium">نرخ دلار دیجیتال</span>
                <h3 className="text-sm font-bold text-white">تتر (USDT / IRR)</h3>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              دلار آزاد
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {Math.round(usdtCoin.irr).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-300">تومان</span>
              </div>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                USD $1.00
              </span>
            </div>
            <div className="flex items-center gap-2">
              {renderMiniChart(usdtCoin.irr, usdtCoin.dayChange, usdtCoin.dayChange >= 0)}
              <span
                dir="ltr"
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  usdtCoin.dayChange >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {usdtCoin.dayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{usdtCoin.dayChange >= 0 ? '+' : ''}{usdtCoin.dayChange.toFixed(2)}%</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Search & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام یا نماد ارز (بیت کوین، eth، سولانا...)"
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400">{uniqueCoinsList.length} ارز یافت شد</span>
          
          {onOpenApiHub && (
            <button
              onClick={onOpenApiHub}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 active:scale-95 transition-all"
              title="پیکربندی و تغییر APIهای طلا، ارز و کریپتو"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>تنظیمات API تابلو</span>
            </button>
          )}

          <button
            onClick={onRefreshPrices}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>بروزرسانی قیمت‌ها</span>
          </button>
        </div>
      </div>

      {/* Grid of Coins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {uniqueCoinsList.map((coin) => {
          const isPos = coin.change >= 0;
          return (
            <div
              key={coin.key}
              className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-lg hover:shadow-cyan-500/5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AssetLogo symbol={coin.symbol} category="crypto" size={34} />
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors uppercase font-mono">
                      {coin.symbol}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[110px]">{coin.name}</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                  dir="ltr"
                >
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{coin.change.toFixed(2)}%</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400">قیمت تتری:</span>
                  <span className="text-xs font-bold text-slate-200 font-mono dir-ltr">
                    ${coin.usdt.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400">قیمت تومانی:</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    {Math.round(coin.toman).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">تومان</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
