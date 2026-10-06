import sharp from 'sharp';
import { BotStorage } from './storage';
import { PriceService, Chart7DayData } from './priceService';

export interface CardAssetData {
  name: string;
  symbol: string;
  priceUsd?: number;
  priceToman?: number;
  changePercent: number;
  highToman?: number;
  lowToman?: number;
  highUsd?: number;
  lowUsd?: number;
  category?: 'crypto' | 'gold' | 'oil' | 'fiat' | 'commodity';
  unit?: string;
  chartData?: Chart7DayData;
}

interface ThemeConfig {
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  iconBg: string;
  iconText: string;
  accentColor: string;
  bgPatternSymbol: string;
  badgeName: string;
}

export class ImageCardService {
  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Return high-definition vector flag for currency units (Requested: واحد پول پرچم باشه)
   */
  private static getCurrencyFlagSvg(
    countryCode: 'IR' | 'US' | 'EU' | 'GB' | 'AE' | 'TR',
    width: number = 28,
    height: number = 19
  ): string {
    const clipId = `flag_${countryCode}_${Math.floor(Math.random() * 100000)}`;

    switch (countryCode) {
      case 'IR': // Iran Flag 🇮🇷
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${(height / 3).toFixed(2)}" fill="#239F40" />
              <rect y="${(height / 3).toFixed(2)}" width="${width}" height="${(height / 3).toFixed(2)}" fill="#FFFFFF" />
              <rect y="${((height * 2) / 3).toFixed(2)}" width="${width}" height="${(height / 3 + 0.1).toFixed(2)}" fill="#DA0000" />
              <!-- Center Emblem -->
              <circle cx="${(width / 2).toFixed(1)}" cy="${(height / 2).toFixed(1)}" r="${(height * 0.16).toFixed(1)}" fill="#DA0000" />
              <path d="M ${(width / 2 - 2).toFixed(1)} ${(height / 2 - 3).toFixed(1)} Q ${(width / 2).toFixed(1)} ${(height / 2 - 5).toFixed(1)} ${(width / 2 + 2).toFixed(1)} ${(height / 2 - 3).toFixed(1)} Q ${(width / 2).toFixed(1)} ${(height / 2 + 3).toFixed(1)} ${(width / 2 - 2).toFixed(1)} ${(height / 2 - 3).toFixed(1)}" fill="#DA0000" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;

      case 'US': // USA Flag 🇺🇸
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${height}" fill="#B22234" />
              <rect y="${(height * (1 / 7)).toFixed(2)}" width="${width}" height="${(height * (1 / 13)).toFixed(2)}" fill="#FFFFFF" />
              <rect y="${(height * (3 / 7)).toFixed(2)}" width="${width}" height="${(height * (1 / 13)).toFixed(2)}" fill="#FFFFFF" />
              <rect y="${(height * (5 / 7)).toFixed(2)}" width="${width}" height="${(height * (1 / 13)).toFixed(2)}" fill="#FFFFFF" />
              <!-- Blue Canton -->
              <rect width="${(width * 0.46).toFixed(1)}" height="${(height * 0.54).toFixed(1)}" fill="#3C3B6E" />
              <!-- Stars cluster -->
              <circle cx="${(width * 0.12).toFixed(1)}" cy="${(height * 0.15).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.23).toFixed(1)}" cy="${(height * 0.15).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.34).toFixed(1)}" cy="${(height * 0.15).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.18).toFixed(1)}" cy="${(height * 0.28).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.29).toFixed(1)}" cy="${(height * 0.28).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.12).toFixed(1)}" cy="${(height * 0.41).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.23).toFixed(1)}" cy="${(height * 0.41).toFixed(1)}" r="1" fill="#FFFFFF" />
              <circle cx="${(width * 0.34).toFixed(1)}" cy="${(height * 0.41).toFixed(1)}" r="1" fill="#FFFFFF" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;

      case 'EU': // European Union Flag 🇪🇺
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${height}" fill="#003399" />
              <circle cx="${width / 2}" cy="${height / 2 - 5}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 + 5}" cy="${height / 2 - 3}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 + 6}" cy="${height / 2 + 1}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 + 4}" cy="${height / 2 + 5}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2}" cy="${height / 2 + 6}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 - 4}" cy="${height / 2 + 5}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 - 6}" cy="${height / 2 + 1}" r="1" fill="#FFCC00" />
              <circle cx="${width / 2 - 5}" cy="${height / 2 - 3}" r="1" fill="#FFCC00" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;

      case 'GB': // UK Flag 🇬🇧
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${height}" fill="#012169" />
              <path d="M 0 0 L ${width} ${height} M 0 ${height} L ${width} 0" stroke="#FFFFFF" stroke-width="3" />
              <path d="M 0 0 L ${width} ${height} M 0 ${height} L ${width} 0" stroke="#C8102E" stroke-width="1.4" />
              <rect x="${width / 2 - 3}" y="0" width="6" height="${height}" fill="#FFFFFF" />
              <rect x="0" y="${height / 2 - 3}" width="${width}" height="6" fill="#FFFFFF" />
              <rect x="${width / 2 - 1.5}" y="0" width="3" height="${height}" fill="#C8102E" />
              <rect x="0" y="${height / 2 - 1.5}" width="${width}" height="3" fill="#C8102E" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;

      case 'AE': // UAE Flag 🇦🇪
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${height / 3}" fill="#00732F" />
              <rect y="${height / 3}" width="${width}" height="${height / 3}" fill="#FFFFFF" />
              <rect y="${(height * 2) / 3}" width="${width}" height="${height / 3}" fill="#000000" />
              <rect x="0" y="0" width="${width * 0.28}" height="${height}" fill="#FF0000" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;

      case 'TR': // Turkey Flag 🇹🇷
      default:
        return `
          <g>
            <clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="3.5" /></clipPath>
            <g clip-path="url(#${clipId})">
              <rect width="${width}" height="${height}" fill="#E30A17" />
              <circle cx="${width * 0.45}" cy="${height / 2}" r="${height * 0.32}" fill="#FFFFFF" />
              <circle cx="${width * 0.52}" cy="${height / 2}" r="${height * 0.25}" fill="#E30A17" />
              <polygon points="${width * 0.65},${height / 2} ${width * 0.72},${height * 0.42} ${width * 0.7},${height * 0.58}" fill="#FFFFFF" />
            </g>
            <rect width="${width}" height="${height}" rx="3.5" fill="none" stroke="#CBD5E1" stroke-width="0.8" />
          </g>
        `;
    }
  }

