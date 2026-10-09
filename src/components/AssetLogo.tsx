import React, { useState, useEffect, useMemo } from 'react';

interface AssetLogoProps {
  symbol: string;
  category?: 'crypto' | 'gold' | 'fiat' | 'oil' | 'commodity' | string;
  size?: number;
  className?: string;
}

// Known CoinGecko image URLs (fast path — no API call needed)
const COINGECKO_MAP: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  POL: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  XLM: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  ETC: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
  ALGO: 'https://assets.coingecko.com/coins/images/4380/large/download.png',
  VET: 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png',
  ICP: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  HBAR: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  S: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  APT: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png',
  OP: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  INJ: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  TIA: 'https://assets.coingecko.com/coins/images/31967/large/tia.png',
  SEI: 'https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  RENDER: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  RNDR: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  KAS: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
  IMX: 'https://assets.coingecko.com/coins/images/17233/large/imx.png',
  LDO: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.png',
  NOT: 'https://assets.coingecko.com/coins/images/37854/large/notcoin.png',
  WIF: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg',
  BONK: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
  FLOKI: 'https://assets.coingecko.com/coins/images/16746/large/FLOKI.png',
  MEME: 'https://assets.coingecko.com/coins/images/32526/large/meme.png',
  BOME: 'https://assets.coingecko.com/coins/images/36071/large/bome.png',
  HMSTR: 'https://assets.coingecko.com/coins/images/39173/large/HMSTR_128px.png',
  DOGS: 'https://assets.coingecko.com/coins/images/38827/large/dogs.jpg',
  CATI: 'https://assets.coingecko.com/coins/images/39451/large/cati.png',
  MAJOR: 'https://assets.coingecko.com/coins/images/39677/large/MAJOR.jpg',
  WLD: 'https://assets.coingecko.com/coins/images/31062/large/worldcoin.png',
  FET: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  JUP: 'https://assets.coingecko.com/coins/images/34188/large/jup.png',
  PYTH: 'https://assets.coingecko.com/coins/images/32924/large/pyth.png',
  PENDLE: 'https://assets.coingecko.com/coins/images/15069/large/pendle.png',
  ONDO: 'https://assets.coingecko.com/coins/images/34582/large/ondo.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
  TUSD: 'https://assets.coingecko.com/coins/images/3449/large/tusd.png',
  BUSD: 'https://assets.coingecko.com/coins/images/9576/large/BUSD.png',
  FDUSD: 'https://assets.coingecko.com/coins/images/31079/large/FDUSD_icon_black.png',
  WBTC: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  STETH: 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  MKR: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  COMP: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png',
  SNX: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
  CRV: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  SUSHI: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  YFI: 'https://assets.coingecko.com/coins/images/11849/large/yearn.jpg',
  '1INCH': 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png',
  ENS: 'https://assets.coingecko.com/coins/images/19785/large/acatxTm8_400x400.jpg',
  GRT: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  BAT: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png',
  MANA: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
  SAND: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  AXS: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  GALA: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png',
  CHZ: 'https://assets.coingecko.com/coins/images/8834/large/Chiliz.png',
  ENJ: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png',
  LRC: 'https://assets.coingecko.com/coins/images/913/large/LRC.png',
  BAL: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png',
  ROSE: 'https://assets.coingecko.com/coins/images/13162/large/oasis.png',
  KSM: 'https://assets.coingecko.com/coins/images/9568/large/m4zRhP5e_400x400.jpg',
  ZEC: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  DASH: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  EOS: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  NEO: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  IOTA: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  QTUM: 'https://assets.coingecko.com/coins/images/684/large/qtum.png',
  WAVES: 'https://assets.coingecko.com/coins/images/425/large/waves.png',
  ICX: 'https://assets.coingecko.com/coins/images/1060/large/icon-icx-logo.png',
  THETA: 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png',
  FLOW: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55d1c499f_flow-token.png',
  CFX: 'https://assets.coingecko.com/coins/images/13079/large/3.png',
  KAVA: 'https://assets.coingecko.com/coins/images/9761/large/KAVA.png',
  GMT: 'https://assets.coingecko.com/coins/images/23597/large/token-gmt-200x200.png',
  APE: 'https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg',
  QNT: 'https://assets.coingecko.com/coins/images/3370/large/5sn977.png',
  MASK: 'https://assets.coingecko.com/coins/images/14051/large/Mask_Network.jpg',
  DYDX: 'https://assets.coingecko.com/coins/images/17500/large/hjnIm9bV.jpg',
  LPT: 'https://assets.coingecko.com/coins/images/7137/large/logo-circle-green.png',
  API3: 'https://assets.coingecko.com/coins/images/13256/large/api3.jpg',
  GLM: 'https://assets.coingecko.com/coins/images/542/large/Golem_Submark_Positive_RGB.png',
  STORJ: 'https://assets.coingecko.com/coins/images/949/large/storj.png',
  ZRX: 'https://assets.coingecko.com/coins/images/863/large/0x.png',
  CVC: 'https://assets.coingecko.com/coins/images/788/large/civic.png',
  NMR: 'https://assets.coingecko.com/coins/images/752/large/numeraire.png',
  SNT: 'https://assets.coingecko.com/coins/images/779/large/status.png',
  ANT: 'https://assets.coingecko.com/coins/images/681/large/Aragon_token_logo_v3_1400x1400.png',
  SLP: 'https://assets.coingecko.com/coins/images/10333/large/smooth-love-potion.png',
  EGLD: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png',
  BLUR: 'https://assets.coingecko.com/coins/images/28453/large/blur.png',
  T: 'https://assets.coingecko.com/coins/images/39783/large/T.jpg',
  CELR: 'https://assets.coingecko.com/coins/images/4379/large/Celr.png',
  MAGIC: 'https://assets.coingecko.com/coins/images/18623/large/magic.png',
  GMX: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png',
  BAND: 'https://assets.coingecko.com/coins/images/9545/large/Band_token_blue_violet_token.png',
  CVX: 'https://assets.coingecko.com/coins/images/15585/large/convex.png',
  SSV: 'https://assets.coingecko.com/coins/images/19155/large/ssv.png',
  MDT: 'https://assets.coingecko.com/coins/images/24427/large/mdt_logo.png',
  OMG: 'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg',
  RDNT: 'https://assets.coingecko.com/coins/images/26536/large/Radiant-Logo-200x200.png',
  JST: 'https://assets.coingecko.com/coins/images/11095/large/JUST_icon.png',
  BICO: 'https://assets.coingecko.com/coins/images/22162/large/Biconomy.png',
  WOO: 'https://assets.coingecko.com/coins/images/12921/large/w2UiemF__400x400.jpg',
  SKL: 'https://assets.coingecko.com/coins/images/13245/large/SKALE_token_300x300.png',
  GAL: 'https://assets.coingecko.com/coins/images/24530/large/gal.png',
  AGIX: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png',
  XMR: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  XTZ: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png',
  RUNE: 'https://assets.coingecko.com/coins/images/6595/large/Rune200x200.png',
  ONE: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png',
  CRO: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png',
  OKB: 'https://assets.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png',
  LEO: 'https://assets.coingecko.com/coins/images/8418/large/leo-token.png',
  HT: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png',
  KCS: 'https://assets.coingecko.com/coins/images/1047/large/sa9z79.png',
  GT: 'https://assets.coingecko.com/coins/images/8183/large/gt.png',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_animated.png',
};

