import React, { useState, useEffect } from 'react';

interface AssetLogoProps {
  symbol: string;
  category?: 'crypto' | 'gold' | 'fiat' | 'oil' | 'commodity' | string;
  size?: number;
  className?: string;
}

// Top Known CoinGecko CDN image URLs for instant high-speed cached resolution
const COINGECKO_MAP: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.png',
  NOT: 'https://assets.coingecko.com/coins/images/37854/large/notcoin.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BCH: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
  POL: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  ETC: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  XLM: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
  APT: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png',
  OP: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  INJ: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  TIA: 'https://assets.coingecko.com/coins/images/31967/large/tia.png',
  RENDER: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  RNDR: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  ICP: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  VET: 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png',
  ALGO: 'https://assets.coingecko.com/coins/images/4380/large/download.png',
  MANA: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
  SAND: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  CRV: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  DYDX: 'https://assets.coingecko.com/coins/images/17500/large/hjnIm9bV.jpg',
  MKR: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  SNX: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
  GRT: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  GALA: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png',
  CHZ: 'https://assets.coingecko.com/coins/images/8834/large/Chiliz.png',
  BLUR: 'https://assets.coingecko.com/coins/images/28453/large/blur.png',
  WLD: 'https://assets.coingecko.com/coins/images/31062/large/worldcoin.png',
  STRK: 'https://assets.coingecko.com/coins/images/35278/large/starknet.png',
  JUP: 'https://assets.coingecko.com/coins/images/34188/large/jup.png',
  PYTH: 'https://assets.coingecko.com/coins/images/32924/large/pyth.png',
  FLOKI: 'https://assets.coingecko.com/coins/images/16746/large/FLOKI.png',
  BONK: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
  BOME: 'https://assets.coingecko.com/coins/images/36071/large/bome.png',
  MEME: 'https://assets.coingecko.com/coins/images/32526/large/meme.png',
  KAS: 'https://assets.coingecko.com/coins/images/28898/large/kaspa.png',
  BEAM: 'https://assets.coingecko.com/coins/images/32417/large/beam.png',
  SEI: 'https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  PENDLE: 'https://assets.coingecko.com/coins/images/15069/large/pendle.png',
  ONDO: 'https://assets.coingecko.com/coins/images/34582/large/ondo.png',
  FET: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  AGIX: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png',
  GNO: 'https://assets.coingecko.com/coins/images/662/large/gnosis-logo.png',
  ENA: 'https://assets.coingecko.com/coins/images/36530/large/ethena.png',
  AXS: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  STX: 'https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png',
  IMX: 'https://assets.coingecko.com/coins/images/17233/large/imx.png',
  XMR: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  EOS: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  ZEC: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  DASH: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_animated.png',
  '1INCH': 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png',
  LDO: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  QNT: 'https://assets.coingecko.com/coins/images/3370/large/5sn977.png',
  KAVA: 'https://assets.coingecko.com/coins/images/9761/large/KAVA.png',
  ROSE: 'https://assets.coingecko.com/coins/images/13162/large/oasis.png',
  NEO: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  IOTA: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  KSM: 'https://assets.coingecko.com/coins/images/9568/large/m4zRhP5e_400x400.jpg',
  FLOW: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55d1c499f_flow-token.png',
  MINA: 'https://assets.coingecko.com/coins/images/15628/large/mina_logo.png',
  GMX: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png',
  CFX: 'https://assets.coingecko.com/coins/images/13079/large/3.png',
  COMP: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png',
  ZIL: 'https://assets.coingecko.com/coins/images/2687/large/Zilliqa-logo.png',
  ENJ: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png',
  BAT: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png',
};

