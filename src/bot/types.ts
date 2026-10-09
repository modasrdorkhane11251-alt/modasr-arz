export interface ChannelPosterConfig {
  isEnabled: boolean;
  channelId: string;
  intervalMinutes: number;
  postMode: 'image_card_and_summary' | 'text_summary' | 'grid_overview';
  lastPostTime?: number;
  lastPostStatus?: string;
  lastPostError?: string;
}

export interface AdminAlertConfig {
  isEnabled: boolean;
  adminId: number | string;
  notifyOnApiErrors: boolean;
  notifyOnTelegramErrors: boolean;
  notifyOnChannelErrors: boolean;
  notifyOnUserBugReports: boolean;
  minSeverity: 'all' | 'critical' | 'bugs_only';
  rateLimitMinutes: number;
}

export const DEFAULT_ADMIN_ALERT_CONFIG: AdminAlertConfig = {
  isEnabled: true,
  adminId: 0,
  notifyOnApiErrors: true,
  notifyOnTelegramErrors: true,
  notifyOnChannelErrors: true,
  notifyOnUserBugReports: true,
  minSeverity: 'all',
  rateLimitMinutes: 2,
};

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'incoming_msg' | 'outgoing_msg' | 'callback' | 'webhook_event' | 'system';
  userId?: number | string;
  chatId?: number | string;
  username?: string;
  text?: string;
  response?: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export type ButtonType = 'url' | 'add_to_group' | 'miniapp' | 'channel';
export type ButtonColorTheme =
  | 'telegram_blue'
  | 'telegram_green'
  | 'telegram_red'
  | 'telegram_glass'
  | 'telegram_light_blue'
  | 'telegram_premium'
  | 'telegram_orange'
  | 'telegram_cyan'
  | 'telegram_pink'
  | 'telegram_dark'
  | 'telegram_graphite'
  | 'glass'
  | 'emerald'
  | 'blue'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'orange'
  | 'dark';

export interface CustomButtonItem {
  id: string;
  text: string;
  url: string;
  type: ButtonType;
  colorTheme: ButtonColorTheme;
  hexColor?: string; // Custom Hex Color Code (e.g. #2481CC, #31B545, #7257FF)
  iconEmoji: string;
  premiumEmojiId?: string;
  isEnabled: boolean;
  row: number; // Row index (1, 2, 3...) for inline keyboard
  showInGroup: boolean; // default true
  showInPrivate: boolean; // default true
  showInChannel: boolean; // default true
}

export interface KeyboardThemeConfig {
  isEnabled: boolean;
  activePreset: string;
  primaryHex: string; // Default & general buttons (e.g. #2481CC)
  groupBtnHex: string; // Add to Group button (e.g. #31B545)
  miniAppBtnHex: string; // Mini App button (e.g. #00B4D8)
  channelBtnHex: string; // Channel button (e.g. #7257FF)
  alertBtnHex: string; // Report/Alert button (e.g. #E53935)
  vipBtnHex: string; // VIP/Stars button (e.g. #FF9500)
  showColorBadgesInPrivate: boolean;
  showColorBadgesInGroups: boolean;
  showColorBadgesInChannel: boolean;
  customHexList: string[]; // Admin's favorite saved custom HEX codes
}

export const DEFAULT_KEYBOARD_THEME_CONFIG: KeyboardThemeConfig = {
  isEnabled: true,
  activePreset: 'telegram_official',
  primaryHex: '#2481CC',
  groupBtnHex: '#31B545',
  miniAppBtnHex: '#00B4D8',
  channelBtnHex: '#7257FF',
  alertBtnHex: '#E53935',
  vipBtnHex: '#FF9500',
  showColorBadgesInPrivate: true,
  showColorBadgesInGroups: true,
  showColorBadgesInChannel: true,
  customHexList: ['#2481CC', '#31B545', '#7257FF', '#00B4D8', '#FF9500', '#E53935', '#FF2D55', '#2AABEE'],
};

