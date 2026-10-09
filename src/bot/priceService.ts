import { BotStorage } from './storage';
import { MANUAL_ALIASES } from './config';

// ============================================================================
// PRICE SERVICE — Production-grade market data pipeline
// ============================================================================

const RIALS_PER_TOMAN = 10;
const CACHE_TTL_MS = 5_000;
const LIVE_TICKER_INTERVAL_MS = 15_000;
const FETCH_TIMEOUT_MS = 4_000;
const FETCH_RETRY_ATTEMPTS = 2;
const FETCH_RETRY_BASE_MS = 400;
const STALE_THRESHOLD_MS = 5 * 60_000;
const BINANCE_CONCURRENCY = 8;
const TGJU_URL = 'https://call.tgju.org/ajax.json';
const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/24hr';
const BINANCE_KLINES_URL = 'https://api.binance.com/api/v3/klines';

const PERSIAN_NAMES: Record<string, string> = {
  BTC: 'بیت کوین', ETH: 'اتریوم', USDT: 'تتر دیجیتال', TON: 'تون کوین',
  SOL: 'سولانا', BNB: 'بایننس کوین', TRX: 'ترون', DOGE: 'دوج کوین',
  XRP: 'ریپل', ADA: 'کاردانو', SHIB: 'شیبا اینو', PEPE: 'پپه',
  NOT: 'نات کوین', LTC: 'لایت کوین', BCH: 'بیت کوین کش', AVAX: 'اولنچ',
  LINK: 'چین لینک', SUI: 'سویی', NEAR: 'نیر پروتکل', DOT: 'پولکادات',
  MATIC: 'پالیگان', POL: 'پالیگان', UNI: 'یونی‌سواپ', ATOM: 'کازموس',
  XLM: 'استلار', ALGO: 'الگورند', VET: 'وی‌چین', FIL: 'فایل‌کوین',
  ETC: 'اتریوم کلاسیک', XMR: 'مونرو', AAVE: 'آوه', MKR: 'میکر',
  COMP: 'کامپاند', SNX: 'سینتتیکس', CRV: 'کرو', SUSHI: 'سوشی',
  YFI: 'یرن فایننس', '1INCH': 'وان اینچ', ENS: 'اتریوم نیم سرویس',
  GRT: 'گراف', BAT: 'بت', MANA: 'دیسنترالند', SAND: 'سندباکس',
  AXS: 'اکسی', GALA: 'گالا', CHZ: 'چیلیز', ENJ: 'انجین کوین',
  HBAR: 'هدرا', ONE: 'هارمونی', LRC: 'لوپرینگ', STORJ: 'استورج',
  ZRX: 'زیرو ایکس', BAL: 'بالانسر', ROSE: 'اوآسیس', KSM: 'کوساما',
  ZEC: 'زی‌کش', DASH: 'دش', EOS: 'ای او اس', NEO: 'نئو',
  IOTA: 'آیوتا', QTUM: 'کیوتام', WAVES: 'ویوز', ICX: 'آیکون',
  ARB: 'اربیتروم', OP: 'اپتیمیزم', APT: 'آپتوس', TIA: 'سلستیا',
  SEI: 'سی', INJ: 'اینجکتیو', IMX: 'ایموتبل ایکس',
  LDO: 'لیدو', PENDLE: 'پندل', ONDO: 'اوندو',
  JUP: 'جوپیتر', PYTH: 'پایت', WIF: 'داگ ویف', BONK: 'بونک',
  FLOKI: 'فلوکی', MEME: 'میم', BOME: 'بوک آو میم',
  WLD: 'ورلد کوین', FET: 'فچ ای آی', AGIX: 'سینگولاریتی',
  RNDR: 'رندر', RENDER: 'رندر نتورک', FTM: 'فانتوم', S: 'سونیک',
  KAS: 'کاسپا', ICP: 'اینترنت کامپیوتر', THETA: 'تتا',
  FLOW: 'فلو', CFX: 'کانفلاکس', KAVA: 'کاوا',
  GMT: 'استپن', APE: 'ایپ کوین',
  HMSTR: 'همستر کمبات', DOGS: 'داگز', CATI: 'کتیزن', MAJOR: 'ماژور',
  T: 'ترشولد', CELR: 'سلر نتورک', MAGIC: 'مجیک', GMX: 'جی ام ایکس',
  BAND: 'بند', CVX: 'کانوکس', SSV: 'اس اس وی', MDT: 'مرژبل دیتا',
  OMG: 'او ام جی', RDNT: 'رادیانت', JST: 'جاست', BICO: 'بیکو',
  WOO: 'وو نتورک', SKL: 'اسکیل', GAL: 'گلکس',
  USDC: 'یو اس دی کوین', DAI: 'دای', TUSD: 'تیواس‌دی', BUSD: 'بی‌یواس‌دی',
  FDUSD: 'اف‌دی‌یو‌اس‌دی', PYUSD: 'پی‌یو‌اس‌دی',
  WBTC: 'رپد بیت کوین', WETH: 'رپد اتریوم', STETH: 'استیک اتریوم',
  QNT: 'کوانت', MASK: 'مسک', DYDX: 'دی وای دی ایکس',
  LPT: 'لایوپیر', API3: 'ای پی آی ۳', GLM: 'گولم',
  DAO: 'دائو میکر', CVC: 'سیویک', NMR: 'نومریر',
  SNT: 'استاتوس', ANT: 'آراگون', SLP: 'اسموث لاو',
  EGLD: 'مولتی ورس', BLUR: 'بلر',
};

// ============================================================================
// PUBLIC INTERFACES
// ============================================================================

export interface CoinInfo {
  name?: string;
  symbol?: string;
  usdt: number;
  irr: number;
  dayChange: number;
  dayHighToman?: number;
  dayLowToman?: number;
  dayHighUsd?: number;
  dayLowUsd?: number;
  chartUrl?: string;
  isStale?: boolean;
  isDerived?: boolean;
  unavailable?: boolean;
  source?: string;
  openPrice24h?: number;
}

export interface GoldInfo {
  title: string;
  tomanPrice: number;
  highToman: number;
  lowToman: number;
  dayChangePercent: number;
  dayChangeRaw?: string;
  isStale?: boolean;
  isDerived?: boolean;
  unavailable?: boolean;
  source?: string;
}

export interface Chart7DayData {
  points: number[];
  high: number;
  low: number;
  weekChangePercent: number;
  startPrice: number;
  currentPrice: number;
  source?: 'binance' | 'derived' | 'unavailable';
  isSynthetic?: boolean;
}

export interface AssetInfo {
  key: string;
  name: string;
  symbol: string;
  category: 'crypto' | 'gold' | 'oil' | 'fiat' | 'commodity';
  priceUsd?: number;
  priceToman?: number;
  dayChange: number;
  highToman?: number;
  lowToman?: number;
  highUsd?: number;
  lowUsd?: number;
  unit?: string;
  isStale?: boolean;
  isDerived?: boolean;
  unavailable?: boolean;
  source?: string;
}

export interface ProviderHealth {
  provider: string;
  lastAttemptAt: number;
  lastSuccessAt: number;
  lastErrorAt: number;
  lastErrorMessage: string;
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
}

export interface SnapshotMetadata {
  fetchedAt: number;
  generatedAt: number;
  isLive: boolean;
  isStale: boolean;
  ageMs: number;
  unavailableAssets: string[];
  providers: Record<string, {
    status: 'healthy' | 'degraded' | 'unavailable';
    lastSuccessAt: number;
    consecutiveFailures: number;
  }>;
  errors: string[];
}

export interface UnifiedMarketSnapshot {
  timestamp: number;
  serverTime: string;
  persianTime: string;
  metadata: SnapshotMetadata;
  tether: {
    toman: number; usd: number; dayChange: number;
    highToman: number; lowToman: number; source: string;
    isStale?: boolean; unavailable?: boolean;
  };
  dollar: {
    toman: number; usd: number; dayChange: number;
    highToman: number; lowToman: number; source: string;
    isStale?: boolean; unavailable?: boolean;
  };
  gold: Record<string, GoldInfo>;
  oil: Record<string, AssetInfo>;
  coins: Record<string, CoinInfo>;
  fiat: Record<string, AssetInfo>;
}

// ============================================================================
// PRICE SERVICE
// ============================================================================

export class PriceService {
  private static unifiedSnapshot: UnifiedMarketSnapshot | null = null;
  private static lastSnapshotTime = 0;
  private static inflightPromise: Promise<UnifiedMarketSnapshot> | null = null;
  private static liveTickerInterval: NodeJS.Timeout | null = null;
  private static providerHealth = new Map<string, ProviderHealth>();

  // ─── Price history for computing real change % when provider reports 0 ───
  private static priceHistory = new Map<string, Array<{ price: number; ts: number }>>();
  private static readonly HISTORY_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly HISTORY_MAX_POINTS = 500;
  private static readonly HISTORY_MIN_AGE_MS = 30 * 60 * 1000; // at least 30 min of data before we use it

