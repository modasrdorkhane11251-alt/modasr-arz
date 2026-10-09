import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

const USERS_FILE = path.join(DATA_DIR, 'users.txt');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.txt');
const BLOCKED_FILE = path.join(DATA_DIR, 'blocked.txt');
const BOT_STATUS_FILE = path.join(DATA_DIR, 'bot_status.txt');
const PENDING_FILE = path.join(DATA_DIR, 'pending_actions.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');
const AD_CONFIG_FILE = path.join(DATA_DIR, 'ad_config.json');
const EMOJI_CONFIG_FILE = path.join(DATA_DIR, 'emoji_config.json');
const CHANNEL_CONFIG_FILE = path.join(DATA_DIR, 'channel_poster_config.json');
const ADMIN_ALERT_CONFIG_FILE = path.join(DATA_DIR, 'admin_alert_config.json');
const KEYBOARD_THEME_FILE = path.join(DATA_DIR, 'keyboard_theme.json');
const API_HUB_CONFIG_FILE = path.join(DATA_DIR, 'api_hub_config.json');

export * from './types';
import {
  ChannelPosterConfig,
  AdminAlertConfig,
  DEFAULT_ADMIN_ALERT_CONFIG,
  ActivityLog,
  ButtonType,
  ButtonColorTheme,
  CustomButtonItem,
  AdConfig,
  DEFAULT_CUSTOM_BUTTONS,
  CustomEmojiItem,
  EmojiConfig,
  DEFAULT_EMOJI_ITEMS,
  KeyboardThemeConfig,
  DEFAULT_KEYBOARD_THEME_CONFIG,
  ApiHubConfig,
  DEFAULT_API_HUB_CONFIG,
} from './types';

export class BotStorage {
  static saveUser(userId: number | string): void {
    const id = String(userId);
    const users = this.getUsers();
    if (!users.includes(id)) {
      users.push(id);
      fs.writeFileSync(USERS_FILE, users.join('\n'), 'utf-8');
    }
  }

