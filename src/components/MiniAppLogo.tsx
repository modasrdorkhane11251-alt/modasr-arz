import React, { useState } from 'react';

interface MiniAppLogoProps {
  logoUrl?: string;
  size?: number;
  className?: string;
  alt?: string;
}

export const MiniAppLogo: React.FC<MiniAppLogoProps> = ({
  logoUrl,
  size = 48,
  className = '',
  alt = 'mini MODASR arz',
}) => {
  const [loadError, setLoadError] = useState(false);

  // If a custom URL or uploaded base64 image exists and hasn't failed to load
  if (logoUrl && logoUrl.trim() && !loadError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-2xl overflow-hidden shadow-xl border border-amber-500/40 bg-slate-950 flex-shrink-0 flex items-center justify-center ${className}`}
      >
        <img
          src={logoUrl}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover object-center transition-transform hover:scale-105"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // Default Pristine 3D Gold & Black Luxury Brand Icon (Matching user's exact grok brand art)
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl overflow-hidden shadow-xl shadow-amber-500/20 border border-amber-500/40 bg-gradient-to-b from-[#0A0E17] via-[#111827] to-[#05070D] flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" className="w-full h-full">
        <defs>
          {/* Golden 3D Gradients */}
          <linearGradient id="brandGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9A6" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6200" />
          </linearGradient>
          <linearGradient id="brandGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="100%" stopColor="#E5B824" />
          </linearGradient>
          <linearGradient id="brandOilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="50%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#0B0F19" />
          </linearGradient>
          <radialGradient id="sunbeam" cx="0%" cy="0%" r="90%">
            <stop offset="0%" stopColor="#FFDF73" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Dark Luxury Backdrop with Golden Light Ray */}
        <rect width="100" height="100" fill="#070A12" />
        <circle cx="0" cy="0" r="90" fill="url(#sunbeam)" />

        {/* 3D Gold Typography: "mini" */}
        <text
          x="50"
          y="23"
          fontSize="15"
          fontWeight="900"
          fontFamily="'Arial Black', sans-serif"
          fill="url(#brandGoldGrad)"
          stroke="#4D3600"
          strokeWidth="0.8"
          textAnchor="middle"
          filter="url(#goldGlow)"
          letterSpacing="0.5"
        >
          mini
        </text>

        {/* 3D Gold Typography: "MODASR ARZ" */}
        <text
          x="50"
          y="37"
          fontSize="11.5"
          fontWeight="900"
          fontFamily="'Arial Black', sans-serif"
          fill="url(#brandGoldGrad)"
          stroke="#382500"
          strokeWidth="0.7"
          textAnchor="middle"
          filter="url(#goldGlow)"
          letterSpacing="0.3"
        >
          MODASR ARZ
        </text>

        {/* Golden Filigree Star divider */}
        <path d="M25 42 L42 42 M58 42 L75 42" stroke="#D4AF37" strokeWidth="0.8" opacity="0.8" />
        <polygon points="50,39 52,42 55,42 52.5,44 53.5,47 50,45 46.5,47 47.5,44 45,42 48,42" fill="#FFE57F" />

        {/* Stacked Gold Ingot Bars on Left */}
        <g filter="url(#goldGlow)">
          <polygon points="12,56 46,56 42,69 8,69" fill="url(#brandGoldLight)" stroke="#5E4300" strokeWidth="0.4" />
          <polygon points="8,69 42,69 38,82 4,82" fill="url(#brandGoldGrad)" stroke="#5E4300" strokeWidth="0.4" />
          <text x="24" y="65" fontSize="4.5" fontWeight="900" fill="#422D00" fontFamily="sans-serif">999.9</text>
        </g>

        {/* ARZ OIL Barrel on Right */}
        <g filter="url(#goldGlow)">
          <rect x="58" y="48" width="30" height="36" rx="3" fill="url(#brandOilGrad)" stroke="#4A5568" strokeWidth="0.8" />
          <ellipse cx="73" cy="50" rx="14" ry="3" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
          {/* Golden Oil Drop */}
          <path d="M73 60 C73 60 67 66 67 70 C67 73.3 69.7 76 73 76 C76.3 76 79 73.3 79 70 C79 66 73 60 73 60 Z" fill="url(#brandGoldGrad)" />
          <text x="73" y="80" fontSize="3.5" fontWeight="900" fill="#E2E8F0" textAnchor="middle" fontFamily="sans-serif">ARZ OIL</text>
        </g>

        {/* Bitcoin & Ethereum & Gold Coin in Foreground */}
        <circle cx="24" cy="85" r="11" fill="#F7931A" stroke="#FFFFFF" strokeWidth="0.6" filter="url(#goldGlow)" />
        <text x="24" y="89" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">₿</text>

        <circle cx="50" cy="86" r="10" fill="#627EEA" stroke="#FFFFFF" strokeWidth="0.6" filter="url(#goldGlow)" />
        <path d="M50 78 L45 86 L50 89 L55 86 Z" fill="#FFFFFF" opacity="0.9" />

        <circle cx="76" cy="87" r="9" fill="url(#brandGoldGrad)" stroke="#FFE885" strokeWidth="0.6" filter="url(#goldGlow)" />
        <text x="76" y="90.5" fontSize="6.5" fontWeight="900" fill="#472F00" textAnchor="middle" fontFamily="'Vazirmatn', sans-serif">۱۳۸۶</text>
      </svg>
    </div>
  );
};