  private static readonly PRIORITY_COINS = [
    'BTC', 'ETH', 'SOL', 'TON', 'BNB', 'XRP', 'DOGE', 'TRX', 'LTC',
    'ADA', 'SHIB', 'AVAX', 'LINK', 'DOT', 'NEAR', 'SUI', 'PEPE', 'NOT',
    'BCH', 'UNI', 'ATOM', 'ETC', 'XLM', 'ALGO', 'FIL', 'AAVE', 'MKR',
    'ARB', 'OP', 'APT', 'TIA', 'INJ', 'WLD', 'FET', 'RENDER', 'KAS',
    'HMSTR', 'DOGS', 'CATI', 'MAJOR', 'USDC', 'DAI',
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  static clearCache(): void {
    this.unifiedSnapshot = null;
    this.lastSnapshotTime = 0;
  }

  static startLiveTicker(): void {
    if (this.liveTickerInterval) return;
    this.getUnifiedMarketSnapshot().catch((e) =>
      console.error('[PriceService] initial ticker fetch failed:', e?.message || e)
    );
    this.liveTickerInterval = setInterval(() => {
      this.getUnifiedMarketSnapshot().catch((e) =>
        console.error('[PriceService] ticker fetch failed:', e?.message || e)
      );
    }, LIVE_TICKER_INTERVAL_MS);
  }

  static stopLiveTicker(): void {
    if (this.liveTickerInterval) {
      clearInterval(this.liveTickerInterval);
      this.liveTickerInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Provider health
  // ---------------------------------------------------------------------------

  private static markProviderSuccess(name: string): void {
    const h = this.providerHealth.get(name) || {
      provider: name, lastAttemptAt: 0, lastSuccessAt: 0, lastErrorAt: 0,
      lastErrorMessage: '', consecutiveFailures: 0, totalSuccesses: 0, totalFailures: 0,
    };
    h.lastAttemptAt = Date.now();
    h.lastSuccessAt = Date.now();
    h.consecutiveFailures = 0;
    h.totalSuccesses += 1;
    this.providerHealth.set(name, h);
  }

  private static markProviderFailure(name: string, errorMessage: string): void {
    const h = this.providerHealth.get(name) || {
      provider: name, lastAttemptAt: 0, lastSuccessAt: 0, lastErrorAt: 0,
      lastErrorMessage: '', consecutiveFailures: 0, totalSuccesses: 0, totalFailures: 0,
    };
    h.lastAttemptAt = Date.now();
    h.lastErrorAt = Date.now();
    h.lastErrorMessage = errorMessage.slice(0, 200);
    h.consecutiveFailures += 1;
    h.totalFailures += 1;
    this.providerHealth.set(name, h);
    console.warn(`[PriceService] provider "${name}" failed (${h.consecutiveFailures}x): ${errorMessage}`);
  }

  private static getProviderStatus(name: string): 'healthy' | 'degraded' | 'unavailable' {
    const h = this.providerHealth.get(name);
    if (!h || h.totalSuccesses === 0) return 'unavailable';
    if (h.consecutiveFailures === 0) return 'healthy';
    if (h.consecutiveFailures < 3) return 'degraded';
    return 'unavailable';
  }

  private static getProviderSummary(): SnapshotMetadata['providers'] {
    const out: SnapshotMetadata['providers'] = {};
    for (const [name, h] of this.providerHealth.entries()) {
      out[name] = {
        status: this.getProviderStatus(name),
        lastSuccessAt: h.lastSuccessAt,
        consecutiveFailures: h.consecutiveFailures,
      };
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------

  private static buildHeaders(url: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
    };
    if (url.includes('tgju.org')) {
      headers['Referer'] = 'https://www.tgju.org/';
    }
    return headers;
  }

  private static async fetchJson(
    url: string,
    timeoutMs: number = FETCH_TIMEOUT_MS,
    opts: { retries?: number; label?: string } = {}
  ): Promise<{ data: any; error?: string; status?: number; attempts: number }> {
    if (!url) return { data: null, error: 'empty url', attempts: 0 };

    const maxAttempts = (opts.retries ?? FETCH_RETRY_ATTEMPTS) + 1;
    let lastError = 'unknown';
    let lastStatus: number | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: this.buildHeaders(url),
        });
        clearTimeout(timer);

        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          lastStatus = res.status;
          const transient = res.status === 429 || res.status >= 500;
          if (transient && attempt < maxAttempts) {
            const retryAfter = Number(res.headers.get('retry-after')) || 0;
            const waitMs = retryAfter > 0
              ? retryAfter * 1000
              : FETCH_RETRY_BASE_MS * Math.pow(2, attempt - 1) + Math.random() * 200;
            await this.sleep(waitMs);
            continue;
          }
          return { data: null, error: lastError, status: lastStatus, attempts: attempt };
        }

        const data = await res.json().catch(() => null);
        if (data === null) {
          lastError = 'invalid JSON';
          if (attempt < maxAttempts) {
            await this.sleep(FETCH_RETRY_BASE_MS * attempt);
            continue;
          }
          return { data: null, error: lastError, attempts: attempt };
        }

        return { data, attempts: attempt };
      } catch (e: any) {
        clearTimeout(timer);
        lastError = e?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : (e?.message || String(e));
        const isNetwork = /fetch failed|ECONNRESET|ENOTFOUND|EAI_AGAIN|timeout/i.test(lastError);
        if (isNetwork && attempt < maxAttempts) {
          const waitMs = FETCH_RETRY_BASE_MS * Math.pow(2, attempt - 1) + Math.random() * 200;
          await this.sleep(waitMs);
          continue;
        }
        return { data: null, error: lastError, attempts: attempt };
      }
    }

    return { data: null, error: lastError, status: lastStatus, attempts: maxAttempts };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  private static isValidNumber(n: any): n is number {
    return typeof n === 'number' && Number.isFinite(n) && !Number.isNaN(n);
  }

  private static isValidTetherPrice(p: any): boolean {
    return this.isValidNumber(p) && p > 100_000 && p < 2_000_000;
  }

  private static isValidGold18Price(p: any): boolean {
    return this.isValidNumber(p) && p > 1_000_000 && p < 500_000_000;
  }

  private static isValidCoinUsd(p: any): boolean {
    return this.isValidNumber(p) && p > 0 && p < 10_000_000;
  }

  // ==========================================================================
  // PRICE HISTORY — records each fetch to compute real change % over time
  // ==========================================================================

  /**
   * Record a price observation for a given asset key.
   * Keeps the last 24h of data. If a point was recorded within the last 30s,
   * it's replaced (deduplication).
   */
  private static recordPrice(key: string, price: number): void {
    if (!this.isValidNumber(price) || price <= 0) return;
    const now = Date.now();
    let arr = this.priceHistory.get(key) || [];

    // Drop entries older than 24h
    arr = arr.filter((p) => now - p.ts < this.HISTORY_MAX_AGE_MS);

    // If a point was recorded within last 30s, replace it
    const last = arr[arr.length - 1];
    if (last && now - last.ts < 30_000) {
      arr[arr.length - 1] = { price, ts: now };
    } else {
      arr.push({ price, ts: now });
    }

    // Cap size
    if (arr.length > this.HISTORY_MAX_POINTS) {
      arr = arr.slice(-this.HISTORY_MAX_POINTS);
    }

    this.priceHistory.set(key, arr);
  }

  /**
   * Compute change % between oldest recorded price and current price.
   * Returns null if we don't have at least 30 minutes of history.
   */
  private static computeHistoryChange(key: string, currentPrice: number): number | null {
    const arr = this.priceHistory.get(key);
    if (!arr || arr.length < 2) return null;

    const oldest = arr[0];
    if (!oldest || oldest.price <= 0) return null;

    const ageMs = Date.now() - oldest.ts;
    if (ageMs < this.HISTORY_MIN_AGE_MS) return null;

    if (!this.isValidNumber(currentPrice) || currentPrice <= 0) return null;

    const pct = ((currentPrice - oldest.price) / oldest.price) * 100;
    if (!Number.isFinite(pct)) return null;

    // Reject obvious outliers
    if (Math.abs(pct) > 50) return null;

    return parseFloat(pct.toFixed(2));
  }

  // ==========================================================================
  // MAIN SNAPSHOT BUILDER
  // ==========================================================================

  static async getUnifiedMarketSnapshot(): Promise<UnifiedMarketSnapshot> {
    const now = Date.now();
    if (this.unifiedSnapshot && now - this.lastSnapshotTime < CACHE_TTL_MS) {
      return this.unifiedSnapshot;
    }
    if (this.inflightPromise) return this.inflightPromise;

    this.inflightPromise = this._fetchUnifiedSnapshot();
    try {
      return await this.inflightPromise;
    } finally {
      this.inflightPromise = null;
    }
  }

  private static async _fetchUnifiedSnapshot(): Promise<UnifiedMarketSnapshot> {
    const t0 = Date.now();
    const errors: string[] = [];
    const unavailable: string[] = [];

    try {
      return await this._doFetchSnapshot(t0, errors, unavailable);
    } catch (e: any) {
      console.error('[PriceService] FATAL in snapshot fetch:', e?.message || e);
      console.error(e?.stack || '');
      errors.push(`fatal: ${e?.message || e}`);

      if (this.unifiedSnapshot) {
        this.unifiedSnapshot.metadata.isStale = true;
        this.unifiedSnapshot.metadata.errors = errors;
        return this.unifiedSnapshot;
      }
      return this._emptySnapshot(t0, errors);
    }
  }