  /**
   * Return small crisp vector coin logo next to asset name (Requested: عکس ارز ها بغل اسمشون کوچیک باشه)
   */
  private static getCoinEmblemSvg(symbol: string, category?: string, size: number = 38): string {
    const sym = (symbol || '').toUpperCase().trim();
    const r = size / 2;

    if (sym.includes('BTC') || sym.includes('BITCOIN')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#F7931A" stroke="#FFFFFF" stroke-width="1.8" />
          <!-- Bitcoin B logo with ticks -->
          <text x="0" y="${r * 0.35}" font-size="${r * 1.15}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">₿</text>
        </g>
      `;
    }

    if (sym.includes('ETH')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#627EEA" stroke="#FFFFFF" stroke-width="1.8" />
          <!-- Ethereum Octahedron diamond -->
          <g transform="scale(${size / 40}) translate(-20, -20)">
            <polygon points="20,7 29,21 20,16 11,21" fill="#FFFFFF" fill-opacity="0.8" />
            <polygon points="20,7 29,21 20,25" fill="#FFFFFF" fill-opacity="0.95" />
            <polygon points="20,27 29,22 20,33 11,22" fill="#FFFFFF" fill-opacity="0.9" />
          </g>
        </g>
      `;
    }

    if (sym.includes('USDT') || sym.includes('TETHER')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#26A17B" stroke="#FFFFFF" stroke-width="1.8" />
          <!-- Tether ₮ logo -->
          <ellipse cx="0" cy="${-r * 0.1}" rx="${r * 0.58}" ry="${r * 0.22}" fill="none" stroke="#FFFFFF" stroke-width="2" />
          <rect x="${-r * 0.45}" y="${-r * 0.45}" width="${r * 0.9}" height="2.5" fill="#FFFFFF" />
          <rect x="-1.5" y="${-r * 0.45}" width="3" height="${r * 0.9}" fill="#FFFFFF" />
        </g>
      `;
    }

    if (sym.includes('TON')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#0088CC" stroke="#FFFFFF" stroke-width="1.8" />
          <!-- Toncoin Diamond gem facets -->
          <g transform="scale(${size / 40}) translate(-20, -20)">
            <polygon points="20,9 31,17 20,31 9,17" fill="#FFFFFF" fill-opacity="0.9" />
            <polygon points="20,9 20,31 9,17" fill="#FFFFFF" fill-opacity="0.75" />
            <polygon points="20,9 31,17 20,18" fill="#FFFFFF" fill-opacity="0.55" />
          </g>
        </g>
      `;
    }

    if (sym.includes('SOL')) {
      return `
        <g>
          <defs>
            <linearGradient id="solEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#14F195" />
              <stop offset="100%" stop-color="#9945FF" />
            </linearGradient>
          </defs>
          <circle cx="0" cy="0" r="${r}" fill="#0F172A" stroke="#14F195" stroke-width="1.6" />
          <g transform="scale(${size / 40}) translate(-20, -20)">
            <path d="M12,13 L25,13 L28,10 L15,10 Z" fill="url(#solEmblemGrad)" />
            <path d="M15,20 L28,20 L25,23 L12,23 Z" fill="url(#solEmblemGrad)" />
            <path d="M12,27 L25,27 L28,24 L15,24 Z" fill="url(#solEmblemGrad)" />
          </g>
        </g>
      `;
    }

    if (category === 'gold' || sym.includes('GOLD') || sym.includes('SEKE') || sym.includes('طلا') || sym.includes('سکه') || sym.includes('مثقال')) {
      return `
        <g>
          <defs>
            <radialGradient id="goldEmblemGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#FDE047" />
              <stop offset="50%" stop-color="#F59E0B" />
              <stop offset="100%" stop-color="#B45309" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="0" r="${r}" fill="url(#goldEmblemGrad)" stroke="#FFFFFF" stroke-width="1.8" />
          <circle cx="0" cy="0" r="${r * 0.78}" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="2,2" />
          <text x="0" y="${r * 0.35}" font-size="${r * 0.95}" font-weight="900" fill="#78350F" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">👑</text>
        </g>
      `;
    }

    if (category === 'oil' || sym.includes('OIL') || sym.includes('BRENT') || sym.includes('WTI') || sym.includes('نفت')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#1E293B" stroke="#38BDF8" stroke-width="1.6" />
          <text x="0" y="${r * 0.35}" font-size="${r * 0.95}" text-anchor="middle">🛢️</text>
        </g>
      `;
    }

    if (sym === 'USD' || sym === 'DOLLAR' || sym.includes('دلار')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#15803D" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="${r * 0.35}" font-size="${r * 1.1}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">$</text>
        </g>
      `;
    }

    if (sym.includes('EUR') || sym.includes('یورو')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="${r * 0.35}" font-size="${r * 1.1}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">€</text>
        </g>
      `;
    }

    if (sym.includes('GBP') || sym.includes('پوند')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#991B1B" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="${r * 0.35}" font-size="${r * 1.1}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">£</text>
        </g>
      `;
    }

    if (sym.includes('AED') || sym.includes('درهم')) {
      return `
        <g>
          <circle cx="0" cy="0" r="${r}" fill="#047857" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="${r * 0.35}" font-size="${r * 0.85}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">د.إ</text>
        </g>
      `;
    }

    // Default Crypto / Token Coin
    return `
      <g>
        <circle cx="0" cy="0" r="${r}" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.8" />
        <text x="0" y="${r * 0.35}" font-size="${r * 0.85}" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">${sym.substring(0, 3)}</text>
      </g>
    `;
  }