// Fiat currency flags
const FIAT_FLAG_MAP: Record<string, string> = {
  USD: 'https://flagcdn.com/w80/us.png',
  DOLLAR: 'https://flagcdn.com/w80/us.png',
  EUR: 'https://flagcdn.com/w80/eu.png',
  EURO: 'https://flagcdn.com/w80/eu.png',
  AED: 'https://flagcdn.com/w80/ae.png',
  DIRHAM: 'https://flagcdn.com/w80/ae.png',
  GBP: 'https://flagcdn.com/w80/gb.png',
  POUND: 'https://flagcdn.com/w80/gb.png',
  TRY: 'https://flagcdn.com/w80/tr.png',
  LIRA: 'https://flagcdn.com/w80/tr.png',
  CNY: 'https://flagcdn.com/w80/cn.png',
  YUAN: 'https://flagcdn.com/w80/cn.png',
  CAD: 'https://flagcdn.com/w80/ca.png',
  AUD: 'https://flagcdn.com/w80/au.png',
  CHF: 'https://flagcdn.com/w80/ch.png',
  JPY: 'https://flagcdn.com/w80/jp.png',
  INR: 'https://flagcdn.com/w80/in.png',
  RUB: 'https://flagcdn.com/w80/ru.png',
  KWD: 'https://flagcdn.com/w80/kw.png',
  SAR: 'https://flagcdn.com/w80/sa.png',
  QAR: 'https://flagcdn.com/w80/qa.png',
  OMR: 'https://flagcdn.com/w80/om.png',
  BHD: 'https://flagcdn.com/w80/bh.png',
  IQD: 'https://flagcdn.com/w80/iq.png',
};