export const KEYBOARD_THEME_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<KeyboardThemeConfig>;
}> = [
  {
    id: 'telegram_official',
    name: '🌟 تم رسمی و استاندارد تلگرام (Telegram Official)',
    description: 'رنگ‌های رسمی و هماهنگ با اپلیکیشن تلگرام (آبی اصلی، سبز وریفای، بنفش پرمیوم، فیروزه‌ای)',
    icon: '✈️',
    config: {
      primaryHex: '#2481CC',
      groupBtnHex: '#31B545',
      miniAppBtnHex: '#00B4D8',
      channelBtnHex: '#7257FF',
      alertBtnHex: '#E53935',
      vipBtnHex: '#FF9500',
    },
  },
  {
    id: 'crypto_neon',
    name: '💎 تم کریپتو و نئونی سایبرپانک (Crypto Neon)',
    description: 'رنگ‌های شاداب نئونی، فیروزه‌ای الماسی، بنفش نئونی و سبز زمردی تریدینگ',
    icon: '⚡',
    config: {
      primaryHex: '#00F0FF',
      groupBtnHex: '#00FF66',
      miniAppBtnHex: '#7000FF',
      channelBtnHex: '#FF0055',
      alertBtnHex: '#FF3366',
      vipBtnHex: '#FFE600',
    },
  },
  {
    id: 'gold_luxury',
    name: '👑 تم طلایی و سلطنتی صرافی (Gold & Luxury)',
    description: 'تم اختصاصی طلا، ارز و صرافی با طیف‌های طلایی کهربایی، مسکوکات و سرمه‌ای لوکس',
    icon: '🪙',
    config: {
      primaryHex: '#E5A93C',
      groupBtnHex: '#10B981',
      miniAppBtnHex: '#F59E0B',
      channelBtnHex: '#D97706',
      alertBtnHex: '#DC2626',
      vipBtnHex: '#FBBF24',
    },
  },
  {
    id: 'emerald_matrix',
    name: '🟢 تم سبز زمردی و معاملاتی (Trading Emerald)',
    description: 'تم سرسبز و صعودی بازارهای مالی و بورس با سبزهای فسفری و الماسی',
    icon: '📈',
    config: {
      primaryHex: '#10B981',
      groupBtnHex: '#22C55E',
      miniAppBtnHex: '#06B6D4',
      channelBtnHex: '#14B8A6',
      alertBtnHex: '#EF4444',
      vipBtnHex: '#EAB308',
    },
  },
  {
    id: 'telegram_dark_slate',
    name: '🌙 تم تیره و متالیک گرافیت (Telegram Night Dark)',
    description: 'طیف رنگ‌های تیره متالیک، شب و تیتانیومی مناسب چت‌های با تم دارک',
    icon: '🖤',
    config: {
      primaryHex: '#384B5E',
      groupBtnHex: '#2E7D32',
      miniAppBtnHex: '#1565C0',
      channelBtnHex: '#6A1B9A',
      alertBtnHex: '#C62828',
      vipBtnHex: '#EF6C00',
    },
  },
];

export interface HexColorPreset {
  name: string;
  hex: string;
  badge: string;
  theme: ButtonColorTheme;
  isTelegramOfficial?: boolean;
}

export const HEX_COLOR_PRESETS: HexColorPreset[] = [
  // ⭐️ ۳ رنگ اصلی تلگرام (قرمز، سبز، آبی) + شیشه‌ای کلاسیک
  { name: 'آبی اصلی تلگرام (Telegram Blue)', hex: '#2481CC', badge: '🔵', theme: 'telegram_blue', isTelegramOfficial: true },
  { name: 'سبز رسمی تلگرام (Verified Green)', hex: '#31B545', badge: '🟢', theme: 'telegram_green', isTelegramOfficial: true },
  { name: 'قرمز اخطار تلگرام (Telegram Red)', hex: '#E53935', badge: '🔴', theme: 'telegram_red', isTelegramOfficial: true },
  { name: 'شیشه‌ای شفاف تلگرام (Classic Glass)', hex: '#242F3D', badge: '▫️', theme: 'telegram_glass', isTelegramOfficial: true },
  { name: 'بنفش تلگرام پرمیوم (Telegram Premium)', hex: '#7257FF', badge: '🟣', theme: 'telegram_premium', isTelegramOfficial: true },
  { name: 'فیروزه‌ای الماسی تلگرام (Telegram Cyan)', hex: '#00B4D8', badge: '💎', theme: 'telegram_cyan', isTelegramOfficial: true },
  { name: 'نارنجی ستاره تلگرام (Telegram Stars)', hex: '#FF9500', badge: '⭐️', theme: 'telegram_orange', isTelegramOfficial: true },
  { name: 'آبی روشن تلگرام (Telegram Light Blue)', hex: '#2AABEE', badge: '🔷', theme: 'telegram_light_blue', isTelegramOfficial: true },
  { name: 'صورتی بوست تلگرام (Telegram Boost Pink)', hex: '#FF2D55', badge: '💖', theme: 'telegram_pink', isTelegramOfficial: true },
  { name: 'تم شب تیره تلگرام (Telegram Night Mode)', hex: '#0E1621', badge: '🌙', theme: 'telegram_dark', isTelegramOfficial: true },
];