  static getUsers(): string[] {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return content.split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  static saveGroup(groupId: number | string): void {
    const id = String(groupId);
    const groups = this.getGroups();
    if (!groups.includes(id)) {
      groups.push(id);
      fs.writeFileSync(GROUPS_FILE, groups.join('\n'), 'utf-8');
    }
  }

  static getGroups(): string[] {
    if (!fs.existsSync(GROUPS_FILE)) return [];
    try {
      const content = fs.readFileSync(GROUPS_FILE, 'utf-8');
      return content.split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  static addBlocked(userId: number | string): void {
    const id = String(userId);
    const blocked = this.getBlocked();
    if (!blocked.includes(id)) {
      blocked.push(id);
      fs.writeFileSync(BLOCKED_FILE, blocked.join('\n'), 'utf-8');
    }
  }

  static removeBlocked(userId: number | string): void {
    const id = String(userId);
    let blocked = this.getBlocked();
    blocked = blocked.filter((u) => u !== id);
    fs.writeFileSync(BLOCKED_FILE, blocked.join('\n'), 'utf-8');
  }

  static isBlocked(userId: number | string): boolean {
    const blocked = this.getBlocked();
    return blocked.includes(String(userId));
  }

  static getBlocked(): string[] {
    if (!fs.existsSync(BLOCKED_FILE)) return [];
    try {
      const content = fs.readFileSync(BLOCKED_FILE, 'utf-8');
      return content.split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  static setBotStatus(status: boolean): void {
    fs.writeFileSync(BOT_STATUS_FILE, status ? 'enabled' : 'disabled', 'utf-8');
  }

  static getBotStatus(): boolean {
    if (!fs.existsSync(BOT_STATUS_FILE)) return true;
    try {
      const content = fs.readFileSync(BOT_STATUS_FILE, 'utf-8').trim();
      return content === 'enabled';
    } catch {
      return true;
    }
  }

  static setPendingAction(userId: number | string, action: string): void {
    const pending = this.getAllPendingActions();
    pending[String(userId)] = action;
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2), 'utf-8');
  }

  static getPendingAction(userId: number | string): string | null {
    const pending = this.getAllPendingActions();
    return pending[String(userId)] || null;
  }

  static clearPendingAction(userId: number | string): void {
    const pending = this.getAllPendingActions();
    delete pending[String(userId)];
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2), 'utf-8');
  }

  private static getAllPendingActions(): Record<string, string> {
    if (!fs.existsSync(PENDING_FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8')) || {};
    } catch {
      return {};
    }
  }

  static getAdConfig(): AdConfig {
    const defaultConfig: AdConfig = {
      buttonText: '📢 کانال رسمی ما ↗️',
      buttonUrl: 'https://t.me/MODASR_ARZ',
      headerIntro: 'MØD†SR.lua ᶻ z ƪARZ',
      isEnabled: true,
      enableCharts: true,
      watermarkTag: '@MODASR_ARZ | MODASRP',
      customButtons: DEFAULT_CUSTOM_BUTTONS,
    };

    if (!fs.existsSync(AD_CONFIG_FILE)) {
      return defaultConfig;
    }

    try {
      const data = JSON.parse(fs.readFileSync(AD_CONFIG_FILE, 'utf-8'));
      const customButtons = Array.isArray(data.customButtons) && data.customButtons.length > 0
        ? data.customButtons
        : DEFAULT_CUSTOM_BUTTONS;
      return { ...defaultConfig, ...data, customButtons };
    } catch {
      return defaultConfig;
    }
  }

  static setAdConfig(config: Partial<AdConfig>): AdConfig {
    const current = this.getAdConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(AD_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  static addCustomButton(button: Omit<CustomButtonItem, 'id'>): CustomButtonItem {
    const config = this.getAdConfig();
    const newBtn: CustomButtonItem = {
      ...button,
      id: `btn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      row: button.row || (config.customButtons.length + 1),
      showInGroup: button.showInGroup !== undefined ? button.showInGroup : true,
      showInPrivate: button.showInPrivate !== undefined ? button.showInPrivate : true,
      showInChannel: button.showInChannel !== undefined ? button.showInChannel : true,
    };
    config.customButtons.push(newBtn);
    this.setAdConfig(config);
    return newBtn;
  }

  static updateCustomButton(id: string, updates: Partial<CustomButtonItem>): CustomButtonItem | null {
    const config = this.getAdConfig();
    const index = config.customButtons.findIndex((b) => b.id === id);
    if (index === -1) return null;
    config.customButtons[index] = { ...config.customButtons[index], ...updates };
    this.setAdConfig(config);
    return config.customButtons[index];
  }

  static deleteCustomButton(id: string): boolean {
    const config = this.getAdConfig();
    const initialLen = config.customButtons.length;
    config.customButtons = config.customButtons.filter((b) => b.id !== id);
    if (config.customButtons.length !== initialLen) {
      this.setAdConfig(config);
      return true;
    }
    return false;
  }

  static getChannelPosterConfig(): ChannelPosterConfig {
    const defaultConfig: ChannelPosterConfig = {
      isEnabled: true,
      channelId: '@MODASR_ARZ',
      intervalMinutes: 60,
      postMode: 'image_card_and_summary',
      lastPostTime: 0,
      lastPostStatus: 'ready',
    };

    if (!fs.existsSync(CHANNEL_CONFIG_FILE)) {
      return defaultConfig;
    }

    try {
      const data = JSON.parse(fs.readFileSync(CHANNEL_CONFIG_FILE, 'utf-8'));
      return { ...defaultConfig, ...data };
    } catch {
      return defaultConfig;
    }
  }

  static setChannelPosterConfig(config: Partial<ChannelPosterConfig>): ChannelPosterConfig {
    const current = this.getChannelPosterConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(CHANNEL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  static getEmojiConfig(): EmojiConfig {
    const defaultEmojiConfig: EmojiConfig = {
      coinEmoji: '![🪙](tg://emoji?id=5857272597791641611)',
      tomanEmoji: '▫️',
      dollarEmoji: '![💵](tg://emoji?id=5321231658156830001)',
      highEmoji: '![📈](tg://emoji?id=5197503331215361533)',
      lowEmoji: '![📉](tg://emoji?id=5429518319243775957)',
      highLowEmoji: '![🗄](tg://emoji?id=5321371721335338151)',
      upEmoji: '🟢',
      downEmoji: '🔴',
      planeEmoji: '✈️',
      items: DEFAULT_EMOJI_ITEMS,
    };

    if (!fs.existsSync(EMOJI_CONFIG_FILE)) {
      return defaultEmojiConfig;
    }

    try {
      const data = JSON.parse(fs.readFileSync(EMOJI_CONFIG_FILE, 'utf-8'));
      const existingItems: CustomEmojiItem[] = Array.isArray(data.items) ? data.items : [];

      // Merge: maintain full set of all supported assets, preserving any user modifications
      const mergedMap = new Map<string, CustomEmojiItem>();
      for (const def of DEFAULT_EMOJI_ITEMS) {
        mergedMap.set(def.key, { ...def });
      }
      for (const custom of existingItems) {
        if (custom && custom.key) {
          const current = mergedMap.get(custom.key);
          mergedMap.set(custom.key, {
            ...current,
            ...custom,
            id: custom.id || current?.id || `emoji_${custom.key}`,
            name: custom.name || current?.name || custom.key,
            category: custom.category || current?.category || 'crypto',
          });
        }
      }

      const items = Array.from(mergedMap.values());
      return { ...defaultEmojiConfig, ...data, items };
    } catch {
      return defaultEmojiConfig;
    }
  }

  static setEmojiConfig(config: Partial<EmojiConfig>): EmojiConfig {
    const current = this.getEmojiConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(EMOJI_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  static addOrUpdateEmojiItem(item: Partial<CustomEmojiItem> & { name: string; emojiTag: string }): CustomEmojiItem {
    const config = this.getEmojiConfig();
    const id = item.id || `emoji_${Date.now()}`;
    const key = (item.key || item.name).trim().toLowerCase();
    
    // Extract emoji ID if present
    let emojiId = item.emojiId;
    const match = item.emojiTag.match(/id=([0-9]+)/);
    if (match) {
      emojiId = match[1];
    } else if (/^[0-9]+$/.test(item.emojiTag.trim())) {
      emojiId = item.emojiTag.trim();
    }

    const newItem: CustomEmojiItem = {
      id,
      name: item.name,
      key,
      emojiTag: item.emojiTag,
      emojiId,
    };

    const existingIndex = config.items.findIndex((x) => x.id === id || x.key === key);
    if (existingIndex >= 0) {
      config.items[existingIndex] = { ...config.items[existingIndex], ...newItem };
    } else {
      config.items.push(newItem);
    }

    // Sync primary field if standard key
    if (key === 'coin') config.coinEmoji = newItem.emojiTag;
    if (key === 'toman') config.tomanEmoji = newItem.emojiTag;
    if (key === 'dollar') config.dollarEmoji = newItem.emojiTag;
    if (key === 'high') config.highEmoji = newItem.emojiTag;
    if (key === 'low') config.lowEmoji = newItem.emojiTag;
    if (key === 'highlow') config.highLowEmoji = newItem.emojiTag;
    if (key === 'up') config.upEmoji = newItem.emojiTag;
    if (key === 'down') config.downEmoji = newItem.emojiTag;
    if (key === 'plane') config.planeEmoji = newItem.emojiTag;

    this.setEmojiConfig(config);
    return newItem;
  }

  static deleteEmojiItem(idOrKey: string): boolean {
    const config = this.getEmojiConfig();
    const beforeCount = config.items.length;
    config.items = config.items.filter((x) => x.id !== idOrKey && x.key !== idOrKey);
    if (config.items.length !== beforeCount) {
      this.setEmojiConfig(config);
      return true;
    }
    return false;
  }

  static resetEmojisToDefault(): EmojiConfig {
    const defaultEmojiConfig: EmojiConfig = {
      coinEmoji: '![🪙](tg://emoji?id=5857272597791641611)',
      tomanEmoji: '▫️',
      dollarEmoji: '![💵](tg://emoji?id=5321231658156830001)',
      highEmoji: '![📈](tg://emoji?id=5197503331215361533)',
      lowEmoji: '![📉](tg://emoji?id=5429518319243775957)',
      highLowEmoji: '![🗄](tg://emoji?id=5321371721335338151)',
      upEmoji: '🟢',
      downEmoji: '🔴',
      planeEmoji: '✈️',
      items: DEFAULT_EMOJI_ITEMS,
    };
    fs.writeFileSync(EMOJI_CONFIG_FILE, JSON.stringify(defaultEmojiConfig, null, 2), 'utf-8');
    return defaultEmojiConfig;
  }

  static importBulkEmojiPack(rawText: string): EmojiConfig {
    const regex = /!\[([^\]]*)\]\(tg:\/\/emoji\?id=([0-9]+)\)/g;
    let match;
    const found: Array<{ symbol: string; id: string; tag: string }> = [];
    while ((match = regex.exec(rawText)) !== null) {
      found.push({
        symbol: match[1],
        id: match[2],
        tag: match[0],
      });
    }

    for (const item of found) {
      if (item.id === '6019179941294251937') {
        this.addOrUpdateEmojiItem({ key: 'oil_brent', name: 'بشکه نفت برنت', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5231053919219623276') {
        this.addOrUpdateEmojiItem({ key: 'oil_wti', name: 'نفت خام و گاز', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5321231658156830001') {
        this.addOrUpdateEmojiItem({ key: 'dollar', name: 'اسکناس دلار و تتر', emojiTag: item.tag, emojiId: item.id });
        this.addOrUpdateEmojiItem({ key: 'usdt', name: 'تتر (USDT)', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5807828680877022050') {
        this.addOrUpdateEmojiItem({ key: 'seke', name: 'کیسه سکه طلا', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5805414501234774753') {
        this.addOrUpdateEmojiItem({ key: 'mazaneh', name: 'شمش و کیسه پول', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5857272597791641611') {
        this.addOrUpdateEmojiItem({ key: 'coin', name: 'سکه کریپتو / بیت‌کوین', emojiTag: item.tag, emojiId: item.id });
        this.addOrUpdateEmojiItem({ key: 'btc', name: 'بیت‌کوین (BTC)', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5231469341341393133') {
        this.addOrUpdateEmojiItem({ key: 'silver', name: 'نقره و شمش نقره', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5319302869948596289') {
        this.addOrUpdateEmojiItem({ key: 'eth', name: 'الماس اتریوم', emojiTag: item.tag, emojiId: item.id });
        this.addOrUpdateEmojiItem({ key: 'ton', name: 'الماس تون‌کوین', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5229235915397801267') {
        this.addOrUpdateEmojiItem({ key: 'gold', name: 'مدال طلای ۱۸ عیار', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5321371721335338151') {
        this.addOrUpdateEmojiItem({ key: 'highlow', name: 'صندوق سقف و کف (High & Low)', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5224321781321442532') {
        this.addOrUpdateEmojiItem({ key: 'usd', name: 'پرچم دلار آمریکا', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5222108911091331711') {
        this.addOrUpdateEmojiItem({ key: 'eur', name: 'پرچم یورو اتحادیه اروپا', emojiTag: item.tag, emojiId: item.id });
      } else if (item.id === '5224518800061245598') {
        this.addOrUpdateEmojiItem({ key: 'gbp', name: 'پرچم پوند انگلیس', emojiTag: item.tag, emojiId: item.id });
      }
    }

    const updated = this.getEmojiConfig();
    updated.customRawText = rawText;
    this.setEmojiConfig(updated);
    return updated;
  }

  static addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getLogs(200);
      const newLog: ActivityLog = {
        ...log,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
      };
      logs.unshift(newLog);
      fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 200), null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving log:', e);
    }
  }

  static getLogs(limit: number = 100): ActivityLog[] {
    if (!fs.existsSync(LOGS_FILE)) return [];
    try {
      const logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
      return Array.isArray(logs) ? logs.slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  static clearLogs(): void {
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch (e) {
      console.error('Error clearing logs:', e);
    }
  }

  static getAdminAlertConfig(): AdminAlertConfig {
    if (!fs.existsSync(ADMIN_ALERT_CONFIG_FILE)) return DEFAULT_ADMIN_ALERT_CONFIG;
    try {
      const data = JSON.parse(fs.readFileSync(ADMIN_ALERT_CONFIG_FILE, 'utf-8'));
      return { ...DEFAULT_ADMIN_ALERT_CONFIG, ...data };
    } catch {
      return DEFAULT_ADMIN_ALERT_CONFIG;
    }
  }

  static setAdminAlertConfig(config: Partial<AdminAlertConfig>): AdminAlertConfig {
    const current = this.getAdminAlertConfig();
    const updated = { ...current, ...config };
    try {
      fs.writeFileSync(ADMIN_ALERT_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving admin alert config:', e);
    }
    return updated;
  }

  static getKeyboardTheme(): KeyboardThemeConfig {
    if (!fs.existsSync(KEYBOARD_THEME_FILE)) return DEFAULT_KEYBOARD_THEME_CONFIG;
    try {
      const data = JSON.parse(fs.readFileSync(KEYBOARD_THEME_FILE, 'utf-8'));
      return { ...DEFAULT_KEYBOARD_THEME_CONFIG, ...data };
    } catch {
      return DEFAULT_KEYBOARD_THEME_CONFIG;
    }
  }

  static setKeyboardTheme(config: Partial<KeyboardThemeConfig>): KeyboardThemeConfig {
    const current = this.getKeyboardTheme();
    const updated = { ...current, ...config };
    try {
      fs.writeFileSync(KEYBOARD_THEME_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving keyboard theme config:', e);
    }
    return updated;
  }

  static getApiHubConfig(): ApiHubConfig {
    if (!fs.existsSync(API_HUB_CONFIG_FILE)) return DEFAULT_API_HUB_CONFIG;
    try {
      const data = JSON.parse(fs.readFileSync(API_HUB_CONFIG_FILE, 'utf-8'));
      return {
        ...DEFAULT_API_HUB_CONFIG,
        ...data,
        priceBoard: { ...DEFAULT_API_HUB_CONFIG.priceBoard, ...(data.priceBoard || {}) },
        miniApp: { ...DEFAULT_API_HUB_CONFIG.miniApp, ...(data.miniApp || {}) },
        channelReport: { ...DEFAULT_API_HUB_CONFIG.channelReport, ...(data.channelReport || {}) },
        developer: { ...DEFAULT_API_HUB_CONFIG.developer, ...(data.developer || {}) },
      };
    } catch {
      return DEFAULT_API_HUB_CONFIG;
    }
  }

  static setApiHubConfig(config: Partial<ApiHubConfig>): ApiHubConfig {
    const current = this.getApiHubConfig();
    const updated: ApiHubConfig = {
      priceBoard: { ...current.priceBoard, ...(config.priceBoard || {}) },
      miniApp: { ...current.miniApp, ...(config.miniApp || {}) },
      channelReport: { ...current.channelReport, ...(config.channelReport || {}) },
      developer: { ...current.developer, ...(config.developer || {}) },
    };
    try {
      fs.writeFileSync(API_HUB_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving API hub config:', e);
    }
    return updated;
  }

  /**
   * Export complete application state and configurations for Backup
   */
  static exportBackup(): any {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      app: 'MODASR_ARZ_TELEGRAM_BOT',
      data: {
        apiHubConfig: this.getApiHubConfig(),
        adConfig: this.getAdConfig(),
        keyboardTheme: this.getKeyboardTheme(),
        emojiConfig: this.getEmojiConfig(),
        channelPosterConfig: this.getChannelPosterConfig(),
        adminAlertConfig: this.getAdminAlertConfig(),
        botStatus: this.getBotStatus(),
        users: this.getUsers(),
        groups: this.getGroups(),
        blocked: this.getBlocked(),
        logs: this.getLogs(100),
      },
    };
  }

  /**
   * Restore application state and configurations from a Backup payload
   */
  static restoreBackup(payload: any): { success: boolean; message: string; details?: any } {
    try {
      if (!payload || typeof payload !== 'object') {
        return { success: false, message: 'ساختار فایل بک‌آپ نامعتبر است.' };
      }

      const backupData = payload.data || payload;
      let restoredCount = 0;

      if (backupData.apiHubConfig && typeof backupData.apiHubConfig === 'object') {
        this.setApiHubConfig(backupData.apiHubConfig);
        restoredCount++;
      }

      if (backupData.adConfig && typeof backupData.adConfig === 'object') {
        this.setAdConfig(backupData.adConfig);
        restoredCount++;
      }

      if (backupData.keyboardTheme && typeof backupData.keyboardTheme === 'object') {
        this.setKeyboardTheme(backupData.keyboardTheme);
        restoredCount++;
      }

      if (backupData.emojiConfig && typeof backupData.emojiConfig === 'object') {
        this.setEmojiConfig(backupData.emojiConfig);
        restoredCount++;
      }

      if (backupData.channelPosterConfig && typeof backupData.channelPosterConfig === 'object') {
        this.setChannelPosterConfig(backupData.channelPosterConfig);
        restoredCount++;
      }

      if (backupData.adminAlertConfig && typeof backupData.adminAlertConfig === 'object') {
        this.setAdminAlertConfig(backupData.adminAlertConfig);
        restoredCount++;
      }

      if (backupData.botStatus !== undefined) {
        this.setBotStatus(Boolean(backupData.botStatus));
      }

      if (Array.isArray(backupData.users)) {
        fs.writeFileSync(USERS_FILE, backupData.users.join('\n'), 'utf-8');
        restoredCount++;
      }

      if (Array.isArray(backupData.groups)) {
        fs.writeFileSync(GROUPS_FILE, backupData.groups.join('\n'), 'utf-8');
        restoredCount++;
      }

      if (Array.isArray(backupData.blocked)) {
        fs.writeFileSync(BLOCKED_FILE, backupData.blocked.join('\n'), 'utf-8');
        restoredCount++;
      }

      this.addLog({
        type: 'system',
        text: `بازیابی موفقیت‌آمیز اطلاعات و تنظیمات از فایل بک‌آپ (${restoredCount} بخش بازیابی شد)`,
        status: 'success',
      });

      return {
        success: true,
        message: `✅ اطلاعات و تنظیمات با موفقیت بازیابی شدند (${restoredCount} بخش با موفقیت اعمال شد).`,
        details: {
          restoredSections: restoredCount,
          usersCount: Array.isArray(backupData.users) ? backupData.users.length : undefined,
          groupsCount: Array.isArray(backupData.groups) ? backupData.groups.length : undefined,
          buttonsCount: backupData.adConfig?.customButtons?.length,
          emojisCount: backupData.emojiConfig?.items?.length,
        },
      };
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      return { success: false, message: `خطا در بازیابی اطلاعات: ${err.message}` };
    }
  }
}