export const AssetLogo: React.FC<AssetLogoProps> = ({
  symbol,
  category = 'crypto',
  size = 36,
  className = '',
}) => {
  const rawSym = (symbol || '').toUpperCase().trim();
  const symLower = rawSym.replace(/[^A-Z0-9_]/g, '').toLowerCase();
  const symUpper = symLower.toUpperCase();

  const [cdnIndex, setCdnIndex] = useState<number>(0);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState<boolean>(false);

  // Detect special asset types
  const isGoldOrCoin =
    symUpper.includes('SEKE') ||
    symUpper.includes('EMAMI') ||
    symUpper.includes('BAHAR') ||
    symUpper.includes('NIM') ||
    symUpper.includes('ROB') ||
    symUpper.includes('GERAMI') ||
    symUpper.includes('GOLD') ||
    symUpper.includes('MESGHAL') ||
    symUpper.includes('MAZANEH') ||
    symUpper.includes('ONS') ||
    symUpper === 'XAU' ||
    category === 'gold';

  const isOil =
    category === 'oil' ||
    symUpper.startsWith('OIL') ||
    symUpper === 'BRENT' ||
    symUpper === 'WTI' ||
    symUpper === 'GAS';

  const isSilver = symUpper === 'SILVER' || symUpper === 'XAG';

  // Candidate URLs to try in order
  const candidateUrls: string[] = useMemo(() => {
    if (isGoldOrCoin || isOil || isSilver) return [];

    if (category === 'fiat' || FIAT_FLAG_MAP[symUpper]) {
      return [FIAT_FLAG_MAP[symUpper] || `https://flagcdn.com/w80/${symLower.slice(0, 2)}.png`];
    }

    const urls: string[] = [];

    // 1. Known CoinGecko URL (fastest, best quality)
    if (COINGECKO_MAP[symUpper]) {
      urls.push(COINGECKO_MAP[symUpper]);
    }

    // 2. CoinCap CDN (2500+ coins)
    urls.push(`https://assets.coincap.io/assets/icons/${symLower}@2x.png`);

    // 3. spothq cryptocurrency-icons (500+ popular coins)
    urls.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symLower}.png`);

    // 4. atomiclabs cryptocurrency-icons
    urls.push(`https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/128/color/${symLower}.png`);

    // 5. Binance CDN
    urls.push(`https://bin.bnbstatic.com/static/images/common/coins/${symUpper}.png`);

    // 6. Backend proxy (last resort — hits CoinGecko search API)
    urls.push('__BACKEND__');

    return urls;
  }, [symLower, symUpper, category, isGoldOrCoin, isOil, isSilver]);

  // Reset state on symbol change
  useEffect(() => {
    setCdnIndex(0);
    setRemoteUrl(null);
    setRemoteLoading(false);
  }, [symUpper]);

  // If we've reached the backend placeholder, do the API call
  useEffect(() => {
    if (isGoldOrCoin || isOil || isSilver) return;
    const next = candidateUrls[cdnIndex];
    if (next !== '__BACKEND__') return;

    let cancelled = false;
    setRemoteLoading(true);

    fetch(`/api/logo/${symUpper}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.url) {
          setRemoteUrl(d.url);
        } else {
          setCdnIndex(candidateUrls.length);
        }
      })
      .catch(() => {
        if (!cancelled) setCdnIndex(candidateUrls.length);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cdnIndex, candidateUrls, symUpper, isGoldOrCoin, isOil, isSilver]);

  const handleImgError = () => {
    if (cdnIndex < candidateUrls.length - 1) {
      setCdnIndex((prev) => prev + 1);
    } else {
      setCdnIndex(candidateUrls.length);
    }
  };

  // ─── SVG: Iranian Gold Coins (Seke) ──────────────────────────────────────
  const renderSekeSvg = () => (
    <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-full shadow-lg shadow-amber-500/30">
      <defs>
        <radialGradient id={`sekeRim_${symUpper}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="60%" stopColor="#DFAD15" />
          <stop offset="100%" stopColor="#684A00" />
        </radialGradient>
        <radialGradient id={`sekeCenter_${symUpper}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF9A6" />
          <stop offset="45%" stopColor="#F5C538" />
          <stop offset="100%" stopColor="#8C5C00" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#sekeRim_${symUpper})`} stroke="#4A3400" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#7A5600" strokeWidth="2.5" strokeDasharray="1.5 1.5" />
      <circle cx="50" cy="50" r="42" fill={`url(#sekeCenter_${symUpper})`} stroke="#FFECA8" strokeWidth="0.6" />
      <text x="50" y="62" fontSize="30" fontWeight="900" fill="#78350F" textAnchor="middle" fontFamily="'Vazirmatn', sans-serif">💰</text>
    </svg>
  );

  // ─── SVG: 18K Gold ───────────────────────────────────────────────────────
  const renderGold18Svg = () => (
    <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-2xl shadow-lg shadow-amber-500/30">
      <defs>
        <linearGradient id={`gold18Front_${symUpper}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="30%" stopColor="#F6C728" />
          <stop offset="100%" stopColor="#966100" />
        </linearGradient>
        <linearGradient id={`gold18Top_${symUpper}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#E5A812" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      <polygon points="26,20 74,20 68,28 32,28" fill={`url(#gold18Top_${symUpper})`} />
      <polygon points="32,28 68,28 62,84 38,84" fill={`url(#gold18Front_${symUpper})`} stroke="#FFE875" strokeWidth="0.5" />
      <text x="50" y="58" fontSize="16" fontWeight="900" fill="#4E3000" textAnchor="middle" fontFamily="system-ui, sans-serif">18K</text>
      <text x="50" y="74" fontSize="7" fontWeight="800" fill="#523200" textAnchor="middle" fontFamily="system-ui, sans-serif">GOLD</text>
    </svg>
  );

  // ─── SVG: 24K Gold ───────────────────────────────────────────────────────
  const renderGold24Svg = () => (
    <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-2xl shadow-lg shadow-yellow-500/30">
      <defs>
        <linearGradient id={`gold24Front_${symUpper}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF685" />
          <stop offset="30%" stopColor="#FFD214" />
          <stop offset="100%" stopColor="#A36B00" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#182234" stroke="#334155" strokeWidth="1" />
      <polygon points="26,20 74,20 68,28 32,28" fill="#FFEA75" />
      <polygon points="32,28 68,28 62,84 38,84" fill={`url(#gold24Front_${symUpper})`} stroke="#FFF9A8" strokeWidth="0.5" />
      <text x="50" y="58" fontSize="16" fontWeight="900" fill="#523500" textAnchor="middle" fontFamily="system-ui, sans-serif">24K</text>
      <text x="50" y="74" fontSize="7" fontWeight="800" fill="#573800" textAnchor="middle" fontFamily="system-ui, sans-serif">GOLD</text>
    </svg>
  );

  // ─── SVG: Silver ─────────────────────────────────────────────────────────
  const renderSilverSvg = () => (
    <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-full shadow-lg shadow-slate-400/30">
      <defs>
        <radialGradient id={`silverGrad_${symUpper}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#silverGrad_${symUpper})`} stroke="#334155" strokeWidth="1.5" />
      <text x="50" y="62" fontSize="30" fontWeight="900" fill="#1E293B" textAnchor="middle" fontFamily="'Vazirmatn', sans-serif">🥈</text>
    </svg>
  );

  // ─── SVG: Oil ────────────────────────────────────────────────────────────
  const renderOilSvg = () => (
    <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-full shadow-lg shadow-sky-500/20">
      <defs>
        <linearGradient id={`oilGrad_${symUpper}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#oilGrad_${symUpper})`} stroke="#38BDF8" strokeWidth="2" />
      <text x="50" y="62" fontSize="38" textAnchor="middle">🛢️</text>
    </svg>
  );

  // ─── SVG: Generic Crypto with symbol ─────────────────────────────────────
  const renderGenericCrypto = () => {
    const colors = [
      ['#3B82F6', '#1D4ED8'], ['#8B5CF6', '#6D28D9'], ['#EC4899', '#BE185D'],
      ['#10B981', '#047857'], ['#F59E0B', '#B45309'], ['#06B6D4', '#0E7490'],
      ['#EF4444', '#B91C1C'], ['#84CC16', '#4D7C0F'], ['#F97316', '#C2410C'],
      ['#14B8A6', '#0F766E'], ['#A855F7', '#7E22CE'], ['#F43F5E', '#BE123C'],
    ];
    const hash = symUpper.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const [c1, c2] = colors[hash % colors.length];
    const label = symUpper.length <= 4 ? symUpper : symUpper.slice(0, 3);

    return (
      <div
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        className={`rounded-full flex items-center justify-center text-white font-black shadow-md border border-white/20 ${className}`}
      >
        <span style={{ fontSize: Math.max(8, size * 0.3) }}>{label}</span>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  // Special asset types (gold, oil, silver) — always SVG
  if (isGoldOrCoin) {
    const isSeke = symUpper.includes('SEKE') || symUpper.includes('EMAMI') ||
                   symUpper.includes('BAHAR') || symUpper.includes('NIM') ||
                   symUpper.includes('ROB') || symUpper.includes('GERAMI');
    const is24k = symUpper.includes('24');

    return (
      <div style={{ width: size, height: size }} className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
        {isSeke ? renderSekeSvg() : is24k ? renderGold24Svg() : renderGold18Svg()}
      </div>
    );
  }

  if (isOil) {
    return (
      <div style={{ width: size, height: size }} className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
        {renderOilSvg()}
      </div>
    );
  }

  if (isSilver) {
    return (
      <div style={{ width: size, height: size }} className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
        {renderSilverSvg()}
      </div>
    );
  }

  // Crypto / Fiat — try remote URLs
  const currentUrl = cdnIndex < candidateUrls.length && candidateUrls[cdnIndex] !== '__BACKEND__'
    ? candidateUrls[cdnIndex]
    : null;

  if (currentUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md flex-shrink-0 ${className}`}
      >
        <img
          src={currentUrl}
          alt={symUpper}
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full transition-transform hover:scale-110"
          onError={handleImgError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Remote backend lookup in progress
  if (remoteLoading) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md flex-shrink-0 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Show remote URL once backend resolved it
  if (remoteUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md flex-shrink-0 ${className}`}
      >
        <img
          src={remoteUrl}
          alt={symUpper}
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full"
          onError={() => {
            setRemoteUrl(null);
            setCdnIndex(candidateUrls.length);
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Final fallback
  return (
    <div style={{ width: size, height: size }} className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      {renderGenericCrypto()}
    </div>
  );
};