export interface AdConfig {
  buttonText: string;
  buttonUrl: string;
  headerIntro: string;
  isEnabled: boolean;
  enableCharts: boolean;
  watermarkTag: string;
  customButtons: CustomButtonItem[];
  miniAppLogoUrl?: string;
  miniAppBannerUrl?: string;
  miniAppTitle?: string;
  miniAppSubtitle?: string;
}

export const DEFAULT_CUSTOM_BUTTONS: CustomButtonItem[] = [
  {
    id: 'btn_ad_1',
    text: 'خرید سرور ساعتی ↗',
    url: 'https://t.me/MODASR_ARZ',
    type: 'url',
    colorTheme: 'telegram_blue',
    hexColor: '#2481CC',
    iconEmoji: '💻',
    isEnabled: true,
    row: 1,
    showInGroup: true,
    showInPrivate: true,
    showInChannel: true,
  },
  {
    id: 'btn_add_group',
    text: 'افزودن به گروه +',
    url: 'https://t.me/Modasr_Arzbot?startgroup=start',
    type: 'add_to_group',
    colorTheme: 'telegram_green',
    hexColor: '#31B545',
    iconEmoji: '👾',
    isEnabled: true,
    row: 2,
    showInGroup: true,
    showInPrivate: true,
    showInChannel: true,
  },
  {
    id: 'btn_miniapp',
    text: 'mini MODASR arz (تابلوی زنده قیمت‌ها)',
    url: '',
    type: 'miniapp',
    colorTheme: 'telegram_glass',
    hexColor: '#242F3D',
    iconEmoji: '📱',
    isEnabled: true,
    row: 3,
    showInGroup: true,
    showInPrivate: true,
    showInChannel: false,
  },
  {
    id: 'btn_channel',
    text: 'عضویت در کانال رسمی',
    url: 'https://t.me/MODASR_ARZ',
    type: 'channel',
    colorTheme: 'telegram_blue',
    hexColor: '#2481CC',
    iconEmoji: '📢',
    isEnabled: true,
    row: 4,
    showInGroup: true,
    showInPrivate: true,
    showInChannel: true,
  },
];

export interface CustomEmojiItem {
  id: string;
  name: string;
  key: string;
  emojiTag: string;
  emojiId?: string;
  category?: 'gold' | 'crypto' | 'fiat' | 'oil' | 'system';
}

export interface EmojiConfig {
  coinEmoji: string;
  tomanEmoji: string;
  dollarEmoji: string;
  highEmoji?: string;
  lowEmoji?: string;
  highLowEmoji: string;
  upEmoji: string;
  downEmoji: string;
  planeEmoji: string;
  items: CustomEmojiItem[];
  customRawText?: string;
}