  /**
   * Generates custom, ultra-stylish branded background theme for each currency
   * (Requested: ارز ها تم خوشگل خفن با برند ما باشه برای هر کدوم از ارز ها برای پس زمینه)
   */
  private static getThemedBackgroundSvg(
    symbol: string,
    category?: string,
    width: number = 1200,
    height: number = 675,
    brandTag: string = '@MODASR_ARZ | MODASRP'
  ): string {
    const sym = (symbol || '').toUpperCase().trim();

    // 1. BITCOIN THEME: Deep Obsidian & Cyber-Gold Neon Grid + Giant 3D Bitcoin Watermark
    if (sym.includes('BTC') || sym.includes('BITCOIN')) {
      return `
        <!-- BITCOIN BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#070A12" />
        <!-- Ambient Glowing Orbs -->
        <circle cx="150" cy="120" r="320" fill="#EA580C" opacity="0.14" />
        <circle cx="1050" cy="520" r="380" fill="#F59E0B" opacity="0.16" />
        <circle cx="600" cy="300" r="260" fill="#F97316" opacity="0.08" />

        <!-- Cybernetic Isometric Grid Lines -->
        <path d="M 0 100 L 1200 100 M 0 240 L 1200 240 M 0 380 L 1200 380 M 0 520 L 1200 520" stroke="#F97316" stroke-width="0.8" opacity="0.12" stroke-dasharray="6,8" />
        <path d="M 200 0 L 200 675 M 450 0 L 450 675 M 750 0 L 750 675 M 1000 0 L 1000 675" stroke="#F97316" stroke-width="0.8" opacity="0.08" stroke-dasharray="4,6" />

        <!-- Giant 3D Bitcoin Ring Watermark in Background -->
        <g transform="translate(1020, 320)" opacity="0.09">
          <circle cx="0" cy="0" r="230" fill="none" stroke="#F59E0B" stroke-width="12" />
          <circle cx="0" cy="0" r="195" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="8,6" />
          <text x="0" y="80" font-size="240" font-weight="900" fill="#F59E0B" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">₿</text>
        </g>

        <!-- Brand Headers & Identity -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#FB923C" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  BITCOIN VIP</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#FDBA74" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP FINANCIAL TRADING INTELLIGENCE</text>
        </g>
      `;
    }

    // 2. ETHEREUM THEME: Cosmic Indigo & Electric Crystal Lattice
    if (sym.includes('ETH')) {
      return `
        <!-- ETHEREUM BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#060814" />
        <circle cx="180" cy="160" r="340" fill="#4F46E5" opacity="0.18" />
        <circle cx="1020" cy="480" r="360" fill="#818CF8" opacity="0.16" />
        <circle cx="600" cy="320" r="280" fill="#3730A3" opacity="0.12" />

        <!-- Geometric Crystal Lines -->
        <path d="M 100 0 L 1100 675 M 1100 0 L 100 675" stroke="#818CF8" stroke-width="0.9" opacity="0.08" />
        <path d="M 0 150 L 1200 150 M 0 525 L 1200 525" stroke="#818CF8" stroke-width="0.8" opacity="0.10" stroke-dasharray="8,6" />

        <!-- Giant Ethereum Diamond Silhouette Watermark -->
        <g transform="translate(1000, 320)" opacity="0.09">
          <polygon points="0,-180 110,-20 0,60 -110,-20" fill="#818CF8" />
          <polygon points="0,-180 110,-20 0,-70" fill="#6366F1" />
          <polygon points="0,85 110,15 0,195 -110,15" fill="#818CF8" />
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#A5B4FC" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  ETHEREUM NETWORK</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#C7D2FE" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP WEB3 FINANCIAL DESK</text>
        </g>
      `;
    }

    // 3. TONCOIN THEME: Telegram Sapphire & Cyan Crystal Diamond
    if (sym.includes('TON')) {
      return `
        <!-- TONCOIN BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#030816" />
        <circle cx="200" cy="140" r="320" fill="#0284C7" opacity="0.18" />
        <circle cx="1000" cy="500" r="380" fill="#0088CC" opacity="0.22" />
        <circle cx="600" cy="300" r="240" fill="#38BDF8" opacity="0.10" />

        <!-- Network Constellation Lines -->
        <path d="M 0 120 Q 600 40 1200 120 M 0 540 Q 600 620 1200 540" fill="none" stroke="#38BDF8" stroke-width="1.2" opacity="0.12" />
        
        <!-- Giant TON Diamond Gem Watermark -->
        <g transform="translate(980, 310)" opacity="0.09">
          <polygon points="0,-160 140,-40 0,160 -140,-40" fill="#38BDF8" />
          <polygon points="0,-160 140,-40 0,-30" fill="#0088CC" />
          <polygon points="0,-160 0,160 -140,-40" fill="#0284C7" />
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#7DD3FC" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  TON TELEGRAM</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#BAE6FD" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP TELEGRAM FINTECH ENGINE</text>
        </g>
      `;
    }

    // 4. SOLANA THEME: Cyberpunk Obsidian & Neon Velocity Ribbons
    if (sym.includes('SOL')) {
      return `
        <!-- SOLANA BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#08090E" />
        <circle cx="150" cy="180" r="340" fill="#14F195" opacity="0.14" />
        <circle cx="1050" cy="460" r="380" fill="#9945FF" opacity="0.18" />

        <!-- Velocity Curves -->
        <path d="M 0 160 C 400 80, 800 240, 1200 160" fill="none" stroke="#14F195" stroke-width="1.5" opacity="0.15" />
        <path d="M 0 520 C 400 440, 800 600, 1200 520" fill="none" stroke="#9945FF" stroke-width="1.5" opacity="0.15" />

        <!-- Giant Solana Triad Watermark -->
        <g transform="translate(980, 310)" opacity="0.08">
          <path d="M -110 -60 L 70 -60 L 110 -100 L -70 -100 Z" fill="#14F195" />
          <path d="M -70 20 L 110 20 L 70 -20 L -110 -20 Z" fill="#00D4FF" />
          <path d="M -110 100 L 70 100 L 110 60 L -70 60 Z" fill="#9945FF" />
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#A7F3D0" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  SOLANA VELOCITY</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#E9D5FF" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP HIGH FREQUENCY DESK</text>
        </g>
      `;
    }

    // 5. TETHER THEME: Cyber-Forest Emerald & Stable Vault Lattice
    if (sym.includes('USDT') || sym.includes('TETHER')) {
      return `
        <!-- TETHER BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#040F0A" />
        <circle cx="160" cy="140" r="320" fill="#059669" opacity="0.18" />
        <circle cx="1020" cy="480" r="380" fill="#26A17B" opacity="0.16" />

        <!-- Financial Guilloche Curves -->
        <path d="M 0 140 Q 600 220 1200 140 M 0 510 Q 600 430 1200 510" fill="none" stroke="#26A17B" stroke-width="1.2" opacity="0.14" />
        
        <!-- Giant Tether ₮ Watermark -->
        <g transform="translate(1000, 320)" opacity="0.09">
          <ellipse cx="0" cy="0" rx="140" ry="45" fill="none" stroke="#26A17B" stroke-width="14" />
          <rect x="-90" y="-80" width="180" height="18" fill="#26A17B" />
          <rect x="-10" y="-80" width="20" height="170" fill="#26A17B" />
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#6EE7B7" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  TETHER STABLECOIN</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#A7F3D0" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP LIQUIDITY RESERVE</text>
        </g>
      `;
    }

    // 6. GOLD & SEKE THEME: Ultra-Luxury 24K Royal Gold Sunburst & Bullion Seal
    if (category === 'gold' || sym.includes('GOLD') || sym.includes('SEKE') || sym.includes('طلا') || sym.includes('سکه') || sym.includes('مثقال')) {
      return `
        <!-- GOLD & SEKE BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#0A0803" />
        <circle cx="180" cy="140" r="350" fill="#D97706" opacity="0.22" />
        <circle cx="1020" cy="500" r="400" fill="#F59E0B" opacity="0.18" />
        <circle cx="600" cy="300" r="280" fill="#B45309" opacity="0.15" />

        <!-- Luxury Banknote Guilloche Waves -->
        <path d="M 0 100 C 300 180, 900 20, 1200 100 M 0 540 C 300 460, 900 620 1200 540" fill="none" stroke="#F59E0B" stroke-width="1.2" opacity="0.15" />

        <!-- Giant Royal Gold Seal Watermark -->
        <g transform="translate(1000, 315)" opacity="0.09">
          <circle cx="0" cy="0" r="220" fill="none" stroke="#F59E0B" stroke-width="10" />
          <circle cx="0" cy="0" r="180" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,6" />
          <text x="0" y="70" font-size="190" font-weight="900" fill="#F59E0B" text-anchor="middle">👑</text>
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#FCD34D" opacity="0.50" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  ROYAL GOLD DESK</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#FDE68A" opacity="0.32" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP 24K BULLION &amp; JEWELRY INTELLIGENCE</text>
        </g>
      `;
    }

    // 7. CRUDE OIL THEME: Titanium Carbon & Petro Energy Flares
    if (category === 'oil' || sym.includes('OIL') || sym.includes('BRENT') || sym.includes('WTI') || sym.includes('نفت')) {
      return `
        <!-- CRUDE OIL BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#040810" />
        <circle cx="160" cy="140" r="320" fill="#0284C7" opacity="0.14" />
        <circle cx="1020" cy="500" r="360" fill="#D97706" opacity="0.14" />

        <!-- Industrial Flow Lines -->
        <path d="M 0 130 L 1200 130 M 0 520 L 1200 520" stroke="#38BDF8" stroke-width="1" opacity="0.12" stroke-dasharray="8,6" />
        
        <!-- Giant Oil Barrel / Droplet Watermark -->
        <g transform="translate(1000, 310)" opacity="0.08">
          <text x="0" y="100" font-size="240" text-anchor="middle">🛢️</text>
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#7DD3FC" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  GLOBAL ENERGY DESK</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#93C5FD" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP COMMODITIES &amp; PETROLEUM</text>
        </g>
      `;
    }

    // 8. US DOLLAR THEME: Wall Street Deep Navy & Banknote Stars
    if (sym === 'USD' || sym === 'DOLLAR' || sym.includes('دلار')) {
      return `
        <!-- US DOLLAR BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#040C1A" />
        <circle cx="180" cy="140" r="350" fill="#1E3A8A" opacity="0.22" />
        <circle cx="1020" cy="480" r="380" fill="#047857" opacity="0.16" />

        <!-- Federal Currency Wave -->
        <path d="M 0 120 C 400 60, 800 180, 1200 120 M 0 530 C 400 470, 800 590, 1200 530" fill="none" stroke="#22C55E" stroke-width="1.2" opacity="0.14" />
        
        <!-- Giant Federal Reserve $ Watermark -->
        <g transform="translate(1000, 320)" opacity="0.09">
          <circle cx="0" cy="0" r="210" fill="none" stroke="#22C55E" stroke-width="8" />
          <text x="0" y="85" font-size="250" font-weight="900" fill="#22C55E" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif">$</text>
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#86EFAC" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  US DOLLAR FOREX</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#BBF7D0" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP INTERNATIONAL CURRENCY DESK</text>
        </g>
      `;
    }

    // 9. EURO THEME: Midnight Blue & 12 Stars Constellation
    if (sym.includes('EUR') || sym.includes('یورو')) {
      return `
        <!-- EURO BRAND THEME -->
        <rect width="${width}" height="${height}" fill="#040B1E" />
        <circle cx="180" cy="140" r="350" fill="#1D4ED8" opacity="0.22" />
        <circle cx="1020" cy="480" r="380" fill="#2563EB" opacity="0.16" />

        <!-- 12 Stars Ring Watermark -->
        <g transform="translate(1000, 310)" opacity="0.12">
          <circle cx="0" cy="0" r="210" fill="none" stroke="#FBBF24" stroke-width="4" stroke-dasharray="8,14" />
          <text x="0" y="75" font-size="230" font-weight="900" fill="#FBBF24" text-anchor="middle">€</text>
        </g>

        <!-- Brand Headers -->
        <g transform="translate(600, 48)">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#93C5FD" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  EURO FOREX DESK</text>
        </g>
        <g transform="translate(600, 648)">
          <text x="0" y="0" font-size="16" font-weight="800" fill="#BFDBFE" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP EUROPEAN FINANCIAL MARKETS</text>
        </g>
      `;
    }

    // 10. DEFAULT LUXURY THEME: Deep Obsidian Matte with Neon Brand Signature
    return `
      <!-- UNIVERSAL BRAND THEME -->
      <rect width="${width}" height="${height}" fill="#070A12" />
      <circle cx="160" cy="140" r="320" fill="#3B82F6" opacity="0.16" />
      <circle cx="1020" cy="500" r="360" fill="#8B5CF6" opacity="0.16" />

      <!-- Minimalist Grid Lines -->
      <path d="M 0 140 L 1200 140 M 0 520 L 1200 520" stroke="#60A5FA" stroke-width="1" opacity="0.10" stroke-dasharray="8,6" />

      <!-- Brand Headers -->
      <g transform="translate(600, 48)">
        <text x="0" y="0" font-size="20" font-weight="900" fill="#93C5FD" opacity="0.45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="14">MODASR ARZ  •  FINANCIAL VIP</text>
      </g>
      <g transform="translate(600, 648)">
        <text x="0" y="0" font-size="16" font-weight="800" fill="#DDD6FE" opacity="0.30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASRP TRADING INTELLIGENCE</text>
      </g>
    `;
  }