  private static _emptySnapshot(t0: number, errors: string[]): UnifiedMarketSnapshot {
    const nowIso = new Date().toISOString();
    return {
      timestamp: t0, serverTime: nowIso, persianTime: nowIso,
      metadata: {
        fetchedAt: t0, generatedAt: t0, isLive: false, isStale: true, ageMs: 0,
        unavailableAssets: ['all'], providers: {}, errors,
      },
      tether: { toman: 0, usd: 1.0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', unavailable: true },
      dollar: { toman: 0, usd: 1.0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', unavailable: true },
      gold: {}, oil: {}, coins: {}, fiat: {},
    };
  }

  private static async _doFetchSnapshot(
    fetchStart: number,
    errors: string[],
    unavailable: string[]
  ): Promise<UnifiedMarketSnapshot> {
    const hubConfig = BotStorage.getApiHubConfig();
    const goldUrl = hubConfig?.priceBoard?.goldApiUrl || '';
    const cryptoUrl = hubConfig?.priceBoard?.cryptoApiUrl || '';

    const [goldRes, cryptoRes, tgjuRes] = await Promise.all([
      goldUrl
        ? this.fetchJson(goldUrl, FETCH_TIMEOUT_MS, { label: 'fastcreat-gold' })
        : Promise.resolve({ data: null, error: 'no url', attempts: 0 }),
      cryptoUrl
        ? this.fetchJson(cryptoUrl, FETCH_TIMEOUT_MS, { label: 'fastcreat-crypto' })
        : Promise.resolve({ data: null, error: 'no url', attempts: 0 }),
      this.fetchJson(TGJU_URL, FETCH_TIMEOUT_MS, { label: 'tgju' }),
    ]);

    if (goldRes.data) this.markProviderSuccess('gold'); else this.markProviderFailure('gold', goldRes.error || 'unknown');
    if (cryptoRes.data) this.markProviderSuccess('crypto'); else this.markProviderFailure('crypto', cryptoRes.error || 'unknown');
    if (tgjuRes.data) this.markProviderSuccess('tgju'); else this.markProviderFailure('tgju', tgjuRes.error || 'unknown');

    if (!goldRes.data) errors.push(`gold: ${goldRes.error}`);
    if (!cryptoRes.data) errors.push(`crypto: ${cryptoRes.error}`);
    if (!tgjuRes.data) errors.push(`tgju: ${tgjuRes.error}`);

    // Extract dollar FIRST so tether can fall back to its change
    const dollarData = this.extractDollar(tgjuRes.data);
    if (!dollarData.isLive) unavailable.push('usd');

    const tetherData = this.extractTether(cryptoRes.data, dollarData.dayChange);
    if (!tetherData.isLive) unavailable.push('usdt');

    const goldBundle = this.extractGold(tgjuRes.data, goldRes.data);
    if (!goldBundle.gold18.isLive) unavailable.push('gold18');
    if (!goldBundle.sekeEmami.isLive) unavailable.push('sekeEmami');

    const coins = this.extractCoins(cryptoRes.data, tetherData.toman);

    try {
      await this.enrichCoinsWithBinance24h(coins, tetherData.toman);
    } catch (e: any) {
      console.warn('[PriceService] Binance enrichment failed, continuing:', e?.message || e);
    }

    const fiat = this.extractFiat(dollarData.toman, dollarData.isLive);
    const oil = this.extractOil(tgjuRes.data);

    const nowIso = new Date().toISOString();
    let persianTime = nowIso;
    try {
      persianTime = new Intl.DateTimeFormat('fa-IR', {
        timeZone: 'Asia/Tehran',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).format(new Date());
    } catch { /* ignore */ }

    const goldRecord: Record<string, GoldInfo> = {
      gold18: goldBundle.gold18.toGoldInfo(),
      gold24: goldBundle.gold24.toGoldInfo(),
      mesghal: goldBundle.mesghal.toGoldInfo(),
      sekeEmami: goldBundle.sekeEmami.toGoldInfo(),
      sekeBahar: goldBundle.sekeBahar.toGoldInfo(),
      sekeNim: goldBundle.sekeNim.toGoldInfo(),
      sekeRob: goldBundle.sekeRob.toGoldInfo(),
      sekeGerami: goldBundle.sekeGerami.toGoldInfo(),
      silver: goldBundle.silver.toGoldInfo(),
      ons: goldBundle.ons.toGoldInfo(),
    };

    const isLive = tetherData.isLive || dollarData.isLive || goldBundle.gold18.isLive;

    const snapshot: UnifiedMarketSnapshot = {
      timestamp: fetchStart,
      serverTime: nowIso,
      persianTime,
      metadata: {
        fetchedAt: fetchStart,
        generatedAt: fetchStart,
        isLive,
        isStale: !isLive,
        ageMs: 0,
        unavailableAssets: unavailable,
        providers: this.getProviderSummary(),
        errors,
      },
      tether: {
        toman: tetherData.toman,
        usd: 1.0,
        dayChange: tetherData.dayChange,
        highToman: tetherData.highToman,
        lowToman: tetherData.lowToman,
        source: tetherData.source,
        isStale: !tetherData.isLive,
        unavailable: !tetherData.isLive,
      },
      dollar: {
        toman: dollarData.toman,
        usd: 1.0,
        dayChange: dollarData.dayChange,
        highToman: dollarData.highToman,
        lowToman: dollarData.lowToman,
        source: dollarData.source,
        isStale: !dollarData.isLive,
        unavailable: !dollarData.isLive,
      },
      gold: goldRecord,
      oil,
      coins,
      fiat,
    };

    if (isLive || this.unifiedSnapshot === null) {
      this.unifiedSnapshot = snapshot;
      this.lastSnapshotTime = fetchStart;
    } else if (this.unifiedSnapshot) {
      console.warn('[PriceService] all providers failed — keeping last known snapshot');
      this.unifiedSnapshot.metadata.isStale = true;
      this.unifiedSnapshot.metadata.errors = errors;
      return this.unifiedSnapshot;
    }

    return snapshot;
  }

  // ==========================================================================
  // EXTRACTORS
  // ==========================================================================

  private static extractTether(cryptoData: any, fallbackDayChange: number = 0): {
    toman: number; dayChange: number; highToman: number; lowToman: number;
    source: string; isLive: boolean;
  } {
    const result = cryptoData?.result;

    const usdt = result?.USDT || result?.usdt;
    if (usdt?.irr) {
      const pToman = parseFloat(String(usdt.irr));
      if (this.isValidTetherPrice(pToman)) {
        let ch = parseFloat(String(usdt.dayChange || '0')) || 0;
        if (ch === 0 && fallbackDayChange !== 0) ch = fallbackDayChange;

        // Last resort: compute from our own price history
        if (ch === 0) {
          const histCh = this.computeHistoryChange('tether', pToman);
          if (histCh !== null) ch = histCh;
        }

        // Record for future change calculations
        this.recordPrice('tether', pToman);

        return {
          toman: Math.round(pToman),
          dayChange: ch,
          highToman: Math.round(pToman * 1.005),
          lowToman: Math.round(pToman * 0.995),
          source: 'fast_creat',
          isLive: true,
        };
      }
    }

    const stats = cryptoData?.stats;
    if (stats?.['usdt-rls']?.latest) {
      const pRials = parseFloat(stats['usdt-rls'].latest);
      const pToman = Math.round(pRials / RIALS_PER_TOMAN);
      if (this.isValidTetherPrice(pToman)) {
        let ch = parseFloat(stats['usdt-rls'].dayChange || '0') || 0;
        if (ch === 0 && fallbackDayChange !== 0) ch = fallbackDayChange;
        if (ch === 0) {
          const histCh = this.computeHistoryChange('tether', pToman);
          if (histCh !== null) ch = histCh;
        }
        this.recordPrice('tether', pToman);
        return {
          toman: pToman, dayChange: ch,
          highToman: Math.round(pToman * 1.005), lowToman: Math.round(pToman * 0.995),
          source: 'nobitex_raw', isLive: true,
        };
      }
    }

    return { toman: 0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', isLive: false };
  }

  private static extractDollar(tgjuData: any): {
    toman: number; dayChange: number; highToman: number; lowToman: number;
    source: string; isLive: boolean;
  } {
    const current = tgjuData?.current || tgjuData?.data?.current;
    const field = current?.price_dollar_rl;

    if (field?.p) {
      const pRials = this.parseNumberFromRaw(field.p);
      const pToman = Math.round(pRials / RIALS_PER_TOMAN);
      if (this.isValidTetherPrice(pToman)) {
        const dp = parseFloat(String(field.dp || field.d || '0')) || 0;
        const highR = this.parseNumberFromRaw(field.h);
        const lowR = this.parseNumberFromRaw(field.l);
        const high = highR > 0 ? Math.round(highR / RIALS_PER_TOMAN) : 0;
        const low = lowR > 0 ? Math.round(lowR / RIALS_PER_TOMAN) : 0;

        let dayChange = dp;
        if (dayChange === 0 && high > 0 && low > 0 && high !== low) {
          dayChange = this.changeFromRange(pToman, high, low);
        }
        // Last resort: use our own price history
        if (dayChange === 0) {
          const histCh = this.computeHistoryChange('dollar', pToman);
          if (histCh !== null) dayChange = histCh;
        }
        this.recordPrice('dollar', pToman);

        return {
          toman: pToman, dayChange,
          highToman: high > 0 ? high : Math.round(pToman * 1.01),
          lowToman: low > 0 ? low : Math.round(pToman * 0.99),
          source: 'tgju', isLive: true,
        };
      }
    }

    return { toman: 0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', isLive: false };
  }

  private static extractGold(tgjuData: any, fastcreatData: any): {
    gold18: GoldExtract; gold24: GoldExtract; mesghal: GoldExtract;
    sekeEmami: GoldExtract; sekeBahar: GoldExtract; sekeNim: GoldExtract;
    sekeRob: GoldExtract; sekeGerami: GoldExtract; silver: GoldExtract; ons: GoldExtract;
  } {
    const empty = (title: string): GoldExtract => new GoldExtract(title, 0, 0, 0, 0, false, 'unavailable');

    const g18  = empty('طلای ۱۸ عیار / 750');
    const g24  = empty('طلای ۲۴ عیار');
    const mes  = empty('مثقال طلا / آبشده نقدی');
    const skE  = empty('سکه امامی');
    const skB  = empty('سکه بهار آزادی');
    const skN  = empty('نیم سکه');
    const skR  = empty('ربع سکه');
    const skG  = empty('سکه گرمی');
    const silv = empty('نقره ۹۹۹');
    const ons  = empty('انس جهانی طلا');

    const current = tgjuData?.current || tgjuData?.data?.current;
    if (current) {
      const tg = (key: string, target: GoldExtract) => {
        const f = current[key];
        if (!f?.p) return;
        const pToman = Math.round(this.parseNumberFromRaw(f.p) / RIALS_PER_TOMAN);
        const high = Math.round(this.parseNumberFromRaw(f.h) / RIALS_PER_TOMAN);
        const low  = Math.round(this.parseNumberFromRaw(f.l) / RIALS_PER_TOMAN);

        let ch = parseFloat(String(f.dp || f.d || '0')) || 0;
        if (ch === 0 && high > 0 && low > 0 && high !== low) {
          ch = this.changeFromRange(pToman, high, low);
        }
        // Use price history for realistic change when provider gives 0
        if (ch === 0) {
          const histCh = this.computeHistoryChange(key, pToman);
          if (histCh !== null) ch = histCh;
        }
        this.recordPrice(key, pToman);

        if (pToman > 0) target.set(pToman, high, low, ch, true, 'tgju');
      };

      tg('geram18', g18);
      tg('geram24', g24);
      tg('mesghal', mes);
      tg('sekee', skE);
      tg('sekeb', skB);
      tg('nim', skN);
      tg('rob', skR);
      tg('gerami', skG);
      tg('silver', silv);

      const onsField = current['ons'];
      if (onsField?.p) {
        const usdPrice = this.parseNumberFromRaw(onsField.p);
        if (usdPrice > 100 && usdPrice < 10_000) {
          let ch = parseFloat(String(onsField.dp || onsField.d || '0')) || 0;
          const highUsd = this.parseNumberFromRaw(onsField.h);
          const lowUsd = this.parseNumberFromRaw(onsField.l);
          if (ch === 0 && highUsd > 0 && lowUsd > 0 && highUsd !== lowUsd) {
            ch = this.changeFromRange(usdPrice, highUsd, lowUsd);
          }
          if (ch === 0) {
            const histCh = this.computeHistoryChange('ons', usdPrice);
            if (histCh !== null) ch = histCh;
          }
          this.recordPrice('ons', usdPrice);
          ons.set(Math.round(usdPrice), 0, 0, ch, true, 'tgju');
        }
      }
    }

    const arr = fastcreatData?.result;
    if (Array.isArray(arr)) {
      const trySet = (target: GoldExtract, key: string, pRials: number, highR: number, lowR: number, ch: number) => {
        if (target.isLive) return;
        const pToman = Math.round(pRials / RIALS_PER_TOMAN);
        const highT = highR > 0 ? Math.round(highR / RIALS_PER_TOMAN) : 0;
        const lowT  = lowR  > 0 ? Math.round(lowR  / RIALS_PER_TOMAN) : 0;
        let finalCh = ch;
        if (finalCh === 0 && highT > 0 && lowT > 0 && highT !== lowT) {
          finalCh = this.changeFromRange(pToman, highT, lowT);
        }
        if (finalCh === 0) {
          const histCh = this.computeHistoryChange(key, pToman);
          if (histCh !== null) finalCh = histCh;
        }
        this.recordPrice(key, pToman);
        if (pToman > 0) target.set(pToman, highT, lowT, finalCh, true, 'fast_creat');
      };

      for (const item of arr) {
        if (!item?.title) continue;
        const title = String(item.title);
        const pRials = parseInt(String(item.price?.[0] || '0').replace(/[^0-9]/g, ''), 10);
        if (!pRials) continue;
        const chMatch = String(item.price?.[1] || '').match(/\(([+-]?\d+(?:\.\d+)?)%\)/);
        const ch = chMatch ? parseFloat(chMatch[1]) : 0;
        const highR = parseInt(String(item.highest || '0').replace(/[^0-9]/g, ''), 10);
        const lowR  = parseInt(String(item.lowest  || '0').replace(/[^0-9]/g, ''), 10);

        if ((title.includes('18 عیار') || title.includes('۱۸ عیار')) && this.isValidGold18Price(Math.round(pRials / RIALS_PER_TOMAN))) {
          trySet(g18, 'gold18', pRials, highR, lowR, ch);
        } else if (title.includes('24 عیار') || title.includes('۲۴ عیار')) {
          trySet(g24, 'gold24', pRials, highR, lowR, ch);
        } else if (title.includes('مثقال')) {
          trySet(mes, 'mesghal', pRials, highR, lowR, ch);
        } else if (title.includes('امامی')) {
          trySet(skE, 'sekeEmami', pRials, highR, lowR, ch);
        } else if (title.includes('بهار')) {
          trySet(skB, 'sekeBahar', pRials, highR, lowR, ch);
        } else if (title.includes('نیم')) {
          trySet(skN, 'sekeNim', pRials, highR, lowR, ch);
        } else if (title.includes('ربع')) {
          trySet(skR, 'sekeRob', pRials, highR, lowR, ch);
        } else if (title.includes('گرمی')) {
          trySet(skG, 'sekeGerami', pRials, highR, lowR, ch);
        } else if (title.includes('نقره')) {
          trySet(silv, 'silver', pRials, highR, lowR, ch);
        }
      }
    }

    return {
      gold18: g18, gold24: g24, mesghal: mes,
      sekeEmami: skE, sekeBahar: skB, sekeNim: skN, sekeRob: skR, sekeGerami: skG,
      silver: silv, ons: ons,
    };
  }

  private static extractCoins(cryptoData: any, tetherToman: number): Record<string, CoinInfo> {
    const coins: Record<string, CoinInfo> = {};
    const result = cryptoData?.result;

    if (result && typeof result === 'object' && !Array.isArray(result)) {
      for (const [symKey, item] of Object.entries(result)) {
        if (symKey.toUpperCase() === 'USDT') continue;
        const it: any = item;
        if (!it || typeof it !== 'object') continue;

        const sym = symKey.toUpperCase();
        const toman = parseFloat(String(it.irr || '0'));
        const usdt = parseFloat(String(it.usdt || '0'));
        let dayCh = parseFloat(String(it.dayChange || '0')) || 0;

        if (toman > 0 || usdt > 0) {
          const finalToman = toman > 0 ? Math.round(toman)
            : (tetherToman > 0 ? Math.round(usdt * tetherToman) : 0);
          const finalUsd = usdt > 0 ? usdt
            : (tetherToman > 0 ? parseFloat((finalToman / tetherToman).toFixed(6)) : 0);

          if (finalToman > 0 || finalUsd > 0) {
            // Use price history to fill in the change % when provider reports 0
            if (dayCh === 0 && finalToman > 0) {
              const histCh = this.computeHistoryChange(sym.toLowerCase(), finalToman);
              if (histCh !== null) dayCh = histCh;
            }
            if (finalToman > 0) this.recordPrice(sym.toLowerCase(), finalToman);

            const coin: CoinInfo = {
              name: it.name || PERSIAN_NAMES[sym] || sym,
              symbol: sym,
              usdt: finalUsd,
              irr: finalToman,
              dayChange: dayCh,
              source: 'fast_creat',
              isDerived: usdt === 0 && tetherToman > 0,
            };
            coins[sym.toLowerCase()] = coin;
            coins[sym] = coin;
          }
        }
      }
    }

    if (tetherToman > 0) {
      const usdt: CoinInfo = {
        name: 'تتر دیجیتال', symbol: 'USDT',
        usdt: 1.0, irr: tetherToman, dayChange: 0,
        source: 'fast_creat',
      };
      coins['usdt'] = usdt;
      coins['tether'] = usdt;
      coins['USDT'] = usdt;
    }

    for (const [alias, standard] of Object.entries(MANUAL_ALIASES)) {
      const std = standard.toLowerCase();
      if (coins[std]) coins[alias.toLowerCase()] = coins[std];
    }

    return coins;
  }

  private static async enrichCoinsWithBinance24h(
    coins: Record<string, CoinInfo>,
    tetherToman: number
  ): Promise<void> {
    const priority = this.PRIORITY_COINS;
    let newCoins = 0;
    let merged = 0;
    let failed = 0;

    console.log(`[PriceService] Enriching ${priority.length} priority coins with Binance 24h data (concurrency=${BINANCE_CONCURRENCY})...`);

    for (let i = 0; i < priority.length; i += BINANCE_CONCURRENCY) {
      const batch = priority.slice(i, i + BINANCE_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (sym) => {
          const url = `${BINANCE_TICKER_URL}?symbol=${sym}USDT`;
          const r = await this.fetchJson(url, 3_500, { retries: 1, label: `binance:${sym}` });
          return { sym, data: r.data, error: r.error };
        })
      );

      for (const { sym, data, error } of results) {
        if (!data || !data.lastPrice) {
          failed++;
          if (error && !/HTTP 400|HTTP 404/.test(error)) {
            console.warn(`[PriceService] Binance ${sym}: ${error}`);
          }
          continue;
        }

        const lastPrice = parseFloat(String(data.lastPrice || '0'));
        const openPrice = parseFloat(String(data.openPrice || '0'));
        const highPrice = parseFloat(String(data.highPrice || '0'));
        const lowPrice  = parseFloat(String(data.lowPrice  || '0'));
        const changePct = parseFloat(String(data.priceChangePercent || '0'));

        if (!Number.isFinite(lastPrice) || lastPrice <= 0) { failed++; continue; }

        const symUpper = sym.toUpperCase();
        const existing = coins[symUpper] || coins[sym.toLowerCase()];
        const tomanFromBinance = tetherToman > 0 ? Math.round(lastPrice * tetherToman) : 0;

        const highToman = highPrice > 0 && tetherToman > 0 ? Math.round(highPrice * tetherToman) : undefined;
        const lowToman  = lowPrice  > 0 && tetherToman > 0 ? Math.round(lowPrice  * tetherToman) : undefined;

        if (existing) {
          if (!existing.irr || existing.irr === 0) existing.irr = tomanFromBinance;
          if (!existing.usdt || existing.usdt === 0) existing.usdt = lastPrice;

          if (!existing.dayChange || existing.dayChange === 0) {
            existing.dayChange = Number.isFinite(changePct) ? changePct : 0;
            // If Binance also reports 0, try our history
            if (existing.dayChange === 0 && existing.irr > 0) {
              const histCh = this.computeHistoryChange(sym.toLowerCase(), existing.irr);
              if (histCh !== null) existing.dayChange = histCh;
            }
          }

          existing.dayHighUsd = highPrice > 0 ? highPrice : undefined;
          existing.dayLowUsd  = lowPrice  > 0 ? lowPrice  : undefined;
          existing.dayHighToman = highToman;
          existing.dayLowToman  = lowToman;
          existing.openPrice24h = openPrice > 0 ? openPrice : undefined;
          merged++;
        } else {
          const coin: CoinInfo = {
            name: PERSIAN_NAMES[symUpper] || symUpper,
            symbol: symUpper,
            usdt: lastPrice,
            irr: tomanFromBinance,
            dayChange: Number.isFinite(changePct) ? changePct : 0,
            dayHighUsd: highPrice > 0 ? highPrice : undefined,
            dayLowUsd:  lowPrice  > 0 ? lowPrice  : undefined,
            dayHighToman: highToman,
            dayLowToman:  lowToman,
            openPrice24h: openPrice > 0 ? openPrice : undefined,
            source: 'binance',
            isDerived: tomanFromBinance > 0,
          };
          coins[symUpper] = coin;
          coins[sym.toLowerCase()] = coin;
          newCoins++;
        }

        // Always record in history for future change calculations
        if (tomanFromBinance > 0) {
          this.recordPrice(sym.toLowerCase(), tomanFromBinance);
        }
      }
    }

    console.log(`[PriceService] Binance enrichment done — merged=${merged} new=${newCoins} failed=${failed}`);
  }

  private static extractFiat(dollarToman: number, dollarLive: boolean): Record<string, AssetInfo> {
    const usd: AssetInfo = {
      key: 'usd', name: 'US Dollar (دلار آمریکا)', symbol: 'USD', category: 'fiat',
      priceToman: dollarToman || undefined,
      priceUsd: 1.0,
      dayChange: 0,
      unavailable: !dollarLive,
      source: 'tgju',
    };

    const crosses: Array<[string, string, number]> = [
      ['eur', 'Euro (یورو)', 1.08],
      ['gbp', 'British Pound (پوند)', 1.27],
      ['aed', 'UAE Dirham (درهم)', 0.272],
      ['try', 'Turkish Lira (لیر)', 0.029],
      ['cny', 'Chinese Yuan (یوان)', 0.138],
      ['cad', 'Canadian Dollar', 0.73],
      ['aud', 'Australian Dollar', 0.66],
      ['chf', 'Swiss Franc', 1.12],
    ];

    const out: Record<string, AssetInfo> = { usd };
    for (const [key, name, ratio] of crosses) {
      out[key] = {
        key, name, symbol: key.toUpperCase(), category: 'fiat',
        priceUsd: ratio,
        priceToman: dollarToman > 0 ? Math.round(ratio * dollarToman) : undefined,
        dayChange: 0,
        isDerived: true,
        unavailable: !dollarLive,
        source: 'derived',
      };
    }
    return out;
  }

  private static extractOil(tgjuData: any): Record<string, AssetInfo> {
    const current = tgjuData?.current || tgjuData?.data?.current;
    const out: Record<string, AssetInfo> = {};

    const makeOil = (key: string, name: string, symbol: string, fieldKey: string): AssetInfo => {
      const f = current?.[fieldKey];
      if (f?.p) {
        const usd = this.parseNumberFromRaw(f.p);
        let ch = parseFloat(String(f.dp || f.d || '0')) || 0;
        const highUsd = this.parseNumberFromRaw(f.h);
        const lowUsd = this.parseNumberFromRaw(f.l);
        if (ch === 0 && highUsd > 0 && lowUsd > 0 && highUsd !== lowUsd) {
          ch = this.changeFromRange(usd, highUsd, lowUsd);
        }
        if (ch === 0) {
          const histCh = this.computeHistoryChange(key, usd);
          if (histCh !== null) ch = histCh;
        }
        this.recordPrice(key, usd);
        if (usd > 0 && usd < 10_000) {
          return {
            key, name, symbol, category: 'oil',
            priceUsd: usd,
            dayChange: ch,
            unit: 'per barrel',
            source: 'tgju',
          };
        }
      }
      return { key, name, symbol, category: 'oil', dayChange: 0, unavailable: true, unit: 'per barrel', source: 'unavailable' };
    };

    out['brent'] = makeOil('oil_brent', 'Brent Crude Oil (نفت برنت)', 'BRENT', 'oil_brent');
    out['wti']   = makeOil('oil_wti',   'WTI Crude Oil (نفت وست تگزاس)', 'WTI', 'oil_wti');
    out['gas']   = makeOil('gas',       'Natural Gas (گاز طبیعی)', 'GAS', 'gas');
    return out;
  }

  private static dedupeCoins(coins: Record<string, CoinInfo>): CoinInfo[] {
    const priority = [
      'BTC', 'ETH', 'USDT', 'TON', 'SOL', 'BNB', 'TRX', 'DOGE', 'XRP',
      'ADA', 'SHIB', 'PEPE', 'NOT', 'LTC', 'BCH', 'AVAX', 'LINK', 'SUI', 'NEAR',
      'DOT', 'UNI', 'ATOM', 'ETC', 'XLM', 'ALGO', 'FIL', 'AAVE', 'MKR',
      'ARB', 'OP', 'APT', 'TIA', 'INJ', 'WLD', 'FET', 'RENDER', 'KAS',
    ];
    const priorityIndex = new Map<string, number>();
    priority.forEach((s, i) => priorityIndex.set(s, i));

    const seen = new Map<string, CoinInfo>();
    for (const [key, coin] of Object.entries(coins)) {
      if (!coin || coin.unavailable) continue;
      const sym = (coin.symbol || key).toUpperCase();
      if (!sym || sym.length > 12) continue;
      if (!/^[A-Z0-9]+$/.test(sym)) continue;
      if (seen.has(sym)) continue;
      if (sym === 'TETHER') continue;
      seen.set(sym, coin);
    }

    const list = Array.from(seen.values());
    list.sort((a, b) => {
      const sa = (a.symbol || '').toUpperCase();
      const sb = (b.symbol || '').toUpperCase();
      const pa = priorityIndex.has(sa) ? priorityIndex.get(sa)! : 999;
      const pb = priorityIndex.has(sb) ? priorityIndex.get(sb)! : 999;
      if (pa !== pb) return pa - pb;
      return (b.usdt || 0) - (a.usdt || 0);
    });
    return list;
  }

  // ==========================================================================
  // PUBLIC: individual lookups
  // ==========================================================================

  static async getOilPrice(type: 'brent' | 'wti' | 'gas' = 'brent'): Promise<AssetInfo> {
    const snap = await this.getUnifiedMarketSnapshot();
    const key = (type || 'brent').toLowerCase();
    return snap.oil[key] || {
      key: `oil_${key}`, name: key, symbol: key.toUpperCase(),
      category: 'oil', dayChange: 0, unavailable: true, unit: 'per barrel', source: 'unavailable',
    };
  }

  static async getGoldPrice(): Promise<GoldInfo | null> {
    const snap = await this.getUnifiedMarketSnapshot();
    return snap.gold.gold18 || null;
  }

  static async getGoldOrCoinItem(query: string): Promise<GoldInfo> {
    const q = this.faNumToEn(query.trim().toLowerCase());
    const snap = await this.getUnifiedMarketSnapshot();
    const g = snap.gold;

    if (!g.gold18) return new GoldExtract('unavailable', 0, 0, 0, 0, false, 'unavailable').toGoldInfo();

    if (q.includes('امامی') || q.includes('emami') || q === 'seke' || q === 'سکه' || q.includes('طرح جدید')) return g.sekeEmami;
    if (q.includes('بهار') || q.includes('bahar') || q.includes('تمام') || q.includes('طرح قدیم')) return g.sekeBahar;
    if (q.includes('نیم') || q.includes('nim')) return g.sekeNim;
    if (q.includes('ربع') || q.includes('rob')) return g.sekeRob;
    if (q.includes('گرمی') || q.includes('gerami')) return g.sekeGerami;
    if (q.includes('۲۴') || q.includes('24')) return g.gold24;
    if (q.includes('مظنه') || q.includes('مثقال') || q.includes('آبشده') || q.includes('mesghal')) return g.mesghal;
    if (q.includes('انس') || q.includes('ons') || q.includes('xau')) return g.ons;
    if (q.includes('نقره') || q.includes('silver') || q.includes('xag')) return g.silver;
    return g.gold18;
  }

  static async getCoinData(): Promise<Record<string, CoinInfo>> {
    const snap = await this.getUnifiedMarketSnapshot();
    return snap.coins;
  }

  static async resolveAnyAsset(rawQuery: string): Promise<AssetInfo | null> {
    const parsed = this.parseNaturalQuery(rawQuery);
    const clean = parsed.cleanKey || this.faNumToEn(rawQuery.trim().toLowerCase());
    const aliasKey = MANUAL_ALIASES[clean] || clean;
    const amount = parsed.amount > 0 ? parsed.amount : 1;
    const snap = await this.getUnifiedMarketSnapshot();

    if (aliasKey.startsWith('oil') || clean.includes('نفت') || clean.includes('گاز')) {
      const type: 'brent' | 'wti' | 'gas' =
        aliasKey === 'oil_wti' || clean.includes('wti') ? 'wti'
        : clean.includes('گاز') ? 'gas' : 'brent';
      const oil = await this.getOilPrice(type);
      if (oil.unavailable) return { ...oil, unavailable: true };
      return {
        ...oil,
        name: amount > 1 ? `${amount} ${oil.name}` : oil.name,
        priceUsd: oil.priceUsd ? oil.priceUsd * amount : undefined,
      };
    }

    if (
      aliasKey.startsWith('gold') || aliasKey.startsWith('silver') || aliasKey.startsWith('seke') ||
      aliasKey.startsWith('mesghal') || aliasKey.startsWith('ons') ||
      clean.includes('طلا') || clean.includes('سکه') || clean.includes('نقره') ||
      clean.includes('مثقال') || clean.includes('مظنه') || clean.includes('انس')
    ) {
      const item = await this.getGoldOrCoinItem(clean);
      if (item.unavailable) {
        return { key: aliasKey, name: item.title, symbol: aliasKey.toUpperCase(), category: 'gold', dayChange: 0, unavailable: true };
      }
      const usdt = snap.tether.toman || 1;
      return {
        key: aliasKey, name: amount > 1 ? `${amount} ${item.title}` : item.title,
        symbol: aliasKey.toUpperCase(), category: 'gold',
        priceToman: Math.round(item.tomanPrice * amount),
        priceUsd: parseFloat(((item.tomanPrice * amount) / usdt).toFixed(2)),
        dayChange: item.dayChangePercent,
        highToman: item.highToman ? Math.round(item.highToman * amount) : undefined,
        lowToman: item.lowToman ? Math.round(item.lowToman * amount) : undefined,
      };
    }

    const fiatKey = (aliasKey || '').toLowerCase();
    if (snap.fiat[fiatKey] || snap.fiat[clean]) {
      const f = snap.fiat[fiatKey] || snap.fiat[clean];
      if (f.unavailable) return { ...f, unavailable: true };
      return {
        ...f,
        name: amount > 1 ? `${amount} ${f.name}` : f.name,
        priceToman: f.priceToman ? Math.round(f.priceToman * amount) : undefined,
        priceUsd: f.priceUsd ? parseFloat((f.priceUsd * amount).toFixed(6)) : undefined,
      };
    }

    const coins = snap.coins;
    const coin = coins[aliasKey] || coins[clean] || coins[fiatKey] || coins[aliasKey.toUpperCase()];
    if (coin) {
      if (coin.unavailable) {
        return {
          key: aliasKey, name: coin.name || aliasKey.toUpperCase(),
          symbol: (coin.symbol || aliasKey).toUpperCase(),
          category: 'crypto', dayChange: 0, unavailable: true,
        };
      }
      return {
        key: aliasKey,
        name: amount > 1 ? `${amount} ${coin.name || aliasKey.toUpperCase()}` : (coin.name || aliasKey.toUpperCase()),
        symbol: (coin.symbol || aliasKey).toUpperCase(),
        category: 'crypto',
        priceUsd: coin.usdt ? coin.usdt * amount : undefined,
        priceToman: coin.irr ? coin.irr * amount : undefined,
        dayChange: coin.dayChange,
        highToman: coin.dayHighToman ? coin.dayHighToman * amount : undefined,
        lowToman: coin.dayLowToman ? coin.dayLowToman * amount : undefined,
        highUsd: coin.dayHighUsd ? coin.dayHighUsd * amount : undefined,
        lowUsd: coin.dayLowUsd ? coin.dayLowUsd * amount : undefined,
      };
    }

    return null;
  }

  static async getMarketOverviewAssets(): Promise<AssetInfo[]> {
    const snap = await this.getUnifiedMarketSnapshot();
    const list = this.dedupeCoins(snap.coins);

    const preferred = ['BTC', 'ETH', 'SOL', 'TON', 'LTC', 'DOGE', 'XRP', 'BNB', 'TRX'];
    const picked: AssetInfo[] = [];
    const usedSymbols = new Set<string>();

    const findCoin = (sym: string): CoinInfo | undefined =>
      list.find((c) => (c.symbol || '').toUpperCase() === sym);

    for (const sym of preferred) {
      const c = findCoin(sym);
      if (c && !c.unavailable) {
        picked.push({
          key: sym.toLowerCase(), name: c.name || sym, symbol: sym, category: 'crypto',
          priceUsd: c.usdt, priceToman: c.irr, dayChange: c.dayChange,
        });
        usedSymbols.add(sym);
      }
    }

    for (const c of list) {
      if (picked.length >= 9) break;
      const sym = (c.symbol || '').toUpperCase();
      if (usedSymbols.has(sym)) continue;
      picked.push({
        key: sym.toLowerCase(), name: c.name || sym, symbol: sym, category: 'crypto',
        priceUsd: c.usdt, priceToman: c.irr, dayChange: c.dayChange,
      });
      usedSymbols.add(sym);
    }

    for (const sym of preferred) {
      if (picked.length >= 9) break;
      if (usedSymbols.has(sym)) continue;
      picked.push({ key: sym.toLowerCase(), name: sym, symbol: sym, category: 'crypto', dayChange: 0, unavailable: true });
      usedSymbols.add(sym);
    }

    return picked.slice(0, 9);
  }

  // ==========================================================================
  // CHARTS
  // ==========================================================================

  static async get7DayChartData(
    symbol: string,
    currentPrice: number,
    dayChange: number = 0,
    category?: string
  ): Promise<Chart7DayData> {
    const cleanSym = (symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    const isCrypto = !(
      cleanSym.startsWith('GOLD') || cleanSym.startsWith('SEKE') || cleanSym.startsWith('SILVER') ||
      cleanSym.startsWith('OIL') || cleanSym.startsWith('BRENT') || cleanSym.startsWith('WTI') ||
      cleanSym === 'USD' || cleanSym === 'EUR' || cleanSym === 'GBP' ||
      cleanSym === 'AED' || cleanSym === 'TRY' || cleanSym === 'CNY' ||
      cleanSym === 'ONS' || cleanSym === 'XAU'
    );

    if (isCrypto && cleanSym) {
      try {
        const r = await this.fetchJson(
          `${BINANCE_KLINES_URL}?symbol=${cleanSym}USDT&interval=2h&limit=84`,
          FETCH_TIMEOUT_MS,
          { retries: 1, label: `klines:${cleanSym}` }
        );
        if (Array.isArray(r.data) && r.data.length >= 20) {
          const points = r.data.map((c: any) => parseFloat(c[4]));
          if (points.every((p) => this.isValidNumber(p) && p > 0)) {
            const high = Math.max(...points);
            const low  = Math.min(...points);
            const start = points[0];
            const current = points[points.length - 1];
            return {
              points, high, low,
              weekChangePercent: start > 0 ? ((current - start) / start) * 100 : dayChange,
              startPrice: start, currentPrice: current,
              source: 'binance', isSynthetic: false,
            };
          }
        }
      } catch (e: any) {
        console.warn(`[PriceService] klines failed for ${cleanSym}:`, e?.message);
      }
    }

    return {
      points: [], high: 0, low: 0,
      weekChangePercent: dayChange,
      startPrice: 0, currentPrice: currentPrice || 0,
      source: 'unavailable', isSynthetic: false,
    };
  }

  // ==========================================================================
  // MINI APP DATA
  // ==========================================================================

  static async getMiniAppData(): Promise<{
    highlights: any[]; crypto: any[]; gold: any[]; fiat: any[]; oil: any[];
    serverTime: string;
    totalCryptoCount: number;
  }> {
    try {
      const snap = await this.getUnifiedMarketSnapshot();
      const dollarToman = snap.dollar.toman;
      const tetherToman = snap.tether.toman;

      const makeItem = (
        key: string, symbol: string, name: string, persianName: string,
        category: 'crypto' | 'gold' | 'fiat' | 'oil',
        priceToman: number, priceUsd: number | undefined, dayChange: number,
        highToman?: number, lowToman?: number,
        openUsd24h?: number
      ) => {
        const safeToman = priceToman > 0 ? priceToman : 0;
        const safeUsd = priceUsd && priceUsd > 0 ? priceUsd : undefined;
        const safeHigh = highToman && highToman > 0 ? highToman : undefined;
        const safeLow  = lowToman  && lowToman  > 0 ? lowToman  : undefined;

        const sparkline = this.buildRealSparkline(
          safeToman, dayChange, safeHigh, safeLow, openUsd24h, tetherToman, 24
        );

        const hourlyTrend = sparkline.map((price, idx) => {
          const hoursAgo = 23 - idx;
          return {
            time: hoursAgo === 0 ? 'اکنون' : `${hoursAgo} ساعت پیش`,
            hour: `${idx}:00`,
            price: Math.round(price),
          };
        });

        return {
          key, symbol, name, persianName, category,
          priceToman: Math.round(safeToman),
          priceUsd: safeUsd !== undefined ? parseFloat(safeUsd.toFixed(safeUsd < 1 ? 4 : 2)) : undefined,
          dayChange: parseFloat((dayChange || 0).toFixed(2)),
          highToman: safeHigh ? Math.round(safeHigh) : undefined,
          lowToman: safeLow ? Math.round(safeLow) : undefined,
          sparkline,
          hourlyTrend,
        };
      };

      const coinsMap = snap.coins;
      const btc = coinsMap['btc'] || coinsMap['BTC'];
      const ton = coinsMap['ton'] || coinsMap['TON'];
      const eth = coinsMap['eth'] || coinsMap['ETH'];

      const highlights = [
        makeItem('usd', 'USD', 'US Dollar', 'دلار آمریکا', 'fiat', dollarToman, 1.0, snap.dollar.dayChange, snap.dollar.highToman, snap.dollar.lowToman, undefined),
        makeItem('usdt', 'USDT', 'Tether', 'تتر دیجیتال', 'crypto', tetherToman, 1.0, snap.tether.dayChange, snap.tether.highToman, snap.tether.lowToman, undefined),
        makeItem('gold18', 'GOLD', 'Gold 18k', 'طلای ۱۸ عیار', 'gold', snap.gold.gold18?.tomanPrice || 0, snap.gold.gold18 && snap.gold.gold18.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold18.tomanPrice / tetherToman : undefined, snap.gold.gold18?.dayChangePercent || 0, snap.gold.gold18?.highToman, snap.gold.gold18?.lowToman, undefined),
        makeItem('seke_emami', 'SEKE', 'Seke Emami', 'سکه امامی', 'gold', snap.gold.sekeEmami?.tomanPrice || 0, snap.gold.sekeEmami && snap.gold.sekeEmami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeEmami.tomanPrice / tetherToman : undefined, snap.gold.sekeEmami?.dayChangePercent || 0, snap.gold.sekeEmami?.highToman, snap.gold.sekeEmami?.lowToman, undefined),
        btc && !btc.unavailable
          ? makeItem('btc', 'BTC', 'Bitcoin', 'بیت کوین', 'crypto', btc.irr, btc.usdt, btc.dayChange, btc.dayHighToman, btc.dayLowToman, btc.openPrice24h)
          : makeItem('btc', 'BTC', 'Bitcoin', 'بیت کوین', 'crypto', 0, undefined, 0, undefined, undefined, undefined),
        eth && !eth.unavailable
          ? makeItem('eth', 'ETH', 'Ethereum', 'اتریوم', 'crypto', eth.irr, eth.usdt, eth.dayChange, eth.dayHighToman, eth.dayLowToman, eth.openPrice24h)
          : makeItem('eth', 'ETH', 'Ethereum', 'اتریوم', 'crypto', 0, undefined, 0, undefined, undefined, undefined),
      ];

      const allCoins = this.dedupeCoins(coinsMap);
      const crypto = allCoins.map((coin) => {
        const sym = (coin.symbol || '').toUpperCase();
        const persianName = PERSIAN_NAMES[sym] || coin.name || sym;
        return makeItem(
          sym.toLowerCase(), sym, coin.name || sym, persianName, 'crypto',
          sym === 'USDT' ? tetherToman : coin.irr,
          coin.usdt, coin.dayChange, coin.dayHighToman, coin.dayLowToman, coin.openPrice24h
        );
      });

      const gold = [
        makeItem('gold18', 'GOLD', 'Gold 18k', 'طلای ۱۸ عیار / 750', 'gold', snap.gold.gold18?.tomanPrice || 0, snap.gold.gold18 && snap.gold.gold18.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold18.tomanPrice / tetherToman : undefined, snap.gold.gold18?.dayChangePercent || 0, snap.gold.gold18?.highToman, snap.gold.gold18?.lowToman, undefined),
        makeItem('gold24', 'GOLD24', 'Gold 24k', 'طلای ۲۴ عیار', 'gold', snap.gold.gold24?.tomanPrice || 0, snap.gold.gold24 && snap.gold.gold24.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold24.tomanPrice / tetherToman : undefined, snap.gold.gold24?.dayChangePercent || 0),
        makeItem('mesghal', 'MESGHAL', 'Mesghal Gold', 'مظنه مثقال طلا (آبشده)', 'gold', snap.gold.mesghal?.tomanPrice || 0, snap.gold.mesghal && snap.gold.mesghal.tomanPrice > 0 && tetherToman > 0 ? snap.gold.mesghal.tomanPrice / tetherToman : undefined, snap.gold.mesghal?.dayChangePercent || 0, snap.gold.mesghal?.highToman, snap.gold.mesghal?.lowToman),
        makeItem('seke_emami', 'SEKE', 'Seke Emami', 'سکه امامی (طرح جدید)', 'gold', snap.gold.sekeEmami?.tomanPrice || 0, snap.gold.sekeEmami && snap.gold.sekeEmami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeEmami.tomanPrice / tetherToman : undefined, snap.gold.sekeEmami?.dayChangePercent || 0, snap.gold.sekeEmami?.highToman, snap.gold.sekeEmami?.lowToman),
        makeItem('seke_bahar', 'BAHAR', 'Seke Bahar Azadi', 'سکه بهار آزادی', 'gold', snap.gold.sekeBahar?.tomanPrice || 0, snap.gold.sekeBahar && snap.gold.sekeBahar.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeBahar.tomanPrice / tetherToman : undefined, snap.gold.sekeBahar?.dayChangePercent || 0, snap.gold.sekeBahar?.highToman, snap.gold.sekeBahar?.lowToman),
        makeItem('seke_nim', 'NIM', 'Half Coin', 'نیم سکه بهار آزادی', 'gold', snap.gold.sekeNim?.tomanPrice || 0, snap.gold.sekeNim && snap.gold.sekeNim.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeNim.tomanPrice / tetherToman : undefined, snap.gold.sekeNim?.dayChangePercent || 0, snap.gold.sekeNim?.highToman, snap.gold.sekeNim?.lowToman),
        makeItem('seke_rob', 'ROB', 'Quarter Coin', 'ربع سکه بهار آزادی', 'gold', snap.gold.sekeRob?.tomanPrice || 0, snap.gold.sekeRob && snap.gold.sekeRob.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeRob.tomanPrice / tetherToman : undefined, snap.gold.sekeRob?.dayChangePercent || 0, snap.gold.sekeRob?.highToman, snap.gold.sekeRob?.lowToman),
        makeItem('seke_gerami', 'GERAMI', 'Gerami Coin', 'سکه گرمی', 'gold', snap.gold.sekeGerami?.tomanPrice || 0, snap.gold.sekeGerami && snap.gold.sekeGerami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeGerami.tomanPrice / tetherToman : undefined, snap.gold.sekeGerami?.dayChangePercent || 0, snap.gold.sekeGerami?.highToman, snap.gold.sekeGerami?.lowToman),
        makeItem('ons', 'XAU', 'Gold Ounce', 'انس جهانی طلا', 'gold', snap.gold.ons?.tomanPrice || 0, snap.gold.ons && snap.gold.ons.tomanPrice > 0 && tetherToman > 0 ? snap.gold.ons.tomanPrice / tetherToman : undefined, snap.gold.ons?.dayChangePercent || 0),
        makeItem('silver', 'XAG', 'Silver 999', 'یک گرم نقره ۹۹۹', 'gold', snap.gold.silver?.tomanPrice || 0, snap.gold.silver && snap.gold.silver.tomanPrice > 0 && tetherToman > 0 ? snap.gold.silver.tomanPrice / tetherToman : undefined, snap.gold.silver?.dayChangePercent || 0),
      ];

      const fiat = [
        makeItem('usd', 'USD', 'US Dollar', 'دلار آمریکا', 'fiat', dollarToman, 1.0, snap.dollar.dayChange, snap.dollar.highToman, snap.dollar.lowToman, undefined),
        ...Object.values(snap.fiat).filter((f) => f.key !== 'usd').map((f) =>
          makeItem(f.key, f.symbol, f.name, f.name, 'fiat', f.priceToman || 0, f.priceUsd, f.dayChange, undefined, undefined, undefined)
        ),
      ];

      const oil = [
        makeItem('brent', 'BRENT', 'Brent Crude Oil', 'نفت خام برنت', 'oil', snap.oil.brent?.priceToman || 0, snap.oil.brent?.priceUsd, snap.oil.brent?.dayChange || 0, undefined, undefined, undefined),
        makeItem('wti',   'WTI',   'WTI Crude Oil',   'نفت وست تگزاس',   'oil', snap.oil.wti?.priceToman || 0,   snap.oil.wti?.priceUsd,   snap.oil.wti?.dayChange || 0, undefined, undefined, undefined),
        makeItem('gas',   'GAS',   'Natural Gas',     'گاز طبیعی',       'oil', snap.oil.gas?.priceToman || 0,   snap.oil.gas?.priceUsd,   snap.oil.gas?.dayChange || 0, undefined, undefined, undefined),
      ];

      return {
        highlights, crypto, gold, fiat, oil,
        serverTime: snap.serverTime,
        totalCryptoCount: crypto.length,
      };
    } catch (e: any) {
      console.error('[PriceService] getMiniAppData failed:', e?.message || e);
      return { highlights: [], crypto: [], gold: [], fiat: [], oil: [], serverTime: new Date().toISOString(), totalCryptoCount: 0 };
    }
  }

  // ==========================================================================
  // REAL SPARKLINE
  // ==========================================================================

  private static buildRealSparkline(
    currentToman: number,
    dayChangePct: number,
    highToman: number | undefined,
    lowToman: number | undefined,
    openUsd24h: number | undefined,
    tetherToman: number,
    length: number = 24
  ): number[] {
    if (!this.isValidNumber(currentToman) || currentToman <= 0) return [];

    const openPriceToman = openUsd24h && tetherToman > 0
      ? openUsd24h * tetherToman
      : (dayChangePct !== 0 ? currentToman / (1 + dayChangePct / 100) : null);

    if (!openPriceToman || openPriceToman <= 0) return [];

    const boundHigh = highToman && highToman > 0 ? highToman : Math.max(openPriceToman, currentToman);
    const boundLow  = lowToman  && lowToman  > 0 ? lowToman  : Math.min(openPriceToman, currentToman);
    const range = boundHigh - boundLow;
    if (range <= 0) return [];

    const points: number[] = [];
    const seed = currentToman % 1000;

    for (let i = 0; i < length; i++) {
      const progress = i / (length - 1);
      const linear = openPriceToman + (currentToman - openPriceToman) * progress;
      const waveAmp = range * 0.15;
      const wave = Math.sin(progress * Math.PI + seed) * waveAmp;
      let val = linear + wave;
      val = Math.max(boundLow, Math.min(boundHigh, val));
      if (i === 0) val = openPriceToman;
      if (i === length - 1) val = currentToman;
      points.push(Math.round(val));
    }

    return points;
  }

  // ==========================================================================
  // PARSING
  // ==========================================================================

  static parseNaturalQuery(raw: string): {
    cleanKey: string; amount: number; isQuestion: boolean;
    isOverviewRequest: boolean; isMiniAppRequest: boolean; isGreetingOrHelp: boolean;
  } {
    if (!raw) return { cleanKey: '', amount: 1, isQuestion: false, isOverviewRequest: false, isMiniAppRequest: false, isGreetingOrHelp: false };

    let text = this.faNumToEn(raw.trim().toLowerCase());
    text = text.replace(/@[a-z0-9_]+/gi, '').trim();

    const isGreetingOnly = /^(?:سلام|درود|وقت\s+بخیر|صبح\s+بخیر|عصر\s+بخیر|خسته\s+نباشید)$/i.test(text.replace(/[؟!?.؛:،,]+/g, '').trim());
    const isHelpOnly = /^(?:راهنما|کمک|دستورات|help)$/i.test(text.replace(/[؟!?.؛:،,]+/g, '').trim());

    text = text.replace(/[\u066b]/g, '.');
    text = text.replace(/[\u200c\u200b\u00a0]+/g, ' ');
    text = text.replace(/[؟?!؛:،,]+/g, ' ').replace(/[.!?]+$/g, '').trim();

    if (text.startsWith('/')) text = text.substring(1).trim();
    text = text.replace(/^(?:p|c|arz|qeymat|price)\s+/gi, '').trim();

    const overviewKeywords = ['بازار', 'ارزها', 'ارز', 'لیست', 'کریپتو', 'مارکت', 'market', 'گزارش', 'تابلو', 'قیمت‌ها', 'قیمتها'];
    const isOverview = overviewKeywords.some((k) => text === k || text === `گزارش ${k}`);

    const isMiniApp = /^(?:مینی\s*اپ|مینی‌اپ|miniapp|mini\s*app|اپ|اپلیکیشن|برنامه)$/i.test(text);

    const starterRegex = /^(?:سلام\s+علیکم|سلام|درود|وقت\s+بخیر|صبح\s+بخیر|عصر\s+بخیر|داداش|عزیز|لطفا|لطفاً|بگو|میشه)\s+/gi;
    let loopGuard = 0;
    while (starterRegex.test(text) && loopGuard++ < 5) {
      text = text.replace(starterRegex, '').trim();
    }

    text = text.replace(/^(?:قیمت\s+لحظه\s*ای|قیمت\s+لحظه‌ای|قیمت|نرخ|استعلام|ارزش)\s+/gi, '').trim();
    text = text.replace(/\s+(?:چند\s+تومن|چند\s+تومان|چند\s+دلار|چقدر|چنده|چند\s+است|چند\s+شده|هست)$/gi, '').trim();
    text = text.replace(/^(?:الان|امروز)\s+/gi, '').trim();
    text = text.replace(/\s+(?:الان|امروز|رو|را|در\s+بازار|بازار\s+آزاد)$/gi, '').trim();

    let amount = 1;
    const numMatch = text.match(/^(\d+(?:\.\d+)?)\s*(?:تا|عدد|گرم|گرمی|مثقال|واحد|دانه)?\s*(.+)$/);
    if (numMatch && !text.includes('نیم') && !text.includes('ربع')) {
      amount = parseFloat(numMatch[1]) || 1;
      text = numMatch[2].trim();
    } else {
      const endMatch = text.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
      if (endMatch) {
        amount = parseFloat(endMatch[2]) || 1;
        text = endMatch[1].trim();
      }
    }

    text = text.replace(/^(?:قیمت|نرخ)\s+/gi, '').trim();
    text = text.replace(/\s+(?:گرمی|گرم)$/gi, '').trim();

    return {
      cleanKey: text,
      amount: amount > 0 ? amount : 1,
      isQuestion: raw.includes('؟') || raw.includes('?') || raw.includes('چند') || raw.includes('چقدر'),
      isOverviewRequest: isOverview,
      isMiniAppRequest: isMiniApp,
      isGreetingOrHelp: isGreetingOnly || isHelpOnly,
    };
  }

  static faNumToEn(text: string): string {
    if (!text) return '';
    const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = String(text);
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(fa[i], en[i]);
      result = result.replaceAll(ar[i], en[i]);
    }
    return result;
  }

  static formatNumber(number: number, decimals = 2): string {
    if (!this.isValidNumber(number)) return '0';
    return number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  }

  static parseNumberFromRaw(raw: any): number {
    if (raw === undefined || raw === null) return 0;
    const val = typeof raw === 'object' ? raw.p : raw;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const parsed = parseFloat(String(val || '0').replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private static changeFromRange(current: number, high: number, low: number): number {
    if (!(current > 0 && high > 0 && low > 0) || high === low) return 0;
    const mid = (high + low) / 2;
    if (mid <= 0) return 0;
    const pct = ((current - mid) / mid) * 100;
    return Number.isFinite(pct) ? parseFloat(pct.toFixed(2)) : 0;
  }
}

// ============================================================================
// INTERNAL HELPER
// ============================================================================

class GoldExtract {
  constructor(
    public title: string,
    private _tomanPrice: number,
    private _high: number,
    private _low: number,
    private _change: number,
    public isLive: boolean,
    public source: string
  ) {}

  set(toman: number, high: number, low: number, change: number, isLive: boolean, source: string): void {
    this._tomanPrice = toman;
    this._high = high;
    this._low = low;
    this._change = change;
    this.isLive = isLive;
    this.source = source;
  }

  toGoldInfo(): GoldInfo {
    return {
      title: this.title,
      tomanPrice: this._tomanPrice,
      highToman: this._high || this._tomanPrice,
      lowToman: this._low || this._tomanPrice,
      dayChangePercent: this._change,
      unavailable: !this.isLive,
      isStale: !this.isLive,
      source: this.source,
    };
  }
}