export const DEFAULT_EMOJI_ITEMS: CustomEmojiItem[] = [
  // طلا و فلزات گرانبها
  { id: 'gold_18k', name: 'طلای ۱۸ عیار (Gold 18K)', key: 'gold', emojiTag: '![🥇](tg://emoji?id=5229235915397801267)', emojiId: '5229235915397801267', category: 'gold' },
  { id: 'gold_24k', name: 'طلای ۲۴ عیار (Gold 24K)', key: 'gold_24k', emojiTag: '![👑](tg://emoji?id=5267500801240092311)', emojiId: '5267500801240092311', category: 'gold' },
  { id: 'gold_used', name: 'طلای دست دوم / متفرقه', key: 'gold_used', emojiTag: '![🥇](tg://emoji?id=5229235915397801267)', emojiId: '5229235915397801267', category: 'gold' },
  { id: 'mazaneh_abshodeh', name: 'مظنه و مثقال / آبشده نقدی طلا', key: 'mazaneh', emojiTag: '![💰](tg://emoji?id=5287231198098117669)', emojiId: '5287231198098117669', category: 'gold' },
  { id: 'gold_ounce', name: 'انس جهانی طلا (Gold Ounce)', key: 'gold_ounce', emojiTag: '![🥇](tg://emoji?id=5229235915397801267)', emojiId: '5229235915397801267', category: 'gold' },
  { id: 'seke_emami', name: 'سکه امامی (تمام طرح جدید)', key: 'seke', emojiTag: '![💰](tg://emoji?id=5807828680877022050)', emojiId: '5807828680877022050', category: 'gold' },
  { id: 'seke_bahar', name: 'سکه بهار آزادی (تمام طرح قدیم)', key: 'seke_bahar', emojiTag: '![💰](tg://emoji?id=5805414501234774753)', emojiId: '5805414501234774753', category: 'gold' },
  { id: 'seke_nim', name: 'نیم سکه بهار آزادی', key: 'seke_nim', emojiTag: '![🪙](tg://emoji?id=5377505475015235101)', emojiId: '5377505475015235101', category: 'gold' },
  { id: 'seke_rob', name: 'ربع سکه بهار آزادی', key: 'seke_rob', emojiTag: '![🪙](tg://emoji?id=5377746319601324795)', emojiId: '5377746319601324795', category: 'gold' },
  { id: 'seke_gerami', name: 'سکه گرمی', key: 'seke_gerami', emojiTag: '![🪙](tg://emoji?id=5379773896352355687)', emojiId: '5379773896352355687', category: 'gold' },
  { id: 'silver_badge', name: 'نقره و شمش نقره (Silver)', key: 'silver', emojiTag: '![🥈](tg://emoji?id=5231469341341393133)', emojiId: '5231469341341393133', category: 'gold' },
  { id: 'silver_ounce', name: 'انس جهانی نقره (Silver Ounce)', key: 'silver_ounce', emojiTag: '![🥈](tg://emoji?id=5231469341341393133)', emojiId: '5231469341341393133', category: 'gold' },

  // نفت و انرژی
  { id: 'oil_brent_barrel', name: 'نفت برنت (Brent Crude)', key: 'oil_brent', emojiTag: '![🛢](tg://emoji?id=6019179941294251937)', emojiId: '6019179941294251937', category: 'oil' },
  { id: 'oil_wti_gas', name: 'نفت خام وست تگزاس (WTI)', key: 'oil_wti', emojiTag: '![🛢](tg://emoji?id=5231053919219623276)', emojiId: '5231053919219623276', category: 'oil' },
  { id: 'gas_natural', name: 'گاز طبیعی (Natural Gas)', key: 'gas', emojiTag: '![🛢](tg://emoji?id=5231053919219623276)', emojiId: '5231053919219623276', category: 'oil' },

  // ارزهای فیات
  { id: 'usdt_badge', name: 'تتر دیجیتال (USDT)', key: 'usdt', emojiTag: '![💵](tg://emoji?id=5321231658156830001)', emojiId: '5321231658156830001', category: 'fiat' },
  { id: 'dollar_cash', name: 'اسکناس دلار نقدی', key: 'dollar', emojiTag: '![💵](tg://emoji?id=5321231658156830001)', emojiId: '5321231658156830001', category: 'fiat' },
  { id: 'usd_flag', name: 'دلار آمریکا (USD)', key: 'usd', emojiTag: '![🇺🇸](tg://emoji?id=5224321781321442532)', emojiId: '5224321781321442532', category: 'fiat' },
  { id: 'eur_flag', name: 'یورو اتحادیه اروپا (EUR)', key: 'eur', emojiTag: '![🇪🇺](tg://emoji?id=5222108911091331711)', emojiId: '5222108911091331711', category: 'fiat' },
  { id: 'gbp_flag', name: 'پوند انگلیس (GBP)', key: 'gbp', emojiTag: '![🇬🇧](tg://emoji?id=5224518800061245598)', emojiId: '5224518800061245598', category: 'fiat' },
  { id: 'aed_flag', name: 'درهم امارات (AED)', key: 'aed', emojiTag: '![🇦🇪](tg://emoji?id=5224419914898486043)', emojiId: '5224419914898486043', category: 'fiat' },
  { id: 'try_flag', name: 'لیر ترکیه (TRY)', key: 'try', emojiTag: '![🇹🇷](tg://emoji?id=5224522953294622116)', emojiId: '5224522953294622116', category: 'fiat' },
  { id: 'cny_flag', name: 'یوان چین (CNY)', key: 'cny', emojiTag: '![🇨🇳](tg://emoji?id=5224435456220868088)', emojiId: '5224435456220868088', category: 'fiat' },
  { id: 'cad_flag', name: 'دلار کانادا (CAD)', key: 'cad', emojiTag: '![🇨🇦](tg://emoji?id=5224422633612788544)', emojiId: '5224422633612788544', category: 'fiat' },
  { id: 'aud_flag', name: 'دلار استرالیا (AUD)', key: 'aud', emojiTag: '![🇦🇺](tg://emoji?id=5224328692041262071)', emojiId: '5224328692041262071', category: 'fiat' },
  { id: 'chf_flag', name: 'فرانک سوئیس (CHF)', key: 'chf', emojiTag: '![🇨🇭](tg://emoji?id=5224514780005411756)', emojiId: '5224514780005411756', category: 'fiat' },

  // کریپتوکارنسی‌ها
  { id: 'btc_badge', name: 'بیت‌کوین (BTC)', key: 'btc', emojiTag: '![🪙](tg://emoji?id=5857272597791641611)', emojiId: '5857272597791641611', category: 'crypto' },
  { id: 'eth_badge', name: 'اتریوم (ETH)', key: 'eth', emojiTag: '![💎](tg://emoji?id=5319302869948596289)', emojiId: '5319302869948596289', category: 'crypto' },
  { id: 'ton_badge', name: 'تون‌کوین (TON)', key: 'ton', emojiTag: '![💎](tg://emoji?id=5834448733558808898)', emojiId: '5834448733558808898', category: 'crypto' },
  { id: 'sol_badge', name: 'سولانا (SOL)', key: 'sol', emojiTag: '![🪙](tg://emoji?id=5832365227743646230)', emojiId: '5832365227743646230', category: 'crypto' },
  { id: 'trx_badge', name: 'ترون (TRX)', key: 'trx', emojiTag: '![🪙](tg://emoji?id=5873230707693723886)', emojiId: '5873230707693723886', category: 'crypto' },
  { id: 'bnb_badge', name: 'بایننس کوین (BNB)', key: 'bnb', emojiTag: '![🪙](tg://emoji?id=5843460704522214890)', emojiId: '5843460704522214890', category: 'crypto' },
  { id: 'xrp_badge', name: 'ریپل (XRP)', key: 'xrp', emojiTag: '![🪙](tg://emoji?id=5816788957614053645)', emojiId: '5816788957614053645', category: 'crypto' },
  { id: 'doge_badge', name: 'دوج‌کوین (DOGE)', key: 'doge', emojiTag: '![🐶](tg://emoji?id=5798505079971517824)', emojiId: '5798505079971517824', category: 'crypto' },
  { id: 'shib_badge', name: 'شیبا اینو (SHIB)', key: 'shib', emojiTag: '![🐶](tg://emoji?id=5857093381691283267)', emojiId: '5857093381691283267', category: 'crypto' },
  { id: 'pepe_badge', name: 'پپه قورباغه (PEPE)', key: 'pepe', emojiTag: '![🐸](tg://emoji?id=5974413793520785169)', emojiId: '5974413793520785169', category: 'crypto' },
  { id: 'not_badge', name: 'نات‌کوین (NOT)', key: 'not', emojiTag: '![💎](tg://emoji?id=5872872125169146997)', emojiId: '5872872125169146997', category: 'crypto' },
  { id: 'dogs_badge', name: 'داگز (DOGS)', key: 'dogs', emojiTag: '![🐶](tg://emoji?id=5857453892656174726)', emojiId: '5857453892656174726', category: 'crypto' },
  { id: 'hmstr_badge', name: 'همستر کمبات (HMSTR)', key: 'hmstr', emojiTag: '![🐹](tg://emoji?id=5998990953598161808)', emojiId: '5998990953598161808', category: 'crypto' },
  { id: 'cati_badge', name: 'کتیزن (CATI)', key: 'cati', emojiTag: '![🐈](tg://emoji?id=6030712035858191224)', emojiId: '6030712035858191224', category: 'crypto' },
  { id: 'major_badge', name: 'ماژور استار (MAJOR)', key: 'major', emojiTag: '![⭐](tg://emoji?id=5267500801240092311)', emojiId: '5267500801240092311', category: 'crypto' },
  { id: 'sui_badge', name: 'سویی (SUI)', key: 'sui', emojiTag: '![💧](tg://emoji?id=5927279100132594978)', emojiId: '5927279100132594978', category: 'crypto' },
  { id: 'ada_badge', name: 'کاردانو (ADA)', key: 'ada', emojiTag: '![🪙](tg://emoji?id=5830054183151080524)', emojiId: '5830054183151080524', category: 'crypto' },
  { id: 'pol_badge', name: 'پالیگان متیک (POL/MATIC)', key: 'pol', emojiTag: '![🪙](tg://emoji?id=5832686985218626355)', emojiId: '5832686985218626355', category: 'crypto' },
  { id: 'ltc_badge', name: 'لایت‌کوین (LTC)', key: 'ltc', emojiTag: '![🪙](tg://emoji?id=5830189813923320318)', emojiId: '5830189813923320318', category: 'crypto' },
  { id: 'bch_badge', name: 'بیت‌کوین کش (BCH)', key: 'bch', emojiTag: '![🪙](tg://emoji?id=5830211267284963918)', emojiId: '5830211267284963918', category: 'crypto' },
  { id: 'link_badge', name: 'چین‌لینک (LINK)', key: 'link', emojiTag: '![🪙](tg://emoji?id=5830209944435037355)', emojiId: '5830209944435037355', category: 'crypto' },
  { id: 'dot_badge', name: 'پولکادات (DOT)', key: 'dot', emojiTag: '![🪙](tg://emoji?id=5830196939274064481)', emojiId: '5830196939274064481', category: 'crypto' },
  { id: 'avax_badge', name: 'آوالانچ (AVAX)', key: 'avax', emojiTag: '![🔺](tg://emoji?id=5832544173261068116)', emojiId: '5832544173261068116', category: 'crypto' },
  { id: 'kas_badge', name: 'کاسپا (KAS)', key: 'kas', emojiTag: '![🪙](tg://emoji?id=5832628066857259387)', emojiId: '5832628066857259387', category: 'crypto' },
  { id: 'wld_badge', name: 'ورلدکوین (WLD)', key: 'wld', emojiTag: '![🌐](tg://emoji?id=5224450179368767019)', emojiId: '5224450179368767019', category: 'crypto' },
  { id: 'floki_badge', name: 'فلوکی اینو (FLOKI)', key: 'floki', emojiTag: '![🐶](tg://emoji?id=5857053799272683081)', emojiId: '5857053799272683081', category: 'crypto' },
  { id: 'bonk_badge', name: 'بونک سولانا (BONK)', key: 'bonk', emojiTag: '![🐶](tg://emoji?id=5798638778008475435)', emojiId: '5798638778008475435', category: 'crypto' },
  { id: 'wif_badge', name: 'داگ ویف هت (WIF)', key: 'wif', emojiTag: '![🐶](tg://emoji?id=5857453892656174726)', emojiId: '5857453892656174726', category: 'crypto' },
  { id: 'arb_badge', name: 'اربیتروم (ARB)', key: 'arb', emojiTag: '![🪙](tg://emoji?id=5830062858985018281)', emojiId: '5830062858985018281', category: 'crypto' },
  { id: 'apt_badge', name: 'آپتوس (APT)', key: 'apt', emojiTag: '![🪙](tg://emoji?id=5832408074337391302)', emojiId: '5832408074337391302', category: 'crypto' },
  { id: 'near_badge', name: 'نیر پروتکل (NEAR)', key: 'near', emojiTag: '![🪙](tg://emoji?id=5830464137779483400)', emojiId: '5830464137779483400', category: 'crypto' },
  { id: 'tia_badge', name: 'سلستیا (TIA)', key: 'tia', emojiTag: '![🪙](tg://emoji?id=5830220067672953346)', emojiId: '5830220067672953346', category: 'crypto' },
  { id: 'uni_badge', name: 'یونی‌سواپ (UNI)', key: 'uni', emojiTag: '![🦄](tg://emoji?id=5829962502779180064)', emojiId: '5829962502779180064', category: 'crypto' },
  { id: 'render_badge', name: 'رندر نتورک (RENDER)', key: 'render', emojiTag: '![🪙](tg://emoji?id=5830269884998619624)', emojiId: '5830269884998619624', category: 'crypto' },
  { id: 'fil_badge', name: 'فایل‌کوین (FIL)', key: 'fil', emojiTag: '![🪙](tg://emoji?id=5832598663511151251)', emojiId: '5832598663511151251', category: 'crypto' },
  { id: 'aave_badge', name: 'آوه دیفای (AAVE)', key: 'aave', emojiTag: '![🪙](tg://emoji?id=5832384443427329235)', emojiId: '5832384443427329235', category: 'crypto' },
  { id: 'mkr_badge', name: 'میکر دائو (MKR)', key: 'mkr', emojiTag: '![🪙](tg://emoji?id=5832658857477805014)', emojiId: '5832658857477805014', category: 'crypto' },
  { id: 'etc_badge', name: 'اتریوم کلاسیک (ETC)', key: 'etc', emojiTag: '![💎](tg://emoji?id=5834757434333208303)', emojiId: '5834757434333208303', category: 'crypto' },
  { id: 'mana_badge', name: 'دیسنترالند (MANA)', key: 'mana', emojiTag: '![🪙](tg://emoji?id=5830338054719542115)', emojiId: '5830338054719542115', category: 'crypto' },
  { id: 'sand_badge', name: 'سندباکس (SAND)', key: 'sand', emojiTag: '![🪙](tg://emoji?id=5830252885518062021)', emojiId: '5830252885518062021', category: 'crypto' },
  { id: 'axs_badge', name: 'اکسی اینفینیتی (AXS)', key: 'axs', emojiTag: '![🪙](tg://emoji?id=5830364516013053161)', emojiId: '5830364516013053161', category: 'crypto' },
  { id: 'algo_badge', name: 'الگورند (ALGO)', key: 'algo', emojiTag: '![🪙](tg://emoji?id=5830180910456115623)', emojiId: '5830180910456115623', category: 'crypto' },
  { id: 'hbar_badge', name: 'هدرا هش‌گراف (HBAR)', key: 'hbar', emojiTag: '![🪙](tg://emoji?id=5832234918435885930)', emojiId: '5832234918435885930', category: 'crypto' },
  { id: 'dai_badge', name: 'استیبل کوین دای (DAI)', key: 'dai', emojiTag: '![💵](tg://emoji?id=5201692367437974073)', emojiId: '5201692367437974073', category: 'crypto' },
  { id: 'usdc_badge', name: 'یو اس دی کوین (USDC)', key: 'usdc', emojiTag: '![💵](tg://emoji?id=5197434882321567830)', emojiId: '5197434882321567830', category: 'crypto' },
  { id: 'fet_badge', name: 'فچ ای‌آی هوش مصنوعی (FET)', key: 'fet', emojiTag: '![🤖](tg://emoji?id=5193177581888755275)', emojiId: '5193177581888755275', category: 'crypto' },
  { id: 'ftm_badge', name: 'فانتوم سونیک (FTM/S)', key: 's', emojiTag: '![👻](tg://emoji?id=5832705496527672453)', emojiId: '5832705496527672453', category: 'crypto' },
  { id: 'coin_default', name: 'ارز دیجیتال عمومی (پیش‌فرض سایر)', key: 'coin', emojiTag: '![🪙](tg://emoji?id=5857272597791641611)', emojiId: '5857272597791641611', category: 'crypto' },

  // علائم سیستمی چارت و پیام
  { id: 'chart_high', name: 'سقف قیمت و بیشترین (High)', key: 'high', emojiTag: '![📈](tg://emoji?id=5197503331215361533)', emojiId: '5197503331215361533', category: 'system' },
  { id: 'chart_low', name: 'کف قیمت و کمترین (Low)', key: 'low', emojiTag: '![📉](tg://emoji?id=5429518319243775957)', emojiId: '5429518319243775957', category: 'system' },
  { id: 'chart_highlow', name: 'صندوق امنیتی سقف و کف (High & Low مشترک)', key: 'highlow', emojiTag: '![🗄](tg://emoji?id=5321371721335338151)', emojiId: '5321371721335338151', category: 'system' },
  { id: 'toman_badge', name: 'نشان قیمت تومانی', key: 'toman', emojiTag: '▫️', category: 'system' },
  { id: 'up_green', name: 'نشان افزایش و رشد قیمت (سبز)', key: 'up', emojiTag: '🟢', category: 'system' },
  { id: 'down_red', name: 'نشان کاهش و افت قیمت (قرمز)', key: 'down', emojiTag: '🔴', category: 'system' },
  { id: 'plane_date', name: 'نشان تاریخ و ساعت پیام', key: 'plane', emojiTag: '✈️', category: 'system' },
];