  /**
   * Render single asset graphic card matching the exact visual style in the uploaded screenshot
   * Features:
   * 1. Small coin photo/logo next to asset name
   * 2. Currency flag for the unit (Iran flag for Toman, US flag for USD, etc.)
   * 3. Custom luxury themed background for each asset with MODASR ARZ brand
   * 4. 5 Y-axis corner price levels on the left
   * 5. Smooth 7-day curve, live point dot, and watermark
   */
  static async renderSingleCardPng(asset: CardAssetData, watermarkTag?: string): Promise<Buffer> {
    const watermark = watermarkTag || BotStorage.getAdConfig().watermarkTag || '@MODASR_ARZ | MODASRP';
    const sym = (asset.symbol || '').toUpperCase().trim();

    // Determine Currency & Flag
    let isToman = true;
    let currencyUnitLabel = 'تومان';
    let countryCode: 'IR' | 'US' | 'EU' | 'GB' | 'AE' | 'TR' = 'IR';
    let currencyBadgeText = 'IRT';
    let priceNumberFormatted = '0';

    if (asset.priceToman && asset.priceToman > 0) {
      priceNumberFormatted = Math.round(asset.priceToman).toLocaleString('en-US');
      currencyUnitLabel = 'تومان';
      countryCode = 'IR';
      currencyBadgeText = 'IRT';
      isToman = true;
    } else if (asset.priceUsd && asset.priceUsd > 0) {
      priceNumberFormatted = asset.priceUsd >= 1000
        ? asset.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : asset.priceUsd >= 1
        ? asset.priceUsd.toFixed(2)
        : asset.priceUsd.toFixed(4);
      currencyUnitLabel = 'دلار';
      countryCode = 'US';
      currencyBadgeText = 'USD';
      isToman = false;
    } else {
      priceNumberFormatted = '0';
      currencyUnitLabel = 'تومان';
      countryCode = 'IR';
      currencyBadgeText = 'IRT';
      isToman = true;
    }

    if (sym === 'USD' || sym === 'DOLLAR' || sym === 'دلار') {
      countryCode = 'US';
      currencyBadgeText = 'USD';
    } else if (sym === 'USDT' || sym === 'TETHER' || sym === 'تتر') {
      countryCode = 'IR';
      currencyBadgeText = 'USDT';
    } else if (sym.includes('EUR') || sym.includes('یورو')) {
      countryCode = 'EU';
      currencyBadgeText = 'EUR';
    } else if (sym.includes('GBP') || sym.includes('پوند')) {
      countryCode = 'GB';
      currencyBadgeText = 'GBP';
    } else if (sym.includes('AED') || sym.includes('درهم')) {
      countryCode = 'AE';
      currencyBadgeText = 'AED';
    } else if (sym.includes('TRY') || sym.includes('لیر')) {
      countryCode = 'TR';
      currencyBadgeText = 'TRY';
    }

    // Flags: Top capsule flag represents the asset/currency, mini flag represents price unit (Toman = IR)
    const capsuleFlagSvg = this.getCurrencyFlagSvg(countryCode, 30, 20);
    const unitFlagSvg = this.getCurrencyFlagSvg(isToman ? 'IR' : countryCode, 24, 16);

    // Coin Logo: Small crisp emblem (38px) next to name (Requested: عکس ارز ها بغل اسمشون کوچیک باشه)
    const coinLogoSvg = this.getCoinEmblemSvg(asset.symbol, asset.category, 38);

    // Chart Base Price & 7-Day Chart points
    const baseChartPrice = (asset.priceToman && asset.priceToman > 0)
      ? asset.priceToman
      : (asset.priceUsd || 100);

    const chart = asset.chartData || await PriceService.get7DayChartData(
      asset.symbol,
      baseChartPrice,
      asset.changePercent,
      asset.category
    );

    const isPositive = asset.changePercent >= 0;
    const changeColor = isPositive ? '#16A34A' : '#EF4444';
    const changeBgColor = isPositive ? '#DCFCE7' : '#FEE2E2';
    const changeSign = isPositive ? '+' : '';
    const changeText = `${changeSign}${asset.changePercent.toFixed(2)}%`;

    // Canvas & Card Dimensions
    const canvasWidth = 1200;
    const canvasHeight = 675;

    const cardX = 75;
    const cardY = 75;
    const cardWidth = 1050;
    const cardHeight = 515;

    // Chart Coordinates inside Floating Card
    const chartLeft = 115;
    const chartRight = 1045;
    const chartWidth = chartRight - chartLeft;
    const chartTop = 350;
    const chartBottom = 555;
    const chartHeight = chartBottom - chartTop;

    // Min & Max with 8% breathing room
    let rawMin = Math.min(...chart.points);
    let rawMax = Math.max(...chart.points);
    if (rawMax === rawMin) {
      rawMax = rawMax * 1.05;
      rawMin = rawMin * 0.95;
    }
    const padding = (rawMax - rawMin) * 0.08;
    const minVal = Math.max(0, Math.round(rawMin - padding));
    const maxVal = Math.round(rawMax + padding);
    const range = (maxVal - minVal) || 1;

    // 5 Guide Lines and 5 Left Corner Price Labels (Requested by user: نگا مثل این ی گوشه قیمت هارو هم زده)
    let gridSvg = '';
    for (let i = 0; i < 5; i++) {
      const frac = i / 4;
      const y = chartTop + frac * chartHeight;
      const val = Math.round(maxVal - frac * range);
      const valFormatted = val >= 1000
        ? val.toLocaleString('en-US')
        : val.toFixed(2);

      gridSvg += `
        <!-- Guide Line ${i + 1} -->
        <line x1="${chartLeft}" y1="${y.toFixed(1)}" x2="${chartRight}" y2="${y.toFixed(1)}" stroke="#E2E8F0" stroke-width="1.2" stroke-opacity="0.85" />
        <!-- Corner Price Label ${i + 1} -->
        <text x="${chartLeft}" y="${(y - 8).toFixed(1)}" font-size="13" font-weight="700" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif">${valFormatted}</text>
      `;
    }

    // Smooth Bezier Curve from 7-day data points
    const points = chart.points;
    const coords = points.map((p, i) => {
      const x = chartLeft + (i / (points.length - 1)) * chartWidth;
      const clampedP = Math.max(minVal, Math.min(maxVal, p));
      const y = chartBottom - ((clampedP - minVal) / range) * chartHeight;
      return { x, y };
    });

    let linePathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) / 2;
      const cpy2 = curr.y;
      linePathD += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }

    const lastCoord = coords[coords.length - 1];
    const firstCoord = coords[0];
    const areaPathD = `${linePathD} L ${lastCoord.x.toFixed(1)} ${chartBottom} L ${firstCoord.x.toFixed(1)} ${chartBottom} Z`;

    const areaGradColor = isPositive ? '#16A34A' : '#EF4444';

    // Themed Background with Brand (Requested: ارز ها تم خوشگل خفن با برند ما باشه برای هر کدوم از ارز ها برای پس زمینه)
    const backgroundSvg = this.getThemedBackgroundSvg(asset.symbol, asset.category, canvasWidth, canvasHeight, watermark);

    const assetDisplayName = asset.name || asset.symbol;

    const svg = `
    <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Soft Dual-Stage Ambient Shadow for Glass Card -->
        <filter id="floatShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.35" />
          <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.15" />
        </filter>

        <!-- Gradient Fill for 7-Day Chart Area -->
        <linearGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${areaGradColor}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${areaGradColor}" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- 1. Themed Background Generated for this Specific Currency with MODASR ARZ Brand -->
      ${backgroundSvg}

      <!-- 2. Main White Frosted Floating Glass Card -->
      <g filter="url(#floatShadow)">
        <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="42" ry="42" fill="#FFFFFF" fill-opacity="0.95" stroke="#FFFFFF" stroke-width="2.5" />
      </g>

      <!-- 3. TOP LEFT: Currency Capsule with Flag (Requested: بعد واحد پول پرچم باشه) -->
      <g transform="translate(115, 115)">
        <rect x="0" y="0" width="124" height="52" rx="26" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.4" />
        <!-- National Flag Icon inside capsule -->
        <g transform="translate(14, 16)">
          ${capsuleFlagSvg}
        </g>
        <!-- Currency code -->
        <text x="82" y="34" font-size="20" font-weight="900" fill="#334155" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.5">${this.escapeXml(currencyBadgeText)}</text>
      </g>

      <!-- 4. TOP RIGHT: Small Coin Photo/Emblem right next to Name (Requested: عکس ارز ها بغل اسمشون کوچیک باشه) -->
      <g transform="translate(1045, 142)">
        <!-- Persian Asset Name (Right-to-Left aligned) -->
        <text x="-52" y="5" font-size="32" font-weight="900" fill="#0F172A" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">${this.escapeXml(assetDisplayName)}</text>
        
        <!-- Small Crisp Coin Logo Emblem (38px diameter) -->
        <g transform="translate(-19, -2)">
          ${coinLogoSvg}
        </g>
      </g>

      <!-- 5. MAIN PROMINENT LIVE PRICE & UNIT WITH FLAG (Requested: بعد واحد پول پرچم باشه) -->
      <g transform="translate(1045, 255)">
        <!-- Live Price Number in Large Typography -->
        <text x="0" y="0" font-size="74" font-weight="900" fill="#0F172A" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-1">${this.escapeXml(priceNumberFormatted)}</text>
        
        <!-- Unit Label + Mini Flag Icon right beside price -->
        <g transform="translate(${(-1 * (priceNumberFormatted.length * 40 + 20)).toFixed(1)}, -38)">
          <!-- Mini Currency Flag -->
          <g transform="translate(-32, 10)">
            ${unitFlagSvg}
          </g>
          <!-- Currency Name (تومان / دلار) -->
          <text x="-40" y="26" font-size="32" font-weight="800" fill="#475569" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">${this.escapeXml(currencyUnitLabel)}</text>
        </g>
      </g>

      <!-- 6. 24H CHANGE BADGE PILL (Directly beneath the price) -->
      <g transform="translate(1045, 305)">
        <circle cx="-135" cy="-8" r="16" fill="${changeBgColor}" />
        <path d="${isPositive ? 'M -140 -4 L -135 -10 L -130 -4' : 'M -140 -12 L -135 -6 L -130 -12'}" fill="none" stroke="${changeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        
        <rect x="-110" y="-24" width="110" height="32" rx="16" fill="${changeBgColor}" />
        <text x="-55" y="-3" font-size="18" font-weight="800" fill="${changeColor}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${this.escapeXml(changeText)}</text>
      </g>

      <!-- 7. 5 GUIDE LINES & 5 LEFT CORNER PRICE LABELS (Requested: نگا مثل این ی گوشه قیمت هارو هم زده) -->
      ${gridSvg}

      <!-- 8. Translucent Area Fill Under 7-Day Curve -->
      <path d="${areaPathD}" fill="url(#curveAreaGrad)" />

      <!-- 9. Smooth 7-Day Bezier Curve -->
      <path d="${linePathD}" fill="none" stroke="${changeColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- 10. Glowing Solid Round Dot at Current Live Price (Far Right Edge) -->
      <circle cx="${lastCoord.x}" cy="${lastCoord.y}" r="12" fill="${changeColor}" opacity="0.3" />
      <circle cx="${lastCoord.x}" cy="${lastCoord.y}" r="7.5" fill="${changeColor}" />
      <circle cx="${lastCoord.x}" cy="${lastCoord.y}" r="3.5" fill="#FFFFFF" />

      <!-- 11. Centered Watermark Tag with Brand & Channel -->
      <text x="${canvasWidth / 2}" y="635" font-size="19" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1">${this.escapeXml(watermark)}</text>
    </svg>
    `;

    return await sharp(Buffer.from(svg))
      .png({ quality: 95 })
      .toBuffer();
  }

  /**
   * Render 3x3 Grid Overview Card
   */
  static async renderGridOverviewPng(assets: CardAssetData[], watermarkTag?: string): Promise<Buffer> {
    const watermark = watermarkTag || BotStorage.getAdConfig().watermarkTag || '@MODASR_ARZ | MODASRP';
    
    // Pick 9 top representative assets
    const displayAssets = assets.slice(0, 9);
    while (displayAssets.length < 9) {
      displayAssets.push({
        name: 'Asset',
        symbol: 'USDT',
        priceUsd: 1.0,
        changePercent: 0.0,
      });
    }

    const cardWidth = 360;
    const cardHeight = 220;
    const startX = 50;
    const startY = 40;
    const gapX = 35;
    const gapY = 30;

    let cardsSvg = '';

    for (let i = 0; i < 9; i++) {
      const asset = displayAssets[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const isPositive = asset.changePercent >= 0;
      const changeColor = isPositive ? '#16A34A' : '#DC2626';
      const changeSign = isPositive ? '+' : '';
      const changeText = `${changeSign}${asset.changePercent.toFixed(2)}%`;
      
      let priceStr = '0';
      if (asset.priceToman && asset.priceToman > 0) {
        priceStr = `${Math.round(asset.priceToman).toLocaleString('en-US')} Toman`;
      } else if (asset.priceUsd && asset.priceUsd > 0) {
        priceStr = `$${asset.priceUsd >= 1000 ? asset.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : asset.priceUsd.toFixed(2)}`;
      }

      const coinEmblem = this.getCoinEmblemSvg(asset.symbol, asset.category, 30);

      cardsSvg += `
      <!-- Card ${i + 1} (${asset.symbol}) -->
      <g>
        <!-- Rounded Card Base -->
        <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="28" ry="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.8" filter="url(#miniShadow)" />

        <!-- Header: Logo Circle + Name -->
        <g transform="translate(${x + cardWidth / 2}, ${y + 36})">
          <g transform="translate(-60, 0)">
            ${coinEmblem}
          </g>
          <text x="-35" y="6" font-size="18" font-weight="bold" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif">${asset.name || asset.symbol}</text>
        </g>

        <!-- Main Price -->
        <text x="${x + cardWidth / 2}" y="${y + 115}" font-size="32" font-weight="800" fill="#0F172A" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5">${priceStr}</text>

        <!-- Change % -->
        <text x="${x + cardWidth / 2}" y="${y + 165}" font-size="18" font-weight="800" fill="${changeColor}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${changeText}</text>
      </g>
      `;
    }

    const totalWidth = 1240;
    const totalHeight = 880;

    const fullSvg = `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="miniShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0F172A" flood-opacity="0.14" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.06" />
        </filter>
      </defs>

      <!-- Background Canvas -->
      <rect width="${totalWidth}" height="${totalHeight}" fill="#0B0F19" />

      <!-- Brand Header -->
      <text x="${totalWidth / 2}" y="30" font-size="16" font-weight="900" fill="#64748B" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="8">MODASR ARZ  •  MARKET OVERVIEW</text>

      <!-- 9 Cards -->
      ${cardsSvg}

      <!-- Bottom Channel Watermark -->
      <text x="${totalWidth / 2}" y="${totalHeight - 25}" font-size="19" font-weight="bold" fill="#94A3B8" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1">${watermark}</text>
    </svg>
    `;

    return await sharp(Buffer.from(fullSvg))
      .png({ quality: 95 })
      .toBuffer();
  }
}