// Fiat Currency Flags Mapping
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
  const [cdnIndex, setCdnIndex] = useState<number>(0);
  const rawSym = (symbol || '').toUpperCase().trim();
  const sym = rawSym.replace(/[^A-Z0-9_]/g, '');
  const lowerSym = sym.toLowerCase();

  // Reset CDN index on symbol change
  useEffect(() => {
    setCdnIndex(0);
  }, [sym]);

  // Is this asset Gold or Iranian Coin?
  const isGoldOrIranianCoin =
    sym.includes('SEKE') ||
    sym.includes('EMAMI') ||
    sym.includes('BAHAR') ||
    sym.includes('NIM') ||
    sym.includes('ROB') ||
    sym.includes('GERAMI') ||
    sym.includes('GOLD') ||
    sym.includes('MESGHAL') ||
    sym.includes('MAZANEH') ||
    sym.includes('ONS') ||
    sym === 'XAU' ||
    category === 'gold';

  // Build candidate CDN URLs for crypto and fiat
  const getCandidateUrls = (): string[] => {
    if (isGoldOrIranianCoin) return [];

    if (category === 'fiat' || FIAT_FLAG_MAP[sym]) {
      const flagUrl = FIAT_FLAG_MAP[sym] || `https://flagcdn.com/w80/${lowerSym.substring(0, 2)}.png`;
      return [flagUrl];
    }

    if (category === 'oil' || sym.startsWith('OIL') || sym === 'BRENT' || sym === 'WTI') {
      return ['https://cdn-icons-png.flaticon.com/512/2933/2933884.png'];
    }

    if (sym === 'GAS') {
      return ['https://cdn-icons-png.flaticon.com/512/1533/1533913.png'];
    }

    if (sym === 'SILVER' || sym === 'XAG') {
      return ['https://cdn-icons-png.flaticon.com/512/261/261780.png'];
    }

    const urls: string[] = [];

    // 1. Direct CoinGecko Mapping (if available)
    if (COINGECKO_MAP[sym]) {
      urls.push(COINGECKO_MAP[sym]);
    }

    // 2. CoinCap Transparent HD CDN (covers top 2000+ crypto tokens)
    urls.push(`https://assets.coincap.io/assets/icons/${lowerSym}@2x.png`);

    // 3. CryptoIcons Color CDN
    urls.push(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${lowerSym}.png`);

    // 4. TrustWallet / Binance Asset CDN
    urls.push(`https://bin.bnbstatic.com/static/images/common/coins/${sym}.png`);

    return urls;
  };

  const candidateUrls = getCandidateUrls();
  const currentLogoUrl = candidateUrls[cdnIndex] || null;

  const handleImgError = () => {
    if (cdnIndex < candidateUrls.length - 1) {
      setCdnIndex((prev) => prev + 1);
    } else {
      setCdnIndex(candidateUrls.length); // Mark as all exhausted -> render SVG
    }
  };

  // 2. High-Fidelity Photorealistic Vector Fallbacks
  const renderSvgFallback = () => {
    // 1. Seke Emami & Iranian Gold Coins (سکه امامی با چهره و سال ۱۳۸۶ و حاشیه دندانه‌دار طلایی)
    if (
      sym.includes('SEKE') ||
      sym.includes('EMAMI') ||
      sym.includes('BAHAR') ||
      sym.includes('NIM') ||
      sym.includes('ROB') ||
      sym.includes('GERAMI') ||
      sym === 'COIN'
    ) {
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-full shadow-lg shadow-amber-500/30 overflow-visible flex-shrink-0">
          <defs>
            <radialGradient id="sekeRimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF275" />
              <stop offset="60%" stopColor="#DFAD15" />
              <stop offset="90%" stopColor="#A77A03" />
              <stop offset="100%" stopColor="#684A00" />
            </radialGradient>
            <radialGradient id="sekeCenterGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFF9A6" />
              <stop offset="35%" stopColor="#F5C538" />
              <stop offset="70%" stopColor="#D99B16" />
              <stop offset="100%" stopColor="#8C5C00" />
            </radialGradient>
            <linearGradient id="sekeRelief" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFECA8" />
              <stop offset="50%" stopColor="#C99414" />
              <stop offset="100%" stopColor="#784E00" />
            </linearGradient>
            <filter id="sekeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#452600" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Outer Serrated / Milled Coin Rim */}
          <circle cx="50" cy="50" r="49" fill="url(#sekeRimGrad)" stroke="#4A3400" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="#7A5600" strokeWidth="3" strokeDasharray="1.2 1.2" />

          {/* Main Coin Core */}
          <circle cx="50" cy="50" r="43.5" fill="url(#sekeCenterGrad)" stroke="#FFECA8" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="41.5" fill="none" stroke="#9A6B00" strokeWidth="0.6" opacity="0.6" />

          {/* Detailed Embossed Portrait (Ayatollah Khomeini / Seke Emami Relief) */}
          <g filter="url(#sekeGlow)" fill="url(#sekeRelief)" stroke="#8A5A00" strokeWidth="0.4">
            <path d="M37 32 C38 24, 48 20, 60 23 C65 25, 68 29, 66 34 C64 38, 59 40, 52 40 C43 40, 36 36, 37 32 Z" />
            <path d="M42 27 C47 23, 58 24, 63 28 C60 30, 52 30, 44 29 Z" fill="#FFECA8" opacity="0.7" />
            <path d="M35 34 C42 30, 56 31, 65 37 C60 41, 48 42, 38 39 Z" />

            <path d="M44 38 C47 38, 58 39, 61 43 C62 47, 61 50, 60 52 C58 54, 52 56, 45 54 C42 52, 43 44, 44 38 Z" />

            <path d="M50 43 Q54 44 57 43" stroke="#663E00" strokeWidth="1.2" fill="none" />
            <ellipse cx="53" cy="46" rx="1.8" ry="1.2" fill="#5A3500" />
            <path d="M56 44 L58 51 L55 52 Z" fill="#FFECA8" />

            <path d="M43 51 C48 51, 56 52, 60 55 C64 61, 63 70, 57 73 C51 75, 43 74, 38 68 C34 63, 36 55, 43 51 Z" />
            <path d="M45 56 C49 64, 55 67, 57 71" stroke="#FFECA8" strokeWidth="0.8" fill="none" opacity="0.8" />
            <path d="M41 59 C44 65, 48 69, 52 72" stroke="#683F00" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M48 58 C51 63, 53 66, 54 70" stroke="#FFECA8" strokeWidth="0.8" fill="none" opacity="0.8" />

            <path d="M30 67 C36 64, 42 66, 48 70 C54 74, 62 70, 71 70 C72 74, 68 76, 58 77 C44 78, 33 74, 30 67 Z" />
          </g>

          {/* Persian Year Engraving: ۱۳۸۶ */}
          <text
            x="50"
            y="87"
            fontSize="10"
            fontWeight="900"
            fill="#5E3800"
            stroke="#FFE894"
            strokeWidth="0.3"
            textAnchor="middle"
            fontFamily="'Vazirmatn', 'Tahoma', sans-serif"
            letterSpacing="1.5"
          >
            ۱۳۸۶
          </text>
        </svg>
      );
    }

    // 2. 18K Gold Ingot / Bullion (طلای ۱۸ عیار - شمش ۱۸ عیار طلا با نشان 18K GIB. 1830)
    if (
      sym.includes('18') ||
      sym === 'GOLD18' ||
      sym === 'GOLD' ||
      sym === 'GERAM18' ||
      sym === 'MESGHAL' ||
      sym === 'MAZANEH' ||
      (category === 'gold' && !sym.includes('24') && !sym.includes('SEKE') && !sym.includes('ONS') && !sym.includes('XAU'))
    ) {
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-2xl shadow-lg shadow-amber-500/25 overflow-visible flex-shrink-0">
          <defs>
            <linearGradient id="ingot18Front" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF275" />
              <stop offset="25%" stopColor="#F6C728" />
              <stop offset="70%" stopColor="#D8990D" />
              <stop offset="100%" stopColor="#966100" />
            </linearGradient>
            <linearGradient id="ingot18Top" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFF9C4" />
              <stop offset="60%" stopColor="#FEE56C" />
              <stop offset="100%" stopColor="#E5A812" />
            </linearGradient>
            <linearGradient id="ingot18Side" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B27B00" />
              <stop offset="100%" stopColor="#5E3C00" />
            </linearGradient>
            <filter id="ingot18Depth" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>

          <rect x="6" y="6" width="88" height="88" rx="18" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <path d="M12 20 L40 20 M12 28 L35 28 M12 36 L30 36 M65 65 L88 65 M65 73 L85 73 M65 81 L80 81" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

          <g filter="url(#ingot18Depth)">
            <polygon points="26,16 74,16 68,24 32,24" fill="url(#ingot18Top)" />
            <polygon points="32,24 68,24 62,84 38,84" fill="url(#ingot18Front)" stroke="#FFE875" strokeWidth="0.5" />
            <polygon points="26,16 32,24 38,84 30,78" fill="url(#ingot18Top)" opacity="0.85" />
            <polygon points="74,16 68,24 62,84 70,78" fill="url(#ingot18Side)" />
            <polygon points="38,84 62,84 70,78 30,78" fill="#7A4E00" />

            <path
              d="M44 32 L46 29 L50 31 L54 29 L56 32 Q50 34 44 32 Z"
              fill="#523200"
              stroke="#FFF275"
              strokeWidth="0.4"
            />
            <circle cx="50" cy="33" r="1.2" fill="#523200" />

            <text
              x="50"
              y="48"
              fontSize="12"
              fontWeight="900"
              fill="#4E3000"
              stroke="#FFEAA0"
              strokeWidth="0.4"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.8"
            >
              18 K
            </text>

            <text
              x="50"
              y="65"
              fontSize="6.5"
              fontWeight="800"
              fill="#523200"
              stroke="#FFEAA0"
              strokeWidth="0.3"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              GIB.
            </text>

            <text
              x="50"
              y="74"
              fontSize="6"
              fontWeight="800"
              fill="#523200"
              stroke="#FFEAA0"
              strokeWidth="0.3"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.5"
            >
              1830
            </text>
          </g>
        </svg>
      );
    }

    // 3. 24K Gold Ingot / Bullion (طلای ۲۴ عیار - شمش ۲۴ عیار طلا با نشان 24K 240 1971)
    if (sym.includes('24') || sym === 'GOLD24' || sym === '24K' || sym === 'ONS' || sym === 'XAU') {
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="rounded-2xl shadow-lg shadow-yellow-500/30 overflow-visible flex-shrink-0">
          <defs>
            <linearGradient id="ingot24Front" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF685" />
              <stop offset="25%" stopColor="#FFD214" />
              <stop offset="70%" stopColor="#E5A100" />
              <stop offset="100%" stopColor="#A36B00" />
            </linearGradient>
            <linearGradient id="ingot24Top" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFCC" />
              <stop offset="60%" stopColor="#FFEA75" />
              <stop offset="100%" stopColor="#FFBA08" />
            </linearGradient>
            <linearGradient id="ingot24Side" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C48800" />
              <stop offset="100%" stopColor="#6E4400" />
            </linearGradient>
            <filter id="ingot24Depth" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          <rect x="6" y="6" width="88" height="88" rx="18" fill="#182234" stroke="#334155" strokeWidth="1" />
          <path d="M12 22 L38 22 M12 30 L32 30 M68 68 L88 68 M68 76 L84 76" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

          <g filter="url(#ingot24Depth)">
            <polygon points="26,16 74,16 68,24 32,24" fill="url(#ingot24Top)" />
            <polygon points="32,24 68,24 62,84 38,84" fill="url(#ingot24Front)" stroke="#FFF9A8" strokeWidth="0.5" />
            <polygon points="26,16 32,24 38,84 30,78" fill="url(#ingot24Top)" opacity="0.9" />
            <polygon points="74,16 68,24 62,84 70,78" fill="url(#ingot24Side)" />
            <polygon points="38,84 62,84 70,78 30,78" fill="#7A4E00" />

            <path
              d="M43 32 L45 28 L50 30.5 L55 28 L57 32 Q50 34.5 43 32 Z"
              fill="#5C3B00"
              stroke="#FFF9A8"
              strokeWidth="0.4"
            />
            <circle cx="50" cy="33.5" r="1.2" fill="#5C3B00" />

            <text
              x="50"
              y="48"
              fontSize="12"
              fontWeight="900"
              fill="#523500"
              stroke="#FFF2A0"
              strokeWidth="0.4"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.8"
            >
              24 K
            </text>

            <text
              x="50"
              y="65"
              fontSize="7"
              fontWeight="800"
              fill="#573800"
              stroke="#FFF2A0"
              strokeWidth="0.3"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.6"
            >
              240
            </text>

            <text
              x="50"
              y="74"
              fontSize="6"
              fontWeight="800"
              fill="#573800"
              stroke="#FFF2A0"
              strokeWidth="0.3"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.5"
            >
              1971
            </text>
          </g>
        </svg>
      );
    }

    // Crude Oil Barrel
    if (category === 'oil' || sym.startsWith('OIL') || sym === 'BRENT' || sym === 'WTI') {
      return (
        <svg viewBox="0 0 36 36" width={size} height={size} className="rounded-full shadow-md shadow-sky-500/20 flex-shrink-0">
          <defs>
            <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="18" fill="url(#oilGrad)" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="11" y="9" width="14" height="18" rx="3" fill="#0284C7" />
          <ellipse cx="18" cy="10" rx="7" ry="2" fill="#38BDF8" />
          <line x1="11" y1="15" x2="25" y2="15" stroke="#0369A1" strokeWidth="1.5" />
          <line x1="11" y1="21" x2="25" y2="21" stroke="#0369A1" strokeWidth="1.5" />
          <path d="M18 16 C18 16 15.5 19 15.5 20.5 C15.5 21.8 16.6 22.8 18 22.8 C19.4 22.8 20.5 21.8 20.5 20.5 C20.5 19 18 16 18 16 Z" fill="#F0FDF4" />
        </svg>
      );
    }

    // Bitcoin
    if (sym === 'BTC' || sym === 'BITCOIN') {
      return (
        <svg viewBox="0 0 36 36" width={size} height={size} className="rounded-full shadow-md shadow-amber-500/25 flex-shrink-0">
          <circle cx="18" cy="18" r="18" fill="#F7931A" />
          <path
            d="M23.189 15.42c.36-2.42-1.48-3.72-4-4.59l.82-3.28-2-.5-.8 3.19c-.52-.13-1.07-.25-1.61-.37l.8-3.23-2-.5-.82 3.28c-.43-.1-.86-.2-1.28-.3l-2.76-.69-.53 2.14s1.48.34 1.45.36c.81.2.96.74.93 1.17l-.94 3.75c.06.01.13.04.21.07l-.21-.05-1.31 5.26c-.1.25-.35.62-.92.48.02.03-1.46-.36-1.46-.36l-1 2.3 2.6.65c.49.12.96.25 1.43.37l-.83 3.33 2 .5.82-3.29c.55.15 1.08.29 1.6.42l-.82 3.27 2 .5.83-3.32c3.42.65 6 .39 7.08-2.71.88-2.5-.04-3.94-1.85-4.88 1.32-.3 2.3-1.17 2.56-2.95zm-4.58 6.43c-.62 2.5-4.8 1.15-6.16.81l1.1-4.4c1.36.34 5.7 1 5.06 3.59zm.62-6.47c-.57 2.27-4.06 1.12-5.19.84l1-4c1.13.28 4.78.82 4.19 3.16z"
            fill="#FFFFFF"
          />
        </svg>
      );
    }

    // Tether
    if (sym === 'USDT' || sym === 'TETHER') {
      return (
        <svg viewBox="0 0 36 36" width={size} height={size} className="rounded-full shadow-md shadow-emerald-500/25 flex-shrink-0">
          <circle cx="18" cy="18" r="18" fill="#26A17B" />
          <path
            d="M19.9 16.5v-2.3h4.6V11H11.5v3.2h4.6v2.3c-4.3.2-7.5 1.1-7.5 2.1 0 1.1 3.2 2 7.5 2.2v6.7h3.8v-6.7c4.3-.2 7.5-1.1 7.5-2.2 0-1-3.2-1.9-7.5-2.1zm0 3.3v-.1c3.5-.2 6-.8 6-1.5s-2.5-1.3-6-1.5v3.1zm-3.8 0v-3.1c-3.5.2-6 .8-6 1.5s2.5 1.3 6 1.6z"
            fill="#FFFFFF"
          />
        </svg>
      );
    }

    // Ethereum
    if (sym === 'ETH' || sym === 'ETHEREUM') {
      return (
        <svg viewBox="0 0 36 36" width={size} height={size} className="rounded-full shadow-md shadow-indigo-500/25 flex-shrink-0">
          <circle cx="18" cy="18" r="18" fill="#627EEA" />
          <g fill="#FFFFFF" fillRule="nonzero">
            <path d="M18 6.5l-.2.8v14.4l.2.2 6.7-4z" opacity=".6" />
            <path d="M18 6.5L11.3 17.9l6.7 4V6.5z" />
            <path d="M18 23.3l-.1.2v6l.1.3 6.7-9.4z" opacity=".6" />
            <path d="M18 29.8v-6.5l-6.7-2.9z" />
            <path d="M18 21.9l6.7-4-6.7-3z" opacity=".2" />
            <path d="M11.3 17.9l6.7 4v-7z" opacity=".6" />
          </g>
        </svg>
      );
    }

    // Default Crypto Colorful Geometric Ring Logo
    const colors = [
      ['#3B82F6', '#1D4ED8'],
      ['#8B5CF6', '#6D28D9'],
      ['#EC4899', '#BE185D'],
      ['#10B981', '#047857'],
      ['#F59E0B', '#B45309'],
      ['#06B6D4', '#0E7490'],
    ];
    const hash = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const [c1, c2] = colors[hash % colors.length];

    return (
      <div
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        className={`rounded-full flex items-center justify-center text-white font-black text-xs font-mono shadow-md border border-white/20 flex-shrink-0 ${className}`}
      >
        {sym.substring(0, 3)}
      </div>
    );
  };

  // If candidate image exists, render high-res image
  if (currentLogoUrl && cdnIndex < candidateUrls.length) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-full overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-700/80 shadow-md flex-shrink-0 ${className}`}
      >
        <img
          src={currentLogoUrl}
          alt={sym}
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full transition-transform hover:scale-110"
          onError={handleImgError}
          loading="lazy"
        />
      </div>
    );
  }

  // Otherwise render fallback SVG
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {renderSvgFallback()}
    </div>
  );
};