// ==========================================
// ==========================================
// 8. مرکز جامع مدیریت و پیکربندی APIها
// (مینی‌اپ پاسخ، چنل گزارش، تابلو زنده قیمت‌ها و وب‌هوک‌ها)
// ==========================================
export interface ApiHubConfig {
  // 1. تابلوی زنده قیمت‌ها (Live Price Board) - دارای اتصال ۲ گانه (Dual API)
  priceBoard: {
    primaryProvider: 'fast_creat' | 'tgju' | 'wallex' | 'nobitex' | 'binance' | 'custom';
    goldApiUrl: string; // API 1: طلا و سکه اصلی
    goldSecondaryApiUrl: string; // API 2: طلا و سکه دوم (پشتیبان / جایگزین)
    fiatApiUrl: string; // ارز و اسکناس
    cryptoApiUrl: string; // API 1: کریپتو اصلی (والکس / نوبیتکس)
    cryptoSecondaryApiUrl: string; // API 2: کریپتو دوم (نوبیتکس / بایننس / فست‌کریت)
    oilEnergyApiUrl: string; // نفت و انرژی اصلی
    oilEnergySecondaryApiUrl: string; // نفت و انرژی دوم
    dualApiEnabled: boolean; // فعال‌سازی هر دو API به صورت همزمان
    enforceConfiguredApisOnly: boolean; // فقط و فقط متصل شدن APIهای داده شده
    refreshIntervalSec: number;
    customJsonEndpoint: string;
    apiKeyHeaderName?: string;
    apiKeyHeaderValue?: string;
    enableRechartsTrends: boolean;
  };

