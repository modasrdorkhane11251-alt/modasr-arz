import { BotStorage } from './storage';
import { MANUAL_ALIASES } from './config';

// ============================================================================
// PRICE SERVICE — Production-grade market data pipeline
// ============================================================================
//
// Unit conventions (VERIFIED from legacy PHP code):
//   - FastCreat crypto  `irr` field  = TOMAN directly (no division)
//   - FastCreat gold    `price[0]`   = RIAL  (divide by 10)
//   - TGJU              `p` field    = RIAL  (divide by 10)
//   - Nobitex `*-rls`   `latest`     = RIAL  (divide by 10)
// ============================================================================

const RIALS_PER_TOMAN = 10;
const CACHE_TTL_MS = 5_000;
const LIVE_TICKER_INTERVAL_MS = 15_000;
const FETCH_TIMEOUT_MS = 3_500;
const STALE_THRESHOLD_MS = 5 * 60_000;

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

  private static async fetchJson(
    url: string,
    timeoutMs: number = FETCH_TIMEOUT_MS
  ): Promise<{ data: any; error?: string; status?: number }> {
    if (!url) return { data: null, error: 'empty url' };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
      }).catch((err) => {
        clearTimeout(timer);
        throw err;
      });

      clearTimeout(timer);

      if (!res.ok) return { data: null, error: `HTTP ${res.status}`, status: res.status };

      const data = await res.json().catch(() => null);
      if (data === null) return { data: null, error: 'invalid JSON' };
      return { data };
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : (e?.message || String(e));
      return { data: null, error: msg };
    }
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
  // MAIN SNAPSHOT
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
    const fetchStart = Date.now();
    const errors: string[] = [];
    const unavailable: string[] = [];

    const hubConfig = BotStorage.getApiHubConfig();
    const goldUrl = hubConfig?.priceBoard?.goldApiUrl || '';
    const cryptoUrl = hubConfig?.priceBoard?.cryptoApiUrl || '';

    // Fetch both providers in parallel
    const [goldRes, cryptoRes] = await Promise.all([
      goldUrl ? this.fetchJson(goldUrl, FETCH_TIMEOUT_MS) : Promise.resolve({ data: null, error: 'no url' }),
      cryptoUrl ? this.fetchJson(cryptoUrl, FETCH_TIMEOUT_MS) : Promise.resolve({ data: null, error: 'no url' }),
    ]);

    if (goldRes.data) this.markProviderSuccess('gold'); else this.markProviderFailure('gold', goldRes.error || 'unknown');
    if (cryptoRes.data) this.markProviderSuccess('crypto'); else this.markProviderFailure('crypto', cryptoRes.error || 'unknown');

    if (!goldRes.data) errors.push(`gold: ${goldRes.error}`);
    if (!cryptoRes.data) errors.push(`crypto: ${cryptoRes.error}`);

    // Extract
    const tetherData = this.extractTether(cryptoRes.data);
    if (!tetherData.isLive) unavailable.push('usdt');

    const dollarData = this.extractDollar(goldRes.data);
    if (!dollarData.isLive) unavailable.push('usd');

    const goldBundle = this.extractGold(goldRes.data);
    if (!goldBundle.gold18.isLive) unavailable.push('gold18');
    if (!goldBundle.sekeEmami.isLive) unavailable.push('sekeEmami');

    const coins = this.extractCoins(cryptoRes.data, tetherData.toman);
    const fiat = this.extractFiat(dollarData.toman, dollarData.isLive);
    const oil = this.extractOil(goldRes.data);

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

    // Always update the snapshot — even if partially unavailable, some assets have valid data
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

  /**
   * Tether extraction from FastCreat Nobitex.
   * IMPORTANT: FastCreat's `irr` field is ALREADY in Toman (despite the name).
   */
  private static extractTether(cryptoData: any): {
    toman: number; dayChange: number; highToman: number; lowToman: number;
    source: string; isLive: boolean;
  } {
    const result = cryptoData?.result;

    // FastCreat format: { result: { USDT: { irr: 267999, usdt: 1, dayChange: 1.2 } } }
    const usdt = result?.USDT || result?.usdt;
    if (usdt?.irr) {
      const pToman = parseFloat(String(usdt.irr));   // already Toman
      if (this.isValidTetherPrice(pToman)) {
        const ch = parseFloat(String(usdt.dayChange || '0')) || 0;
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

    // Fallback: Nobitex raw stats: { stats: { 'usdt-rls': { latest: 2679990 } } }
    const stats = cryptoData?.stats;
    if (stats?.['usdt-rls']?.latest) {
      const pRials = parseFloat(stats['usdt-rls'].latest);
      const pToman = Math.round(pRials / RIALS_PER_TOMAN);
      if (this.isValidTetherPrice(pToman)) {
        const ch = parseFloat(stats['usdt-rls'].dayChange || '0') || 0;
        return {
          toman: pToman,
          dayChange: ch,
          highToman: Math.round(pToman * 1.005),
          lowToman: Math.round(pToman * 0.995),
          source: 'nobitex_raw',
          isLive: true,
        };
      }
    }

    return { toman: 0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', isLive: false };
  }

  /**
   * Dollar extraction from TGJU (independent from tether).
   * TGJU `p` values are RIAL → divide by 10.
   */
  private static extractDollar(goldData: any): {
    toman: number; dayChange: number; highToman: number; lowToman: number;
    source: string; isLive: boolean;
  } {
    const current = goldData?.current || goldData?.data?.current;
    const field = current?.price_dollar_rl;

    if (field?.p) {
      const pRials = this.parseNumberFromRaw(field.p);
      const pToman = Math.round(pRials / RIALS_PER_TOMAN);
      if (this.isValidTetherPrice(pToman)) {
        const dp = parseFloat(String(field.dp || field.d || '0')) || 0;
        const high = this.parseNumberFromRaw(field.h);
        const low = this.parseNumberFromRaw(field.l);
        return {
          toman: pToman,
          dayChange: dp,
          highToman: high > 0 ? Math.round(high / RIALS_PER_TOMAN) : Math.round(pToman * 1.01),
          lowToman: low > 0 ? Math.round(low / RIALS_PER_TOMAN) : Math.round(pToman * 0.99),
          source: 'tgju',
          isLive: true,
        };
      }
    }

    return { toman: 0, dayChange: 0, highToman: 0, lowToman: 0, source: 'unavailable', isLive: false };
  }

  /**
   * Gold & coins extraction.
   * FastCreat gold `price[0]` is RIAL → divide by 10.
   * TGJU gold `p` is RIAL → divide by 10.
   */
  private static extractGold(goldData: any): {
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

    // --- FastCreat gold: { result: [{ title, price: ["rials", "(+1.2%)"], highest, lowest }] } ---
    const arr = goldData?.result;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (!item?.title) continue;
        const title = String(item.title);
        const pRials = parseInt(String(item.price?.[0] || '0').replace(/[^0-9]/g, ''), 10);
        if (!pRials) continue;
        const pToman = Math.round(pRials / RIALS_PER_TOMAN);

        const chMatch = String(item.price?.[1] || '').match(/\(([+-]?\d+(?:\.\d+)?)%\)/);
        const ch = chMatch ? parseFloat(chMatch[1]) : 0;

        const highR = parseInt(String(item.highest || '0').replace(/[^0-9]/g, ''), 10);
        const lowR  = parseInt(String(item.lowest  || '0').replace(/[^0-9]/g, ''), 10);
        const highT = highR > 0 ? Math.round(highR / RIALS_PER_TOMAN) : 0;
        const lowT  = lowR  > 0 ? Math.round(lowR  / RIALS_PER_TOMAN) : 0;

        // Match titles — FastCreat uses different variants for each
        if ((title.includes('18 عیار') || title.includes('۱۸ عیار')) && this.isValidGold18Price(pToman)) {
          g18.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('24 عیار') || title.includes('۲۴ عیار')) {
          g24.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('مثقال')) {
          mes.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('امامی')) {
          skE.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('بهار')) {
          skB.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('نیم')) {
          skN.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('ربع')) {
          skR.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('گرمی')) {
          skG.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('نقره')) {
          silv.set(pToman, highT, lowT, ch, true, 'fast_creat');
        } else if (title.includes('انس')) {
          // ONS may be in USD not Rial — handle separately if needed
        }
      }
    }

    // --- TGJU fallback: current.<field>.p in RIAL ---
    const current = goldData?.current || goldData?.data?.current;
    if (current) {
      const tg = (key: string, target: GoldExtract) => {
        const f = current[key];
        if (!f?.p) return;
        const pToman = Math.round(this.parseNumberFromRaw(f.p) / RIALS_PER_TOMAN);
        const high = Math.round(this.parseNumberFromRaw(f.h) / RIALS_PER_TOMAN);
        const low  = Math.round(this.parseNumberFromRaw(f.l) / RIALS_PER_TOMAN);
        const ch = parseFloat(String(f.dp || f.d || '0')) || 0;
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
      // ONS on TGJU is in USD — different scale
      const onsField = current['ons'];
      if (onsField?.p) {
        const usdPrice = this.parseNumberFromRaw(onsField.p);
        if (usdPrice > 100) {
          const ch = parseFloat(String(onsField.dp || onsField.d || '0')) || 0;
          // Store as USD directly (tomanPrice field holds USD for ONS for compat)
          ons.set(Math.round(usdPrice), 0, 0, ch, true, 'tgju');
        }
      }
    }

    return {
      gold18: g18, gold24: g24, mesghal: mes,
      sekeEmami: skE, sekeBahar: skB, sekeNim: skN, sekeRob: skR, sekeGerami: skG,
      silver: silv, ons: ons,
    };
  }

  /**
   * Coins extraction from FastCreat Nobitex.
   * CRITICAL: `irr` field is TOMAN (verified from legacy PHP code) → no division.
   */
  private static extractCoins(
    cryptoData: any,
    tetherToman: number
  ): Record<string, CoinInfo> {
    const coins: Record<string, CoinInfo> = {};
    const result = cryptoData?.result;

    if (result && typeof result === 'object') {
      for (const [symKey, item] of Object.entries(result)) {
        if (symKey.toUpperCase() === 'USDT') continue;
        const it: any = item;
        if (!it || typeof it !== 'object') continue;

        const sym = symKey.toUpperCase();
        // `irr` is TOMAN (not Rial, despite the name)
        const toman = parseFloat(String(it.irr || '0'));
        const usdt = parseFloat(String(it.usdt || '0'));
        const dayCh = parseFloat(String(it.dayChange || '0')) || 0;

        if (toman > 0 || usdt > 0) {
          const finalToman = toman > 0 ? Math.round(toman)
            : (tetherToman > 0 ? Math.round(usdt * tetherToman) : 0);
          const finalUsd = usdt > 0 ? usdt
            : (tetherToman > 0 ? parseFloat((finalToman / tetherToman).toFixed(6)) : 0);

          if (finalToman > 0 || finalUsd > 0) {
            const coin: CoinInfo = {
              name: it.name || sym,
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

    // Add tether itself
    if (tetherToman > 0) {
      const usdt: CoinInfo = {
        name: 'تتر دیجیتال',
        symbol: 'USDT',
        usdt: 1.0,
        irr: tetherToman,
        dayChange: 0,
        source: 'fast_creat',
      };
      coins['usdt'] = usdt;
      coins['tether'] = usdt;
      coins['USDT'] = usdt;
    }

    // Manual aliases
    for (const [alias, standard] of Object.entries(MANUAL_ALIASES)) {
      const std = standard.toLowerCase();
      if (coins[std]) coins[alias.toLowerCase()] = coins[std];
    }

    return coins;
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

  private static extractOil(goldData: any): Record<string, AssetInfo> {
    const current = goldData?.current || goldData?.data?.current;
    const out: Record<string, AssetInfo> = {};

    const makeOil = (key: string, name: string, symbol: string, fieldKey: string): AssetInfo => {
      const f = current?.[fieldKey];
      if (f?.p) {
        const usd = this.parseNumberFromRaw(f.p);
        const ch = parseFloat(String(f.dp || f.d || '0')) || 0;
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

    // Oil
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

    // Gold / Silver / Coins
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

    // Fiat
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

    // Crypto
    const coins = snap.coins;
    const coin = coins[aliasKey] || coins[clean] || coins[fiatKey];
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
    const coins = snap.coins;

    const pick = (key: string, name: string, symbol: string): AssetInfo => {
      const c = coins[key] || coins[symbol.toUpperCase()];
      if (!c || c.unavailable) {
        return { key, name, symbol, category: 'crypto', dayChange: 0, unavailable: true };
      }
      return { key, name, symbol, category: 'crypto', priceUsd: c.usdt, priceToman: c.irr, dayChange: c.dayChange };
    };

    return [
      pick('btc', 'Bitcoin',   'BTC'),
      pick('eth', 'Ethereum',  'ETH'),
      pick('sol', 'Solana',    'SOL'),
      pick('ton', 'Toncoin',   'TON'),
      pick('ltc', 'Litecoin',  'LTC'),
      pick('doge', 'Dogecoin', 'DOGE'),
      pick('xrp', 'XRP',       'XRP'),
      pick('bnb', 'BNB',       'BNB'),
      pick('trx', 'Tron',      'TRX'),
    ];
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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${cleanSym}USDT&interval=2h&limit=84`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= 20) {
            const points = data.map((c: any) => parseFloat(c[4]));
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
        }
      } catch (e: any) {
        console.warn(`[PriceService] binance klines for ${cleanSym} failed: ${e?.message || e}`);
      } finally {
        clearTimeout(timer);
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
  }> {
    try {
      const snap = await this.getUnifiedMarketSnapshot();
      const dollarToman = snap.dollar.toman;
      const tetherToman = snap.tether.toman;
      const coins = snap.coins;

      const makeItem = (
        key: string, symbol: string, name: string, persianName: string,
        category: 'crypto' | 'gold' | 'fiat' | 'oil',
        priceToman: number, priceUsd: number | undefined, dayChange: number,
        highToman?: number, lowToman?: number
      ) => {
        const safeToman = priceToman > 0 ? priceToman : 0;
        const safeUsd = priceUsd && priceUsd > 0 ? priceUsd : undefined;
        const sparkline = this.generateSparklinePoints(safeToman || (safeUsd ? safeUsd * dollarToman : 1), dayChange, 24);
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
          highToman: highToman ? Math.round(highToman) : undefined,
          lowToman: lowToman ? Math.round(lowToman) : undefined,
          sparkline, hourlyTrend,
        };
      };

      const btc = coins['btc'];
      const ton = coins['ton'];
      const highlights = [
        makeItem('usd', 'USD', 'US Dollar', 'دلار آمریکا', 'fiat', dollarToman, 1.0, snap.dollar.dayChange, snap.dollar.highToman, snap.dollar.lowToman),
        makeItem('usdt', 'USDT', 'Tether', 'تتر دیجیتال', 'crypto', tetherToman, 1.0, snap.tether.dayChange, snap.tether.highToman, snap.tether.lowToman),
        makeItem('gold18', 'GOLD', 'Gold 18k', 'طلای ۱۸ عیار', 'gold', snap.gold.gold18.tomanPrice, snap.gold.gold18.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold18.tomanPrice / tetherToman : undefined, snap.gold.gold18.dayChangePercent, snap.gold.gold18.highToman, snap.gold.gold18.lowToman),
        makeItem('seke_emami', 'SEKE', 'Seke Emami', 'سکه امامی', 'gold', snap.gold.sekeEmami.tomanPrice, snap.gold.sekeEmami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeEmami.tomanPrice / tetherToman : undefined, snap.gold.sekeEmami.dayChangePercent, snap.gold.sekeEmami.highToman, snap.gold.sekeEmami.lowToman),
        btc && !btc.unavailable
          ? makeItem('btc', 'BTC', 'Bitcoin', 'بیت کوین', 'crypto', btc.irr, btc.usdt, btc.dayChange, btc.dayHighToman, btc.dayLowToman)
          : makeItem('btc', 'BTC', 'Bitcoin', 'بیت کوین', 'crypto', 0, undefined, 0),
        ton && !ton.unavailable
          ? makeItem('ton', 'TON', 'Toncoin', 'تون کوین', 'crypto', ton.irr, ton.usdt, ton.dayChange, ton.dayHighToman, ton.dayLowToman)
          : makeItem('ton', 'TON', 'Toncoin', 'تون کوین', 'crypto', 0, undefined, 0),
      ];

      const cryptoKeys: Array<{ key: string; name: string; fa: string }> = [
        { key: 'btc', name: 'Bitcoin', fa: 'بیت کوین' },
        { key: 'eth', name: 'Ethereum', fa: 'اتریوم' },
        { key: 'usdt', name: 'Tether', fa: 'تتر دیجیتال' },
        { key: 'ton', name: 'Toncoin', fa: 'تون کوین' },
        { key: 'sol', name: 'Solana', fa: 'سولانا' },
        { key: 'bnb', name: 'BNB', fa: 'بایننس کوین' },
        { key: 'trx', name: 'Tron', fa: 'ترون' },
        { key: 'doge', name: 'Dogecoin', fa: 'دوج کوین' },
        { key: 'xrp', name: 'Ripple', fa: 'ریپل' },
        { key: 'ada', name: 'Cardano', fa: 'کاردانو' },
        { key: 'shib', name: 'Shiba Inu', fa: 'شیبا اینو' },
        { key: 'pepe', name: 'Pepe', fa: 'پپه' },
        { key: 'not', name: 'Notcoin', fa: 'نات کوین' },
        { key: 'ltc', name: 'Litecoin', fa: 'لایت کوین' },
        { key: 'bch', name: 'Bitcoin Cash', fa: 'بیت کوین کش' },
        { key: 'avax', name: 'Avalanche', fa: 'اولنچ' },
        { key: 'link', name: 'Chainlink', fa: 'چین لینک' },
        { key: 'sui', name: 'Sui', fa: 'سویی' },
        { key: 'near', name: 'Near Protocol', fa: 'نیر پروتکل' },
      ];

      const crypto = cryptoKeys.map((c) => {
        const coin = coins[c.key];
        if (!coin || coin.unavailable) {
          return makeItem(c.key, c.key.toUpperCase(), c.name, c.fa, 'crypto', 0, undefined, 0);
        }
        return makeItem(
          c.key, c.key.toUpperCase(), c.name, c.fa, 'crypto',
          c.key === 'usdt' ? tetherToman : coin.irr,
          coin.usdt, coin.dayChange, coin.dayHighToman, coin.dayLowToman
        );
      });

      const gold = [
        makeItem('gold18', 'GOLD', 'Gold 18k', 'طلای ۱۸ عیار / 750', 'gold', snap.gold.gold18.tomanPrice, snap.gold.gold18.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold18.tomanPrice / tetherToman : undefined, snap.gold.gold18.dayChangePercent, snap.gold.gold18.highToman, snap.gold.gold18.lowToman),
        makeItem('gold24', 'GOLD24', 'Gold 24k', 'طلای ۲۴ عیار', 'gold', snap.gold.gold24.tomanPrice, snap.gold.gold24.tomanPrice > 0 && tetherToman > 0 ? snap.gold.gold24.tomanPrice / tetherToman : undefined, snap.gold.gold24.dayChangePercent),
        makeItem('mesghal', 'MESGHAL', 'Mesghal Gold', 'مظنه مثقال طلا (آبشده)', 'gold', snap.gold.mesghal.tomanPrice, snap.gold.mesghal.tomanPrice > 0 && tetherToman > 0 ? snap.gold.mesghal.tomanPrice / tetherToman : undefined, snap.gold.mesghal.dayChangePercent, snap.gold.mesghal.highToman, snap.gold.mesghal.lowToman),
        makeItem('seke_emami', 'SEKE', 'Seke Emami', 'سکه امامی (طرح جدید)', 'gold', snap.gold.sekeEmami.tomanPrice, snap.gold.sekeEmami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeEmami.tomanPrice / tetherToman : undefined, snap.gold.sekeEmami.dayChangePercent, snap.gold.sekeEmami.highToman, snap.gold.sekeEmami.lowToman),
        makeItem('seke_bahar', 'BAHAR', 'Seke Bahar Azadi', 'سکه بهار آزادی (طرح قدیم)', 'gold', snap.gold.sekeBahar.tomanPrice, snap.gold.sekeBahar.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeBahar.tomanPrice / tetherToman : undefined, snap.gold.sekeBahar.dayChangePercent, snap.gold.sekeBahar.highToman, snap.gold.sekeBahar.lowToman),
        makeItem('seke_nim', 'NIM', 'Half Coin', 'نیم سکه بهار آزادی', 'gold', snap.gold.sekeNim.tomanPrice, snap.gold.sekeNim.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeNim.tomanPrice / tetherToman : undefined, snap.gold.sekeNim.dayChangePercent, snap.gold.sekeNim.highToman, snap.gold.sekeNim.lowToman),
        makeItem('seke_rob', 'ROB', 'Quarter Coin', 'ربع سکه بهار آزادی', 'gold', snap.gold.sekeRob.tomanPrice, snap.gold.sekeRob.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeRob.tomanPrice / tetherToman : undefined, snap.gold.sekeRob.dayChangePercent, snap.gold.sekeRob.highToman, snap.gold.sekeRob.lowToman),
        makeItem('seke_gerami', 'GERAMI', 'Gerami Coin', 'سکه گرمی', 'gold', snap.gold.sekeGerami.tomanPrice, snap.gold.sekeGerami.tomanPrice > 0 && tetherToman > 0 ? snap.gold.sekeGerami.tomanPrice / tetherToman : undefined, snap.gold.sekeGerami.dayChangePercent, snap.gold.sekeGerami.highToman, snap.gold.sekeGerami.lowToman),
        makeItem('ons', 'XAU', 'Gold Ounce', 'انس جهانی طلا', 'gold', snap.gold.ons.tomanPrice, snap.gold.ons.tomanPrice > 0 && tetherToman > 0 ? snap.gold.ons.tomanPrice / tetherToman : undefined, snap.gold.ons.dayChangePercent),
        makeItem('silver', 'XAG', 'Silver 999', 'یک گرم نقره ۹۹۹', 'gold', snap.gold.silver.tomanPrice, snap.gold.silver.tomanPrice > 0 && tetherToman > 0 ? snap.gold.silver.tomanPrice / tetherToman : undefined, snap.gold.silver.dayChangePercent),
      ];

      const fiat = [
        makeItem('usd', 'USD', 'US Dollar', 'دلار آمریکا', 'fiat', dollarToman, 1.0, snap.dollar.dayChange, snap.dollar.highToman, snap.dollar.lowToman),
        ...Object.values(snap.fiat).filter((f) => f.key !== 'usd').map((f) =>
          makeItem(f.key, f.symbol, f.name, f.name, 'fiat', f.priceToman || 0, f.priceUsd, f.dayChange)
        ),
      ];

      const oil = [
        makeItem('brent', 'BRENT', 'Brent Crude Oil', 'نفت خام برنت', 'oil', snap.oil.brent?.priceToman || 0, snap.oil.brent?.priceUsd, snap.oil.brent?.dayChange || 0),
        makeItem('wti',   'WTI',   'WTI Crude Oil',   'نفت وست تگزاس',   'oil', snap.oil.wti?.priceToman || 0,   snap.oil.wti?.priceUsd,   snap.oil.wti?.dayChange || 0),
        makeItem('gas',   'GAS',   'Natural Gas',     'گاز طبیعی',       'oil', snap.oil.gas?.priceToman || 0,   snap.oil.gas?.priceUsd,   snap.oil.gas?.dayChange || 0),
      ];

      return { highlights, crypto, gold, fiat, oil, serverTime: snap.serverTime };
    } catch (e: any) {
      console.error('[PriceService] getMiniAppData failed:', e?.message || e);
      return { highlights: [], crypto: [], gold: [], fiat: [], oil: [], serverTime: new Date().toISOString() };
    }
  }

  // ==========================================================================
  // SPARKLINE
  // ==========================================================================

  static generateSparklinePoints(basePrice: number, changePercent: number, length: number = 24): number[] {
    if (!this.isValidNumber(basePrice) || basePrice <= 0) return [];
    const points: number[] = [];
    const trend = (changePercent || 0) / 100;
    const startPrice = basePrice / (1 + trend);
    const range = Math.abs(basePrice - startPrice) || basePrice * 0.02;

    for (let i = 0; i < length; i++) {
      const progress = i / (length - 1);
      const linear = startPrice + (basePrice - startPrice) * progress;
      const noise = (Math.sin(i * 0.75) * 0.35 + Math.cos(i * 1.35) * 0.25) * range * 0.45;
      const val = i === length - 1 ? basePrice : Math.max(0, linear + noise);
      points.push(parseFloat(val.toFixed(2)));
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