  // 2. مینی‌اپ پاسخ و هوش استعلام (Mini-App Response & Engine) - دارای اتصال ۲ گانه
  miniApp: {
    dataEndpoint: string; // API 1: دیتای زنده نرخ‌ها و چارت مینی‌اپ
    responseEndpoint: string; // API 2: وب‌سرویس پاسخ و استعلام هوشمند
    dualApiEnabled: boolean; // فعال‌سازی هر دو API مینی‌اپ پاسخ
    aiQueryEnabled: boolean;
    aiProvider: 'internal_engine' | 'gemini' | 'custom_webhook';
    aiApiKey: string;
    aiSystemPrompt: string;
    refreshIntervalSec: number;
    show24hChartSparklines: boolean;
    autoCacheTtlSec: number;
    customWebhookUrl: string;
  };

  // 3. چنل گزارش و ارسال خودکار (Channel Report & Auto-Broadcast) - دارای اتصال ۲ گانه
  channelReport: {
    isEnabled: boolean;
    botToken: string;
    primaryApiUrl: string; // API 1: تلگرام بات اصلی (ارسال مستقیم)
    secondaryApiUrl: string; // API 2: درگاه دوم / پشتیبان چنل گزارش
    dualApiEnabled: boolean; // ارسال به هر دو یا پشتیبان‌گیری خودکار
    channelUsernameOrId: string;
    secondaryChannelId: string; // کانال دوم یا کانال بکاپ
    postIntervalMinutes: number;
    postTemplateMode: 'image_card_and_summary' | 'text_summary' | 'grid_overview';
    reportTitle: string;
    include24hChange: boolean;
    includeHighLow: boolean;
    includeWatermark: boolean;
    customBroadcastWebhookUrl: string;
  };

  // 4. درگاه‌های عمومی توسعه‌دهنده و وب‌هوک (Developer & System Webhooks) - دارای اتصال ۲ گانه
  developer: {
    adminApiKey: string;
    publicRestApiEnabled: boolean;
    primaryGatewayUrl: string; // API 1: اندپوینت عمومی قیمت‌ها (/api/prices)
    secondaryGatewayUrl: string; // API 2: اندپوینت مکمل استعلام نرخ‌ها (/api/rates)
    dualGatewayEnabled: boolean;
    webhookUrl: string; // وب‌هوک ورودی پیام‌ها (/api/webhook)
    customCorsAllowedOrigins: string;
    lastTestedAt?: string;
  };
}

export const DEFAULT_API_HUB_CONFIG: ApiHubConfig = {
  priceBoard: {
    primaryProvider: 'fast_creat',
    goldApiUrl: 'https://api.fast-creat.ir/gold?apikey=6750948508:ZqGU7X4Vj05BwLt@Api_ManagerRoBot',
    goldSecondaryApiUrl: 'https://call.tgju.org/ajax.json',
    fiatApiUrl: 'https://call.tgju.org/ajax.json',
    cryptoApiUrl: 'https://api.fast-creat.ir/nobitex/v2?apikey=6750948508:dNoLxDYryOH7QS5@Api_ManagerRoBot',
    cryptoSecondaryApiUrl: 'https://api.wallex.ir/v1/markets',
    oilEnergyApiUrl: 'https://call.tgju.org/ajax.json',
    oilEnergySecondaryApiUrl: 'https://api.oilpriceapi.com/v1/prices/latest',
    dualApiEnabled: true,
    enforceConfiguredApisOnly: true, // فقط و فقط APIهای داده شده متصل شوند
    refreshIntervalSec: 2,
    customJsonEndpoint: '',
    apiKeyHeaderName: '',
    apiKeyHeaderValue: '',
    enableRechartsTrends: true,
  },
  miniApp: {
    dataEndpoint: '/api/miniapp/data',
    responseEndpoint: '/api/bot/response',
    dualApiEnabled: true,
    aiQueryEnabled: true,
    aiProvider: 'internal_engine',
    aiApiKey: '',
    aiSystemPrompt: 'دستیار و موتور هوشمند پردازش و پاسخگویی به استعلامات طلا، ارز و کریپتو مینی‌اپ',
    refreshIntervalSec: 10,
    show24hChartSparklines: true,
    autoCacheTtlSec: 5,
    customWebhookUrl: '',
  },
  channelReport: {
    isEnabled: true,
    botToken: '',
    primaryApiUrl: 'https://api.telegram.org',
    secondaryApiUrl: 'https://api.telegram.org',
    dualApiEnabled: true,
    channelUsernameOrId: '@MODASR_ARZ',
    secondaryChannelId: '@MODASR_ARZ_BACKUP',
    postIntervalMinutes: 60,
    postTemplateMode: 'image_card_and_summary',
    reportTitle: '📊 گزارش و بولتن زنده بازار ارز و طلا',
    include24hChange: true,
    includeHighLow: true,
    includeWatermark: true,
    customBroadcastWebhookUrl: '',
  },
  developer: {
    adminApiKey: '',
    publicRestApiEnabled: true,
    primaryGatewayUrl: '/api/prices',
    secondaryGatewayUrl: '/api/rates',
    dualGatewayEnabled: true,
    webhookUrl: '/api/webhook',
    customCorsAllowedOrigins: '*',
    lastTestedAt: '',
  },
};

