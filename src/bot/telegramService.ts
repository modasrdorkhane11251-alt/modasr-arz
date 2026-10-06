import { BOT_CONFIG, MANUAL_ALIASES } from './config';
import { PriceService, AssetInfo } from './priceService';
import { ChartService } from './chartService';
import { ImageCardService } from './imageCardService';
import { BotStorage, AdConfig, EmojiConfig, CustomEmojiItem, CustomButtonItem } from './storage';
import { TunnelService } from './tunnelService';
import { AdminAlertService } from './adminAlertService';

export interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      title?: string;
      username?: string;
      first_name?: string;
    };
    date: number;
    text?: string;
    forward_from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    reply_to_message?: {
      message_id: number;
      from: {
        id: number;
        first_name?: string;
        username?: string;
      };
      text?: string;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

export class TelegramService {
  private static getApiUrl(token: string = BOT_CONFIG.token): string {
    return `https://api.telegram.org/bot${token}/`;
  }

  /**
   * Helper to format Persian Solar Hijri Date & Time in exact YYYY/MM/DD | HH:mm:ss format
   */
  static getIranianDateTime(): { date: string; time: string; full: string } {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);

      let year = '1405', month = '07', day = '12', hour = '18', min = '55', sec = '00';
      for (const p of parts) {
        if (p.type === 'year') year = PriceService.faNumToEn(p.value);
        if (p.type === 'month') month = PriceService.faNumToEn(p.value).padStart(2, '0');
        if (p.type === 'day') day = PriceService.faNumToEn(p.value).padStart(2, '0');
        if (p.type === 'hour') hour = PriceService.faNumToEn(p.value).padStart(2, '0');
        if (p.type === 'minute') min = PriceService.faNumToEn(p.value).padStart(2, '0');
        if (p.type === 'second') sec = PriceService.faNumToEn(p.value).padStart(2, '0');
      }

      const date = `${year}/${month}/${day}`;
      const time = `${hour}:${min}:${sec}`;
      return { date, time, full: `${date} | ${time}` };
    } catch {
      return { date: '1405/07/12', time: '18:55:00', full: '1405/07/12 | 18:55:00' };
    }
  }

  /**
   * Convert markdown/custom emoji syntax:
   * ![✨](tg://emoji?id=5832577678300943429) -> <tg-emoji emoji-id="5832577678300943429">✨</tg-emoji>
   * tg://emoji?id=5832577678300943429 -> <tg-emoji emoji-id="5832577678300943429">✨</tg-emoji>
   * 5832577678300943429 -> <tg-emoji emoji-id="5832577678300943429">✨</tg-emoji>
   */
  static convertMarkdownEmojisToHtml(text: string): string {
    if (!text) return '';
    let res = text.replace(/!\[([^\]]*)\]\(tg:\/\/emoji\?id=([0-9]+)\)/g, '<tg-emoji emoji-id="$2">$1</tg-emoji>');
    res = res.replace(/tg:\/\/emoji\?id=([0-9]+)/g, '<tg-emoji emoji-id="$1">✨</tg-emoji>');
    
    // Standalone numeric ID (15-22 digits)
    if (/^[0-9]{15,22}$/.test(res.trim())) {
      res = `<tg-emoji emoji-id="${res.trim()}">✨</tg-emoji>`;
    }
    return res;
  }

  /**
   * Send text message via Telegram Bot API
   */
  static async sendMessage(
    chatId: number | string,
    text: string,
    parseMode: string | null = 'HTML',
    replyMarkup: any = null,
    token: string = BOT_CONFIG.token,
    replyToMessageId?: number
  ): Promise<any> {
    const url = `${this.getApiUrl(token)}sendMessage`;
    const formattedText = this.convertMarkdownEmojisToHtml(text);
    const payload: any = {
      chat_id: chatId,
      text: formattedText,
    };

    if (parseMode) payload.parse_mode = parseMode;
    if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
    if (replyMarkup) {
      payload.reply_markup = typeof replyMarkup === 'string' ? JSON.parse(replyMarkup) : replyMarkup;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      // If failed due to reply_markup (e.g. invalid button type in groups), retry without reply_markup
      if (!data.ok && payload.reply_markup) {
        console.warn(`Telegram sendMessage failed with reply_markup in chat ${chatId}: ${data.description}. Retrying without reply_markup...`);
        const retryPayload = { ...payload };
        delete retryPayload.reply_markup;
        const retryRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryPayload),
        });
        const retryData = await retryRes.json();
        if (retryData.ok) return retryData;
      }

      // If failed due to HTML parse error, retry as plain text
      if (!data.ok && parseMode === 'HTML') {
        const plainPayload: any = {
          chat_id: chatId,
          text: text.replace(/<[^>]*>/g, ''),
        };
        if (replyToMessageId) plainPayload.reply_to_message_id = replyToMessageId;
        const plainRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plainPayload),
        });
        return await plainRes.json();
      }

      return data;
    } catch (err) {
      console.error(`Telegram sendMessage failed for chat ${chatId}:`, err);
      return { ok: false, error: String(err) };
    }
  }

  /**
   * Send photo with caption via Telegram Bot API (supports URL or PNG Buffer)
   */
  static async sendPhoto(
    chatId: number | string,
    photo: string | Buffer,
    caption: string,
    replyMarkup: any = null,
    token: string = BOT_CONFIG.token,
    replyToMessageId?: number
  ): Promise<any> {
    const url = `${this.getApiUrl(token)}sendPhoto`;
    const formattedCaption = this.convertMarkdownEmojisToHtml(caption);

    try {
      let data: any = null;
      if (Buffer.isBuffer(photo)) {
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('photo', new Blob([new Uint8Array(photo)], { type: 'image/png' }), 'card.png');
        formData.append('caption', formattedCaption);
        formData.append('parse_mode', 'HTML');
        if (replyToMessageId) formData.append('reply_to_message_id', String(replyToMessageId));
        if (replyMarkup) {
          formData.append(
            'reply_markup',
            typeof replyMarkup === 'string' ? replyMarkup : JSON.stringify(replyMarkup)
          );
        }

        const res = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        data = await res.json();
      } else {
        const payload: any = {
          chat_id: chatId,
          photo: photo,
          caption: formattedCaption,
          parse_mode: 'HTML',
        };
        if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
        if (replyMarkup) {
          payload.reply_markup = typeof replyMarkup === 'string' ? JSON.parse(replyMarkup) : replyMarkup;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }

      if (!data || !data.ok) {
        console.warn(`sendPhoto failed in chat ${chatId}: ${data?.description}. Falling back to sendMessage...`);
        return await this.sendMessage(chatId, caption, 'HTML', replyMarkup, token, replyToMessageId);
      }
      return data;
    } catch {
      return await this.sendMessage(chatId, caption, 'HTML', replyMarkup, token, replyToMessageId);
    }
  }

  /**
   * Forward message via Telegram Bot API
   */
  static async forwardMessage(
    chatId: number | string,
    fromChatId: number | string,
    messageId: number,
    token: string = BOT_CONFIG.token
  ): Promise<any> {
    const url = `${this.getApiUrl(token)}forwardMessage`;
    const payload = {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  /**
   * Answer callback query
   */
  static async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert: boolean = false,
    token: string = BOT_CONFIG.token
  ): Promise<any> {
    const url = `${this.getApiUrl(token)}answerCallbackQuery`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: showAlert,
        }),
      });
      return await res.json();
    } catch (err) {
      return { ok: false };
    }
  }

  /**
   * Broadcast message to all saved private users
   */
  static async broadcastToUsers(text: string, token: string = BOT_CONFIG.token): Promise<number> {
    const users = BotStorage.getUsers();
    let success = 0;

    for (const userId of users) {
      if (BotStorage.isBlocked(userId)) continue;
      try {
        const res = await this.sendMessage(userId, text, 'HTML', null, token);
        if (res && res.ok) success++;
        await new Promise((r) => setTimeout(r, 80));
      } catch {}
    }
    return success;
  }

  /**
   * Forward a message to all users and groups
   */
  static async forwardToAll(fromChatId: number | string, messageId: number, token: string = BOT_CONFIG.token): Promise<number> {
    let forwarded = 0;
    const users = BotStorage.getUsers();
    for (const userId of users) {
      if (BotStorage.isBlocked(userId)) continue;
      try {
        const res = await this.forwardMessage(userId, fromChatId, messageId, token);
        if (res && res.ok) forwarded++;
        await new Promise((r) => setTimeout(r, 60));
      } catch {}
    }

    const groups = BotStorage.getGroups();
    for (const groupId of groups) {
      try {
        const res = await this.forwardMessage(groupId, fromChatId, messageId, token);
        if (res && res.ok) forwarded++;
        await new Promise((r) => setTimeout(r, 60));
      } catch {}
    }

    return forwarded;
  }

  /**
   * Keyboards: Dynamic Custom Ad & Action Buttons + Add to Group (Group-safe & Channel-safe)
   */
  static getResponseKeyboard(isGroup: boolean = false, isChannel: boolean = false) {
    const adConfig = BotStorage.getAdConfig();
    const miniAppUrl = TunnelService.getMiniAppUrl();
    const botUsername = BOT_CONFIG.botUsername || 'Modasr_Arzbot';
    const addToGroupUrl = `https://t.me/${botUsername}?startgroup=start`;

    const buttons: CustomButtonItem[] = adConfig.customButtons || [];
    const rowsMap = new Map<number, any[]>();

    // Helper for formatting button text with emoji and color indicator
    const formatButtonText = (btn: CustomButtonItem) => {
      const icon = (btn.iconEmoji || '').trim();
      const colorPrefixes: Record<string, string> = {
        emerald: '🟢',
        blue: '🔵',
        purple: '🟣',
        amber: '🟡',
        rose: '🔴',
        cyan: '💎',
        orange: '🟠',
        dark: '▫️',
      };

      // If icon is already set, use it; otherwise use color theme prefix
      const prefix = icon || colorPrefixes[btn.colorTheme] || '';
      return prefix ? `${prefix} ${btn.text}` : btn.text;
    };

    for (const btn of buttons) {
      if (!btn.isEnabled) continue;
      if (isGroup && btn.showInGroup === false) continue;
      if (!isGroup && !isChannel && btn.showInPrivate === false) continue;
      if (isChannel && btn.showInChannel === false) continue;

      const rowIndex = btn.row || 1;
      if (!rowsMap.has(rowIndex)) {
        rowsMap.set(rowIndex, []);
      }

      const label = formatButtonText(btn);

      if (btn.type === 'add_to_group') {
        rowsMap.get(rowIndex)!.push({
          text: label,
          url: btn.url || addToGroupUrl,
        });
      } else if (btn.type === 'miniapp') {
        if (!isGroup && !isChannel) {
          rowsMap.get(rowIndex)!.push({
            text: label,
            web_app: { url: miniAppUrl },
          });
        } else {
          rowsMap.get(rowIndex)!.push({
            text: label,
            url: `https://t.me/${botUsername}?start=miniapp`,
          });
        }
      } else {
        // url or channel
        rowsMap.get(rowIndex)!.push({
          text: label,
          url: btn.url || 'https://t.me/MODASR_ARZ',
        });
      }
    }

    // Sort rows by row number
    const sortedRowIndices = Array.from(rowsMap.keys()).sort((a, b) => a - b);
    const inline_keyboard: any[] = [];
    for (const idx of sortedRowIndices) {
      const row = rowsMap.get(idx);
      if (row && row.length > 0) {
        inline_keyboard.push(row);
      }
    }

    // Fallback if no custom buttons enabled
    if (inline_keyboard.length === 0) {
      inline_keyboard.push([
        {
          text: '👾 افزودن به گروه +',
          url: addToGroupUrl,
        },
      ]);
    }

    return { inline_keyboard };
  }

  static getAdminKeyboard() {
    return {
      inline_keyboard: [
        [{ text: '📊 آمار', callback_data: 'stats' }],
        [
          { text: '🔄 فوروارد', callback_data: 'forward' },
          { text: '📢 همگانی', callback_data: 'broadcast' },
        ],
        [
          { text: '⚙️ تنظیم دکمه تبلیغ', callback_data: 'edit_ad' },
          { text: '📝 تنظیم متن هدر', callback_data: 'edit_header' },
        ],
        [
          { text: '💎 مدیریت و منوی ایموجی‌ها', callback_data: 'menu_emojis' },
          { text: '📁 لیست گروه‌ها', callback_data: 'list_groups' },
        ],
        [
          { text: '✅ آنبلاک', callback_data: 'unblock' },
          { text: '🚫 بلاک', callback_data: 'block' },
        ],
        [
          { text: '🔴 خاموش', callback_data: 'disable' },
          { text: '🟢 روشن', callback_data: 'enable' },
        ],
        [
          { text: '📢 کانال', url: 'https://t.me/MODASR_ARZ' },
          { text: '👤 توسعه‌دهنده', url: 'https://t.me/About_modasr' },
        ],
      ],
    };
  }

  static getEmojiMenuKeyboard() {
    return {
      inline_keyboard: [
        [{ text: '📋 مشاهده لیست ایموجی‌های ثبت‌شده', callback_data: 'list_emojis' }],
        [
          { text: '➕ افزودن / جایگزینی ایموجی', callback_data: 'add_emoji' },
          { text: '🗑️ حذف ایموجی', callback_data: 'del_emoji' },
        ],
        [{ text: '🔄 بازنشانی تمام ایموجی‌ها به پیش‌فرض', callback_data: 'reset_emojis' }],
        [{ text: '🔙 بازگشت به منوی ادمین', callback_data: 'back_admin' }],
      ],
    };
  }

  /**
   * Main update processor
   */
  static async handleUpdate(update: TelegramUpdate, token: string = BOT_CONFIG.token): Promise<{ success: boolean; responseText?: string }> {
    if (!update) return { success: false };

    // 1. Handle Callback Query
    if (update.callback_query) {
      const cb = update.callback_query;
      const fromId = cb.from?.id;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;

      BotStorage.addLog({
        type: 'callback',
        userId: fromId,
        chatId: chatId,
        username: cb.from?.username,
        text: `Callback: ${data}`,
        status: 'info',
      });

      if (fromId !== BOT_CONFIG.adminId) {
        if (chatId) {
          await this.sendMessage(chatId, 'شما دسترسی ندارید!', null, null, token);
        }
        await this.answerCallbackQuery(cb.id, 'دسترسی غیرمجاز!', true, token);
        return { success: true, responseText: 'دسترسی غیرمجاز' };
      }

      await this.handleCallbackAction(cb, token);
      await this.answerCallbackQuery(cb.id, undefined, false, token);
      return { success: true, responseText: `Handled callback: ${data}` };
    }

    // 2. Handle Messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = msg.text || '';
      const fromId = msg.from?.id || chatId;
      const chatType = msg.chat?.type;
      const isGroup = chatType === 'group' || chatType === 'supergroup';

      if (chatType === 'private') {
        BotStorage.saveUser(chatId);
      } else if (isGroup) {
        BotStorage.saveGroup(chatId);
      }

      if (BotStorage.isBlocked(fromId)) {
        return { success: true, responseText: 'کاربر بلاک است' };
      }

      if (!BotStorage.getBotStatus() && fromId !== BOT_CONFIG.adminId) {
        return { success: true, responseText: 'ربات خاموش است' };
      }

      // Handle Admin Pending Action
      if (fromId === BOT_CONFIG.adminId) {
        const pendingAction = BotStorage.getPendingAction(fromId);
        if (pendingAction) {
          const resp = await this.handleAdminPendingAction(msg, pendingAction, token);
          return { success: true, responseText: resp };
        }
      }

      // Handle Commands starting with '/'
      if (text.startsWith('/')) {
        const parts = text.split(/\s+/);
        const fullCmd = parts[0];
        // Strip leading slash and @botusername (e.g. /start@Modasr_Arzbot -> start, /btc@Modasr_Arzbot -> btc)
        const cmdClean = fullCmd.substring(1).split('@')[0].toLowerCase();
        const cmdArgs = parts.slice(1).join(' ').trim();

        if (cmdClean === 'start') {
          if (cmdArgs) {
            return await this.handleCurrencyRequest({ ...msg, text: cmdArgs }, token);
          }
          if (isGroup) {
            const groupWelcome =
              `👋 <b>سلام! ربات استعلام نرخ لحظه‌ای طلا، ارز و کریپتو در این گروه فعال است.</b>\n\n` +
              `💡 <b>دستورات و استعلام سریع:</b>\n` +
              `کافیست نام یا نماد هر ارز را بنویسید:\n` +
              `• <code>تتر</code> یا <code>100 تتر</code>\n` +
              `• <code>دلار</code> یا <code>50 دلار</code>\n` +
              `• <code>طلا</code> یا <code>سکه امامی</code> یا <code>مظنه</code>\n` +
              `• <code>بیت کوین</code> یا <code>اتریوم</code> یا <code>سولانا</code>\n` +
              `• <code>/بازار</code> (مشاهده تابلوی ۹ ارز برتر)`;
            await this.sendMessage(chatId, groupWelcome, 'HTML', this.getResponseKeyboard(true), token, msg.message_id);
            return { success: true, responseText: groupWelcome };
          } else {
            const welcome = this.getWelcomeText();
            await this.sendMessage(chatId, welcome, 'HTML', this.getResponseKeyboard(false), token);
            BotStorage.addLog({
              type: 'incoming_msg',
              userId: fromId,
              chatId: chatId,
              username: msg.from?.username,
              text: text,
              response: 'Welcome sent',
              status: 'success',
            });
            return { success: true, responseText: welcome };
          }
        }

        if (cmdClean === 'admin') {
          if (fromId === BOT_CONFIG.adminId) {
            const kb = this.getAdminKeyboard();
            const adminMsg = '<b>پنل مدیریت ربات :</b>\n➖➖➖➖➖➖➖➖‏➖➖➖';
            await this.sendMessage(chatId, adminMsg, 'HTML', kb, token, isGroup ? msg.message_id : undefined);
            return { success: true, responseText: adminMsg };
          } else {
            await this.sendMessage(chatId, 'شما دسترسی به پنل مدیریت ندارید.', null, null, token, isGroup ? msg.message_id : undefined);
            return { success: true, responseText: 'شما دسترسی ندارید' };
          }
        }

        if (cmdClean === 'app' || cmdClean === 'miniapp' || cmdClean === 'qeymat' || cmdClean === 'index' || cmdClean === 'modasr') {
          const miniAppUrl = TunnelService.getMiniAppUrl();
          const appMsg =
            '📱 <b>مینی‌اپ اختصاصی mini MODASR arz (شاخص زنده بازار):</b>\n\n' +
            '✨ تابلوی زنده قیمت‌ها، شاخص نوسانات لحظه‌ای، چارت‌های تعاملی و ماشین‌حساب مبدل ارز آماده است.\n' +
            '🔒 <b>لینک مخفی و اختصاصی:</b> فعال و آماده استفاده در تلگرام و وب!\n\n' +
            '👇 برای باز کردن mini MODASR arz روی دکمه زیر ضربه بزنید:';
          const kb = {
            inline_keyboard: isGroup
              ? [
                  [{ text: '🚀 ورود به mini MODASR arz', url: `https://t.me/${BOT_CONFIG.botUsername}?start=miniapp` }],
                  [{ text: '📢 کانال رسمی تلگرام', url: 'https://t.me/MODASR_ARZ' }],
                ]
              : [
                  [{ text: '🚀 ورود به mini MODASR arz ⚡', web_app: { url: miniAppUrl } }],
                  [{ text: '📢 کانال رسمی تلگرام', url: 'https://t.me/MODASR_ARZ' }],
                ],
          };
          await this.sendMessage(chatId, appMsg, 'HTML', kb, token, isGroup ? msg.message_id : undefined);
          return { success: true, responseText: appMsg };
        }

        if (
          cmdClean === 'report' ||
          cmdClean === 'bug' ||
          cmdClean === 'feedback' ||
          cmdClean === 'support' ||
          cmdClean === 'poshtibani' ||
          cmdClean === 'پشتیبانی' ||
          cmdClean === 'گزارش'
        ) {
          if (!cmdArgs) {
            const promptMsg =
              '📝 <b>ثبت گزارش خطا، باگ یا پیشنهاد برای مدیریت:</b>\n\n' +
              'لطفاً متن پیام یا گزارش باگ خود را بعد از دستور بنویسید:\n' +
              'مثال:\n' +
              '<code>/report نرخ بیت کوین آپدیت نشد</code>\n\n' +
              '⚡️ پیام شما بلافاصله به پیوی مدیریت ربات ارسال خواهد شد.';
            await this.sendMessage(chatId, promptMsg, 'HTML', null, token, isGroup ? msg.message_id : undefined);
            return { success: true, responseText: promptMsg };
          }

          const sendReportRes = await AdminAlertService.sendUserBugReport(
            msg.from || { id: fromId, first_name: 'کاربر' },
            cmdArgs,
            chatId,
            token
          );

          const ackMsg = sendReportRes.ok
            ? '✅ <b>گزارش باگ شما با موفقیت برای مدیریت ربات ارسال شد.</b>\nبا تشکر، ادمین به زودی پیام شما را بررسی خواهد کرد.'
            : '⚠️ <b>خطا در ثبت گزارش:</b> لطفاً بعداً دوباره امتحان فرمایید.';

          await this.sendMessage(chatId, ackMsg, 'HTML', null, token, isGroup ? msg.message_id : undefined);
          return { success: true, responseText: ackMsg };
        }

        // For any other command (e.g. /btc, /usd, /tether, /طلا, /دلار, /قیمت, /نرخ, /market, etc.)
        const queryText = cmdArgs ? `${cmdClean} ${cmdArgs}` : cmdClean;
        return await this.handleCurrencyRequest({ ...msg, text: queryText }, token);
      }

      // Non-command message: Direct query (e.g. "طلا", "دلار", "تتر", "بیت کوین", "50دلار")
      return await this.handleCurrencyRequest(msg, token);
    }

    return { success: false };
  }

  static getWelcomeText(): string {
    const adConfig = BotStorage.getAdConfig();
    const intro = adConfig.headerIntro ? `<b>${adConfig.headerIntro}</b>\n\n` : '';
    return (
      `${intro}👋 <b>سلام! به ربات قیمت لحظه‌ای ارز دیجیتال و طلا خوش آمدید.</b>\n` +
      '💡 می‌توانید نام یا نماد ارز مورد نظر خود را ارسال کنید تا قیمت و اطلاعات نوسان آن را دریافت کنید.\n\n' +
      '<b>مثال‌ها:</b>\n' +
      '• <code>تتر</code> یا <code>1 USDT</code>\n' +
      '• <code>بیت کوین</code> یا <code>0.5 اتریوم</code>\n' +
      '• <code>1.5 گرم طلا</code>\n' +
      '• <code>سولانا</code> / <code>تون</code> / <code>دوج</code>'
    );
  }

  static async handleCurrencyRequest(msg: any, token: string = BOT_CONFIG.token): Promise<{ success: boolean; responseText: string }> {
    const rawText = msg.text || '';
    if (!rawText.trim()) return { success: false, responseText: '' };

    let textClean = PriceService.faNumToEn(rawText.trim().toLowerCase());
    
    // 1. Strip all bot username mentions anywhere in text: e.g. @Modasr_Arzbot
    textClean = textClean.replace(/@[a-zA-Z0-9_]+/gi, '').trim();

    // 2. Normalize spaces and zero-width characters
    textClean = textClean.replace(/[\u200c\u200b\u00a0]+/g, ' ').trim();

    // 3. Strip trailing punctuation: ؟ ? ! . : ؛ ,
    textClean = textClean.replace(/[؟!?.؛:،,]+$/g, '').trim();

    // 4. Strip leading slash and commands (e.g. /btc -> btc, /p btc -> btc)
    if (textClean.startsWith('/')) {
      textClean = textClean.substring(1).trim();
    }
    textClean = textClean.replace(/^(?:p|c|arz|qeymat|price)\s+/gi, '').trim();

    // 5. Strip common Persian conversational prefixes:
    textClean = textClean.replace(/^(?:قیمت\s+لحظه\s*ای|قیمت\s+روز|قیمت|نرخ\s+لحظه\s*ای|نرخ\s+روز|نرخ|استعلام\s+قیمت|استعلام|ارزش)\s+/gi, '').trim();

    // 6. Strip common Persian conversational suffixes:
    textClean = textClean.replace(/\s+(?:چنده|چند\s+است|چند\s+شد|چقدر\s+شد|چقدره|رو\s+بگو|بگو|لطفا|لطفاً|چند\s+تومنه|چند\s+تومان\s+است|امروز)\s*$/gi, '').trim();
    textClean = textClean.replace(/[؟!?.؛:،,]+$/g, '').trim();

    // 1. Check for Market Overview (3x3 Grid)
    if (
      !textClean ||
      textClean === 'بازار' ||
      textClean === 'ارزها' ||
      textClean === 'ارز' ||
      textClean === 'لیست قیمت' ||
      textClean === 'لیست ارزها' ||
      textClean === 'لیست' ||
      textClean === 'کریپتو' ||
      textClean === 'مارکت' ||
      textClean === 'overview' ||
      textClean === 'market' ||
      textClean === 'help' ||
      textClean === 'راهنما'
    ) {
      const resp = await this.handleMarketOverviewRequest({ ...msg, text: textClean }, token);
      return { success: !!resp, responseText: resp };
    }

    // 2. Check for Crude Oil & Energy
    if (
      textClean.includes('نفت') ||
      textClean.includes('oil') ||
      textClean.includes('brent') ||
      textClean.includes('wti') ||
      textClean.includes('گاز')
    ) {
      const resp = await this.handleOilRequest({ ...msg, text: textClean }, token);
      return { success: !!resp, responseText: resp };
    }

    // 3. Check for Gold, Silver, Seke, Mazaneh
    if (
      textClean.includes('طلا') ||
      textClean.includes('gold') ||
      textClean.includes('مظنه') ||
      textClean.includes('مثقال') ||
      textClean.includes('سکه') ||
      textClean.includes('نقره') ||
      textClean.includes('silver') ||
      textClean.includes('آبشده')
    ) {
      const resp = await this.handleGoldRequest({ ...msg, text: textClean }, token);
      return { success: !!resp, responseText: resp };
    }

    // 4. Default: Cryptocurrency / Fiat Query
    const resp = await this.handleCoinRequest({ ...msg, text: textClean }, token);
    return { success: !!resp, responseText: resp };
  }

  /**
   * Handle 3x3 Grid Market Overview (matching the exact user screenshot)
   */
  static async handleMarketOverviewRequest(msg: any, token: string = BOT_CONFIG.token): Promise<string> {
    const chatId = msg.chat?.id;
    const isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup';
    const replyToId = isGroup ? msg.message_id : undefined;
    const keyboard = this.getResponseKeyboard(isGroup);

    const adConfig = BotStorage.getAdConfig();
    const emojiConfig = BotStorage.getEmojiConfig();
    const watermark = adConfig.watermarkTag || '@MODASR_ARZ | MODASRP';
    const dt = this.getIranianDateTime();

    const assets = await PriceService.getMarketOverviewAssets();
    const header = adConfig.headerIntro ? `<b>${adConfig.headerIntro}</b>\n\n` : '';

    const planeItem = emojiConfig.items?.find((x) => x.key === 'plane');
    const planeEmoji = this.convertMarkdownEmojisToHtml(planeItem?.emojiTag || emojiConfig.planeEmoji || '✈️');

    let listText = `${header}📊 <b>نمای کلی بازار ارزهای دیجیتال (Crypto Overview) :</b>\n\n`;
    for (const a of assets) {
      const sym = a.symbol.toLowerCase();
      let customEmoji = '🪙';
      if (sym === 'btc') customEmoji = '![🪙](tg://emoji?id=5857272597791641611)';
      else if (sym === 'eth' || sym === 'ton') customEmoji = '![💎](tg://emoji?id=5319302869948596289)';
      else if (sym === 'usdt') customEmoji = '![💵](tg://emoji?id=5321231658156830001)';
      else {
        const item = emojiConfig.items?.find((x) => x.key === sym);
        if (item) customEmoji = item.emojiTag;
        else customEmoji = emojiConfig.coinEmoji || '![🪙](tg://emoji?id=5857272597791641611)';
      }
      const emojiHtml = this.convertMarkdownEmojisToHtml(customEmoji);
      const sign = a.dayChange >= 0 ? '+' : '';
      const formattedUsd = a.priceUsd ? (a.priceUsd >= 1 ? a.priceUsd.toLocaleString('en-US') : a.priceUsd) : '0';
      listText += `${emojiHtml} <b>${a.name} (${a.symbol}) :</b> $${formattedUsd} (<code>${sign}${a.dayChange}%</code>)\n`;
    }
    listText += `\n<b>${planeEmoji} ${dt.full}</b>`;

    if (chatId) {
      try {
        const cardAssets = assets.map((a) => ({
          name: a.name,
          symbol: a.symbol,
          priceUsd: a.priceUsd,
          priceToman: a.priceToman,
          changePercent: a.dayChange,
          category: a.category,
        }));
        const gridBuffer = await ImageCardService.renderGridOverviewPng(cardAssets, watermark);
        await this.sendPhoto(chatId, gridBuffer, listText, keyboard, token, replyToId);
      } catch (err) {
        console.error('Grid Overview PNG generation error:', err);
        await this.sendMessage(chatId, listText, 'HTML', keyboard, token, replyToId);
      }
    }

    BotStorage.addLog({
      type: 'outgoing_msg',
      chatId: chatId,
      userId: msg.from?.id,
      text: msg.text,
      response: 'Market Overview 3x3 Card Sent',
      status: 'success',
    });

    return listText;
  }

  /**
   * Handle Crude Oil & Energy Requests
   */
  static async handleOilRequest(msg: any, token: string = BOT_CONFIG.token): Promise<string> {
    const rawText = msg.text || '';
    const text = PriceService.faNumToEn(rawText.trim().toLowerCase());
    const chatId = msg.chat?.id;
    const isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup';
    const replyToId = isGroup ? msg.message_id : undefined;
    const keyboard = this.getResponseKeyboard(isGroup);

    const oilType = text.includes('wti') || text.includes('خام') ? 'wti' : text.includes('گاز') ? 'gas' : 'brent';
    const oilData = await PriceService.getOilPrice(oilType);

    const dt = this.getIranianDateTime();
    const adConfig = BotStorage.getAdConfig();
    const emojiConfig = BotStorage.getEmojiConfig();
    const watermark = adConfig.watermarkTag || '@MODASR_ARZ | MODASRP';

    const header = adConfig.headerIntro ? `<b>${adConfig.headerIntro}</b>\n\n` : '';
    const tomanFormatted = (oilData.priceToman || 0).toLocaleString('en-US');
    const highTomanFormatted = (oilData.highToman || 0).toLocaleString('en-US');
    const lowTomanFormatted = (oilData.lowToman || 0).toLocaleString('en-US');

    const oilItem = emojiConfig.items?.find((x) => x.key === (oilType === 'brent' ? 'oil_brent' : 'oil_wti')) ||
      emojiConfig.items?.find((x) => x.key.startsWith('oil'));
    const dollarItem = emojiConfig.items?.find((x) => x.key === 'dollar');
    const tomanItem = emojiConfig.items?.find((x) => x.key === 'toman');
    const highItem = emojiConfig.items?.find((x) => x.key === 'high');
    const lowItem = emojiConfig.items?.find((x) => x.key === 'low');
    const highLowItem = emojiConfig.items?.find((x) => x.key === 'highlow');
    const upItem = emojiConfig.items?.find((x) => x.key === 'up');
    const downItem = emojiConfig.items?.find((x) => x.key === 'down');
    const planeItem = emojiConfig.items?.find((x) => x.key === 'plane');

    const oilEmojiTag = this.convertMarkdownEmojisToHtml(oilItem?.emojiTag || '![🛢](tg://emoji?id=6019179941294251937)');
    const tomanEmojiTag = this.convertMarkdownEmojisToHtml(tomanItem?.emojiTag || '▫️');
    const dollarEmojiTag = this.convertMarkdownEmojisToHtml(dollarItem?.emojiTag || '![💵](tg://emoji?id=5321231658156830001)');
    const highEmojiTag = this.convertMarkdownEmojisToHtml(highItem?.emojiTag || emojiConfig.highEmoji || highLowItem?.emojiTag || '![📈](tg://emoji?id=5197503331215361533)');
    const lowEmojiTag = this.convertMarkdownEmojisToHtml(lowItem?.emojiTag || emojiConfig.lowEmoji || highLowItem?.emojiTag || '![📉](tg://emoji?id=5429518319243775957)');
    const upEmojiTag = this.convertMarkdownEmojisToHtml(upItem?.emojiTag || '🟢');
    const downEmojiTag = this.convertMarkdownEmojisToHtml(downItem?.emojiTag || '🔴');
    const planeEmojiTag = this.convertMarkdownEmojisToHtml(planeItem?.emojiTag || '✈️');

    const changeSign = oilData.dayChange >= 0 ? upEmojiTag : downEmojiTag;
    const changeFormatted = `${oilData.dayChange >= 0 ? '+' : ''}${oilData.dayChange.toFixed(2)}%`;

    const responseMsg =
      `${header}` +
      `<b>${oilEmojiTag} 1 Barrel ${oilData.name} :</b>\n\n` +
      `<b>${tomanEmojiTag} ${tomanFormatted} toman</b>\n` +
      `<b>${dollarEmojiTag} $${oilData.priceUsd?.toFixed(2)} dollar</b>\n` +
      `<b>${changeSign} ${changeFormatted}</b>\n\n` +
      `<blockquote>${highEmojiTag} High & Low ${lowEmojiTag}\n${tomanEmojiTag} ${highTomanFormatted} / ${lowTomanFormatted} toman</blockquote>\n\n` +
      `<b>${planeEmojiTag} ${dt.full}</b>`;

    if (chatId) {
      let sendRes: any = null;
      if (adConfig.enableCharts !== false) {
        try {
          const cardBuffer = await ImageCardService.renderSingleCardPng(
            {
              name: oilData.name,
              symbol: oilData.symbol,
              priceUsd: oilData.priceUsd,
              priceToman: oilData.priceToman,
              changePercent: oilData.dayChange,
              category: 'oil',
              unit: oilData.unit,
            },
            watermark
          );
          sendRes = await this.sendPhoto(chatId, cardBuffer, responseMsg, keyboard, token, replyToId);
        } catch {
          sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
        }
      } else {
        sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
      }

      const isOk = sendRes ? sendRes.ok !== false : true;
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: isOk ? responseMsg : `خطا در ارسال به تلگرام: ${sendRes?.description || sendRes?.error || 'ارسال ناموفق'}`,
        status: isOk ? 'success' : 'error',
      });
    } else {
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: responseMsg,
        status: 'success',
      });
    }

    return responseMsg;
  }

  /**
   * Handle Gold, Seke, Silver & Mazaneh Price Requests
   */
  static async handleGoldRequest(msg: any, token: string = BOT_CONFIG.token): Promise<string> {
    const rawText = msg.text || '';
    const text = PriceService.faNumToEn(rawText.trim().toLowerCase());
    const chatId = msg.chat?.id;
    const isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup';
    const replyToId = isGroup ? msg.message_id : undefined;
    const keyboard = this.getResponseKeyboard(isGroup);

    let amount = 1;
    const match = text.match(/^(\d+\.?\d*)\s*(?:گرم|مثقال|مظنه|عدد)?\s*(?:طلا|gold|سکه|نقره)?/);
    if (match && !isNaN(parseFloat(match[1]))) {
      amount = parseFloat(match[1]);
    }

    const goldData = await PriceService.getGoldOrCoinItem(text);
    if (!goldData) return '';

    const totalPrice = Math.round(amount * goldData.tomanPrice);
    const highToman = Math.round(amount * goldData.highToman);
    const lowToman = Math.round(amount * goldData.lowToman);

    const dt = this.getIranianDateTime();
    const adConfig = BotStorage.getAdConfig();
    const emojiConfig = BotStorage.getEmojiConfig();

    const header = adConfig.headerIntro ? `<b>${adConfig.headerIntro}</b>\n\n` : '';
    const amountStr = PriceService.formatNumber(amount, 2);
    const tomanFormatted = totalPrice.toLocaleString('en-US');
    const highFormatted = highToman.toLocaleString('en-US');
    const lowFormatted = lowToman.toLocaleString('en-US');

    // Distinct emoji for each gold and coin asset (Never confused with Bitcoin or each other)
    let customEmojiTag = '![🥇](tg://emoji?id=5229235915397801267)';
    if (text.includes('امامی') || (text.includes('سکه') && !text.includes('بهار') && !text.includes('نیم') && !text.includes('ربع') && !text.includes('گرمی'))) {
      customEmojiTag = '![💰](tg://emoji?id=5807828680877022050)'; // Seke Emami
    } else if (text.includes('بهار') || text.includes('تمام')) {
      customEmojiTag = '![💰](tg://emoji?id=5805414501234774753)'; // Seke Bahar
    } else if (text.includes('نیم')) {
      customEmojiTag = '![🪙](tg://emoji?id=5377505475015235101)'; // Nim Seke
    } else if (text.includes('ربع')) {
      customEmojiTag = '![🪙](tg://emoji?id=5377746319601324795)'; // Rob Seke
    } else if (text.includes('گرمی')) {
      customEmojiTag = '![🪙](tg://emoji?id=5379773896352355687)'; // Seke Gerami
    } else if (text.includes('نقره') || text.includes('silver')) {
      customEmojiTag = '![🥈](tg://emoji?id=5231469341341393133)'; // Silver
    } else if (text.includes('۲۴') || text.includes('24')) {
      customEmojiTag = '![👑](tg://emoji?id=5267500801240092311)'; // Gold 24k
    } else if (text.includes('مظنه') || text.includes('مثقال') || text.includes('آبشده')) {
      customEmojiTag = '![💰](tg://emoji?id=5287231198098117669)'; // Mazaneh / Abshodeh
    } else {
      customEmojiTag = '![🥇](tg://emoji?id=5229235915397801267)'; // Gold 18k
    }

    const itemEmojiTag = this.convertMarkdownEmojisToHtml(customEmojiTag);
    const tomanItem = emojiConfig.items?.find((x) => x.key === 'toman');
    const dollarItem = emojiConfig.items?.find((x) => x.key === 'dollar');
    const highItem = emojiConfig.items?.find((x) => x.key === 'high');
    const lowItem = emojiConfig.items?.find((x) => x.key === 'low');
    const highLowItem = emojiConfig.items?.find((x) => x.key === 'highlow');
    const upItem = emojiConfig.items?.find((x) => x.key === 'up');
    const downItem = emojiConfig.items?.find((x) => x.key === 'down');
    const planeItem = emojiConfig.items?.find((x) => x.key === 'plane');

    const tomanEmojiTag = this.convertMarkdownEmojisToHtml(tomanItem?.emojiTag || '▫️');
    const dollarEmojiTag = this.convertMarkdownEmojisToHtml(dollarItem?.emojiTag || '![💵](tg://emoji?id=5321231658156830001)');
    const highEmojiTag = this.convertMarkdownEmojisToHtml(highItem?.emojiTag || emojiConfig.highEmoji || highLowItem?.emojiTag || '![📈](tg://emoji?id=5197503331215361533)');
    const lowEmojiTag = this.convertMarkdownEmojisToHtml(lowItem?.emojiTag || emojiConfig.lowEmoji || highLowItem?.emojiTag || '![📉](tg://emoji?id=5429518319243775957)');
    const upEmojiTag = this.convertMarkdownEmojisToHtml(upItem?.emojiTag || '🟢');
    const downEmojiTag = this.convertMarkdownEmojisToHtml(downItem?.emojiTag || '🔴');
    const planeEmojiTag = this.convertMarkdownEmojisToHtml(planeItem?.emojiTag || '✈️');

    const coins = await PriceService.getCoinData();
    const usdtRate = coins['usdt']?.irr || 268600;
    const dollarFormatted = (totalPrice / usdtRate).toFixed(2);
    const changeSign = goldData.dayChangePercent >= 0 ? upEmojiTag : downEmojiTag;
    const changeStr = `${goldData.dayChangePercent >= 0 ? '+' : ''}${goldData.dayChangePercent}%`;

    const responseMsg =
      `${header}` +
      `<b>${itemEmojiTag} ${amountStr} ${goldData.title} :</b>\n\n` +
      `<b>${tomanEmojiTag} ${tomanFormatted} toman</b>\n` +
      `<b>${dollarEmojiTag} $${dollarFormatted} dollar</b>\n` +
      `<b>${changeSign} ${changeStr}</b>\n\n` +
      `<blockquote>${highEmojiTag} High & Low ${lowEmojiTag}\n${tomanEmojiTag} ${highFormatted} / ${lowFormatted} toman</blockquote>\n\n` +
      `<b>${planeEmojiTag} ${dt.full}</b>`;

    if (chatId) {
      let sendRes: any = null;
      if (adConfig.enableCharts !== false) {
        try {
          const cardBuffer = await ImageCardService.renderSingleCardPng(
            {
              name: 'Gold 18K (طلای ۱۸ عیار)',
              symbol: 'GOLD18K',
              priceToman: totalPrice,
              priceUsd: parseFloat(dollarFormatted),
              changePercent: goldData.dayChangePercent,
              category: 'gold',
            },
            adConfig.watermarkTag || '@Modasr_Arz | MODASRP'
          );
          sendRes = await this.sendPhoto(chatId, cardBuffer, responseMsg, keyboard, token, replyToId);
        } catch {
          sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
        }
      } else {
        sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
      }

      const isOk = sendRes ? sendRes.ok !== false : true;
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: isOk ? responseMsg : `خطا در ارسال به تلگرام: ${sendRes?.description || sendRes?.error || 'ارسال ناموفق'}`,
        status: isOk ? 'success' : 'error',
      });
    } else {
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: responseMsg,
        status: 'success',
      });
    }

    return responseMsg;
  }

  /**
   * Handle Cryptocurrency Price Request
   */
  static async handleCoinRequest(msg: any, token: string = BOT_CONFIG.token): Promise<string> {
    const rawText = msg.text || '';
    let text = PriceService.faNumToEn(rawText.trim().toLowerCase());
    const chatId = msg.chat?.id;
    const isGroup = msg.chat?.type === 'group' || msg.chat?.type === 'supergroup';
    const replyToId = isGroup ? msg.message_id : undefined;
    const keyboard = this.getResponseKeyboard(isGroup);

    // Strip bot username mention if present in group (e.g. @Modasr_Arzbot 3دلار or دلار @Modasr_Arzbot)
    text = text.replace(/@[a-zA-Z0-9_]+/gi, '').trim();

    if (text.startsWith('/')) {
      text = text.substring(1).trim();
    }

    let amount = 1;
    let coinKey = text;

    const persianNumbers: Record<string, number> = {
      'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5,
      'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10,
      'بیست': 20, 'سی': 30, 'چهل': 40, 'پنجاه': 50, 'صد': 100, 'هزار': 1000
    };

    // Check for amount at beginning (e.g. "100 usdt", "50 دلار", "12دلار")
    const matchStart = text.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
    // Check for amount at end (e.g. "usdt 100", "دلار 50")
    const matchEnd = text.match(/^(.+?)\s*(\d+(?:\.\d+)?)$/);

    if (matchStart && !isNaN(parseFloat(matchStart[1]))) {
      amount = parseFloat(matchStart[1]);
      coinKey = matchStart[2].trim();
    } else if (matchEnd && !isNaN(parseFloat(matchEnd[2]))) {
      amount = parseFloat(matchEnd[2]);
      coinKey = matchEnd[1].trim();
    } else {
      for (const [w, val] of Object.entries(persianNumbers)) {
        if (text.startsWith(w) && text.length > w.length) {
          amount = val;
          coinKey = text.replace(w, '').trim();
          break;
        }
      }
    }

    const normalizedKey = MANUAL_ALIASES[coinKey] || coinKey;
    const coins = await PriceService.getCoinData();

    let coin = coins[normalizedKey] || coins[coinKey] || coins[coinKey.toLowerCase()];

    // If not found in standard dictionary, attempt unified resolver
    if (!coin) {
      const resolved = await PriceService.resolveAnyAsset(coinKey);
      if (resolved) {
        if (resolved.category === 'gold') {
          return await this.handleGoldRequest(msg, token);
        }
        if (resolved.category === 'oil') {
          return await this.handleOilRequest(msg, token);
        }
        coin = {
          name: resolved.name,
          symbol: resolved.symbol,
          usdt: resolved.priceUsd || 1.0,
          irr: resolved.priceToman || 268300,
          dayChange: resolved.dayChange || 0,
          dayHighToman: resolved.highToman,
          dayLowToman: resolved.lowToman,
        };
      }
    }

    if (!coin) {
      return '';
    }

    const usdPrice = Number(coin.usdt) || 0;
    const tomanPrice = Number(coin.irr) || 0;
    const changePercent = Number(coin.dayChange) || 0;

    const highToman = coin.dayHighToman ? Math.round(coin.dayHighToman * amount) : Math.round(tomanPrice * amount * 1.015);
    const lowToman = coin.dayLowToman ? Math.round(coin.dayLowToman * amount) : Math.round(tomanPrice * amount * 0.985);

    let symbol = (coin.symbol || coin.name || normalizedKey || coinKey).toUpperCase();
    if (symbol === 'TETHER') symbol = 'USDT';

    const dt = this.getIranianDateTime();
    const adConfig = BotStorage.getAdConfig();
    const emojiConfig = BotStorage.getEmojiConfig();

    const header = adConfig.headerIntro ? `<b>${adConfig.headerIntro}</b>\n\n` : '';
    const amountStr = PriceService.formatNumber(amount, 4);
    const usdTotalStr = PriceService.formatNumber(amount * usdPrice, 2);
    const tomanTotalStr = Math.round(amount * tomanPrice).toLocaleString('en-US');
    const highTomanStr = highToman.toLocaleString('en-US');
    const lowTomanStr = lowToman.toLocaleString('en-US');

    // Check if a specific custom emoji is registered for this coin (e.g. usdt, btc, eth, ton, etc.)
    const specificCoinItem = emojiConfig.items?.find(
      (x) => x.key === symbol.toLowerCase() || x.key === normalizedKey.toLowerCase()
    );
    const defaultCoinItem = emojiConfig.items?.find((x) => x.key === 'coin');
    const tomanItem = emojiConfig.items?.find((x) => x.key === 'toman');
    const dollarItem = emojiConfig.items?.find((x) => x.key === 'dollar');
    const highItem = emojiConfig.items?.find((x) => x.key === 'high');
    const lowItem = emojiConfig.items?.find((x) => x.key === 'low');
    const highLowItem = emojiConfig.items?.find((x) => x.key === 'highlow');
    const upItem = emojiConfig.items?.find((x) => x.key === 'up');
    const downItem = emojiConfig.items?.find((x) => x.key === 'down');
    const planeItem = emojiConfig.items?.find((x) => x.key === 'plane');

    const coinEmojiTag = this.convertMarkdownEmojisToHtml(
      specificCoinItem?.emojiTag || defaultCoinItem?.emojiTag || emojiConfig.coinEmoji || '🪙'
    );
    const tomanEmojiTag = this.convertMarkdownEmojisToHtml(tomanItem?.emojiTag || emojiConfig.tomanEmoji || '▫️');
    const dollarEmojiTag = this.convertMarkdownEmojisToHtml(dollarItem?.emojiTag || emojiConfig.dollarEmoji || '💵');
    const highEmojiTag = this.convertMarkdownEmojisToHtml(highItem?.emojiTag || emojiConfig.highEmoji || highLowItem?.emojiTag || '![📈](tg://emoji?id=5197503331215361533)');
    const lowEmojiTag = this.convertMarkdownEmojisToHtml(lowItem?.emojiTag || emojiConfig.lowEmoji || highLowItem?.emojiTag || '![📉](tg://emoji?id=5429518319243775957)');
    const upEmojiTag = this.convertMarkdownEmojisToHtml(upItem?.emojiTag || emojiConfig.upEmoji || '🟢');
    const downEmojiTag = this.convertMarkdownEmojisToHtml(downItem?.emojiTag || emojiConfig.downEmoji || '🔴');
    const planeEmojiTag = this.convertMarkdownEmojisToHtml(planeItem?.emojiTag || emojiConfig.planeEmoji || '✈️');

    const changeSign = changePercent >= 0 ? upEmojiTag : downEmojiTag;
    const changeFormatted = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';

    const isUsdFiat = symbol === 'USD' || normalizedKey === 'usd';

    // Header Emoji: Use Dollar/USA for USD fiat, and Coin/Tether for crypto
    const headerEmojiTag = isUsdFiat ? dollarEmojiTag : coinEmojiTag;
    const displayName = isUsdFiat ? `${amountStr} USD (دلار آمریکا)` : `${amountStr} ${symbol}${symbol === 'USDT' ? ' (تتر)' : ''}`;

    // Line 2: If fiat USD, no need for "$1.00 dollar", show Toman rate clearly
    const secondaryDollarLine = isUsdFiat ? '' : `<b>${dollarEmojiTag} $${usdTotalStr} dollar</b>\n`;

    // EXACT TEMPLATE MATCHING SCREENSHOT WITH REGISTERED PREMIUM EMOJIS
    const responseMsg =
      `${header}` +
      `<b>${headerEmojiTag} ${displayName} :</b>\n\n` +
      `<b>${tomanEmojiTag} ${tomanTotalStr} toman</b>\n` +
      secondaryDollarLine +
      `<b>${changeSign} ${changeFormatted}</b>\n\n` +
      `<blockquote>${highEmojiTag} High & Low ${lowEmojiTag}\n${tomanEmojiTag} ${highTomanStr} / ${lowTomanStr} toman</blockquote>\n\n` +
      `<b>${planeEmojiTag} ${dt.full}</b>`;

    if (chatId) {
      let sendRes: any = null;
      if (adConfig.enableCharts !== false) {
        try {
          const cardBuffer = await ImageCardService.renderSingleCardPng(
            {
              name: isUsdFiat ? 'دلار آمریکا (US Dollar)' : (symbol === 'USDT' ? 'تتر (Tether USDT)' : (coin.name || symbol)),
              symbol: symbol,
              priceUsd: usdPrice * amount,
              priceToman: tomanPrice * amount,
              changePercent: changePercent,
              category: isUsdFiat ? 'fiat' : 'crypto',
            },
            adConfig.watermarkTag || '@Modasr_Arz | MODASRP'
          );
          sendRes = await this.sendPhoto(chatId, cardBuffer, responseMsg, keyboard, token, replyToId);
        } catch {
          sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
        }
      } else {
        sendRes = await this.sendMessage(chatId, responseMsg, 'HTML', keyboard, token, replyToId);
      }

      const isOk = sendRes ? sendRes.ok !== false : true;
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: isOk ? responseMsg : `خطا در ارسال به تلگرام: ${sendRes?.description || sendRes?.error || 'ارسال ناموفق'}`,
        status: isOk ? 'success' : 'error',
      });
    } else {
      BotStorage.addLog({
        type: 'outgoing_msg',
        chatId: chatId,
        userId: msg.from?.id,
        text: rawText,
        response: responseMsg,
        status: 'success',
      });
    }

    return responseMsg;
  }

  static async handleCallbackAction(cb: any, token: string = BOT_CONFIG.token): Promise<void> {
    const data = cb.data;
    const chatId = cb.message?.chat?.id;
    const fromId = cb.from?.id;

    if (data.startsWith('block_user_')) {
      const targetUserId = data.replace('block_user_', '');
      BotStorage.addBlocked(targetUserId);
      const ack = `🚫 کاربر با شناسه عددی <code>${targetUserId}</code> با موفقیت مسدود شد.`;
      if (chatId) await this.sendMessage(chatId, ack, 'HTML', null, token);
      return;
    }

    if (data === 'stats') {
      const usersCount = BotStorage.getUsers().length;
      const groupsCount = BotStorage.getGroups().length;
      const blockedCount = BotStorage.getBlocked().length;
      const status = BotStorage.getBotStatus() ? '🟢 روشن' : '🔴 خاموش';

      const statsMsg =
        `📊 <b>آمار ربات:</b>\n\n` +
        `👥 تعداد کاربران: <b>${usersCount}</b>\n` +
        `📁 تعداد گروه‌ها: <b>${groupsCount}</b>\n` +
        `🚫 کاربران بلاک شده: <b>${blockedCount}</b>\n` +
        `🔴 وضعیت ربات: <b>${status}</b>`;

      if (chatId) await this.sendMessage(chatId, statsMsg, 'HTML', null, token);
    } else if (data === 'menu_emojis' || data === 'edit_emojis') {
      const msg =
        '💎 <b>منوی مدیریت ایموجی‌های پرمیوم:</b>\n\n' +
        'از این بخش می‌توانید لیست ایموجی‌های ثبت‌شده را ببینید، ایموجی جدید اضافه کنید، جایگزین نمایید یا حذف کنید.';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', this.getEmojiMenuKeyboard(), token);
    } else if (data === 'list_emojis') {
      const emojiConfig = BotStorage.getEmojiConfig();
      let listMsg = '📋 <b>لیست ایموجی‌های پرمیوم و عادی ثبت‌شده:</b>\n\n';
      
      emojiConfig.items.forEach((item, index) => {
        const preview = this.convertMarkdownEmojisToHtml(item.emojiTag);
        listMsg += `${index + 1}. <b>${item.name}</b> (کلید: <code>${item.key}</code>)\n   نمایش: ${preview} | تگ: <code>${item.emojiTag}</code>\n\n`;
      });

      listMsg += '💡 برای ویرایش، جایگزینی یا افزودن از دکمه‌های زیر استفاده کنید:';
      if (chatId) await this.sendMessage(chatId, listMsg, 'HTML', this.getEmojiMenuKeyboard(), token);
    } else if (data === 'add_emoji') {
      BotStorage.setPendingAction(fromId, 'add_emoji');
      const msg =
        '➕ <b>افزودن یا جایگزینی ایموجی پرمیوم:</b>\n\n' +
        'لطفاً <b>کلید</b> و <b>تگ یا آیدی ایموجی</b> را با علامت | ارسال کنید.\n\n' +
        '<b>قالب:</b>\n' +
        '<code>کلید | تگ_ایموجی | عنوان_دلخواه</code>\n\n' +
        '<b>مثال‌ها:</b>\n' +
        '• <code>coin | ![✨](tg://emoji?id=5832577678300943429) | ستاره اصلی ارزها</code>\n' +
        '• <code>usdt | 5832577678300943429 | ایموجی تتر</code>\n' +
        '• <code>btc | 🪙 | ایموجی بیت کوین</code>\n' +
        '• <code>gold | 👑 | تاج طلا</code>\n' +
        '• <code>plane | 🚀 | موشک به جای هواپیما</code>';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', null, token);
    } else if (data === 'del_emoji') {
      BotStorage.setPendingAction(fromId, 'del_emoji');
      const msg =
        '🗑️ <b>حذف ایموجی:</b>\n\n' +
        'لطفاً <b>کلید یا شناسه ایموجی</b> مورد نظر را ارسال کنید (مثلاً: <code>usdt</code> یا <code>coin_star</code>).';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', null, token);
    } else if (data === 'reset_emojis') {
      BotStorage.resetEmojisToDefault();
      const msg = '🔄 <b>تمام ایموجی‌ها به حالت پیش‌فرض اولیه بازنشانی شدند.</b>';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', this.getEmojiMenuKeyboard(), token);
    } else if (data === 'back_admin') {
      const kb = this.getAdminKeyboard();
      const adminMsg = '<b>پنل مدیریت ربات :</b>\n➖➖➖➖➖➖➖➖‏➖➖➖';
      if (chatId) await this.sendMessage(chatId, adminMsg, 'HTML', kb, token);
    } else if (data === 'edit_ad') {
      BotStorage.setPendingAction(fromId, 'edit_ad');
      const msg =
        '⚙️ <b>تنظیم دکمه تبلیغ:</b>\n\n' +
        'لطفاً متن دکمه و لینک را با علامت | بفرستید.\n\n' +
        'مثال:\n' +
        '<code>🖥 خرید سرور ساعتی ↗️ | https://t.me/SpiderM9n</code>';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', null, token);
    } else if (data === 'edit_header') {
      BotStorage.setPendingAction(fromId, 'edit_header');
      const msg =
        '📝 <b>تنظیم هدر/مقدمه پیام‌ها:</b>\n\n' +
        'لطفاً متن برندینگ یا مقدمه‌ای که بالای قیمت‌ها قرار می‌گیرد را ارسال کنید.\n\n' +
        'مثال:\n' +
        '<code>MØD†SR.lua ᶻ z ƪ</code>';
      if (chatId) await this.sendMessage(chatId, msg, 'HTML', null, token);
    } else if (data === 'list_groups') {
      const groups = BotStorage.getGroups();
      if (groups.length === 0) {
        if (chatId) await this.sendMessage(chatId, '📁 هیچ گروهی ثبت نشده.', 'HTML', null, token);
        return;
      }
      let listMsg = '📁 <b>لیست گروه‌ها:</b>\n\n';
      groups.slice(0, 50).forEach((gid) => {
        listMsg += `- <code>${gid}</code>\n`;
      });
      if (groups.length > 50) {
        listMsg += `\nو ${groups.length - 50} گروه دیگر...`;
      }
      if (chatId) await this.sendMessage(chatId, listMsg, 'HTML', null, token);
    } else if (data === 'enable' || data === 'disable') {
      const isEnable = data === 'enable';
      BotStorage.setBotStatus(isEnable);
      const statusMsg = isEnable
        ? '🟢 ربات روشن شد.'
        : '🔴 ربات خاموش شد. (فقط ادمین می‌تواند با ربات کار کند)';
      if (chatId) await this.sendMessage(chatId, statusMsg, 'HTML', null, token);
    } else if (['broadcast', 'forward', 'block', 'unblock'].includes(data)) {
      BotStorage.setPendingAction(fromId, data);
      let promptMsg = '';
      if (data === 'broadcast') {
        promptMsg = '📢 لطفا متن یا پیام مورد نظر برای ارسال همگانی را ارسال یا فوروارد کنید.';
      } else if (data === 'forward') {
        promptMsg = '📨 لطفا پیام مورد نظر را فوروارد کنید تا به همهٔ کاربران و گروه‌ها فوروارد شود.';
      } else if (data === 'block') {
        promptMsg = '🚫 لطفا آیدی عددی کاربر را ارسال کنید یا به پیام او ریپلای کنید تا بلاک شود.';
      } else {
        promptMsg = '✅ لطفا آیدی عددی کاربر را ارسال کنید یا به پیام او ریپلای کنید تا آنبلاک شود.';
      }
      if (chatId) await this.sendMessage(chatId, promptMsg, 'HTML', null, token);
    }
  }

  static async handleAdminPendingAction(msg: any, action: string, token: string = BOT_CONFIG.token): Promise<string> {
    const chatId = msg.chat?.id;
    const fromId = msg.from?.id;

    if (action === 'add_emoji') {
      const text = (msg.text || '').trim();
      if (text.includes('|')) {
        const parts = text.split('|').map((s: string) => s.trim());
        const key = parts[0];
        const emojiTag = parts[1];
        const name = parts[2] || `ایموجی ${key}`;

        const item = BotStorage.addOrUpdateEmojiItem({
          key,
          emojiTag,
          name,
        });

        const preview = this.convertMarkdownEmojisToHtml(item.emojiTag);
        const resp = `✅ <b>ایموجی با موفقیت ثبت / جایگزین شد:</b>\n\n• عنوان: ${item.name}\n• کلید: <code>${item.key}</code>\n• پیش‌نمایش: ${preview}\n• تگ: <code>${item.emojiTag}</code>`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', this.getEmojiMenuKeyboard(), token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      } else {
        // Single emoji tag provided -> update default coin star
        const item = BotStorage.addOrUpdateEmojiItem({
          key: 'coin',
          emojiTag: text,
          name: 'ستاره اصلی ارزها',
        });
        const preview = this.convertMarkdownEmojisToHtml(item.emojiTag);
        const resp = `✅ <b>ایموجی اصلی با موفقیت جایگزین شد:</b>\n${preview}`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', this.getEmojiMenuKeyboard(), token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      }
    }

    if (action === 'del_emoji') {
      const keyOrId = (msg.text || '').trim().toLowerCase();
      const success = BotStorage.deleteEmojiItem(keyOrId);
      const resp = success
        ? `✅ ایموجی با کلید/شناسه <code>${keyOrId}</code> حذف شد.`
        : `⚠️ ایموجی با کلید <code>${keyOrId}</code> یافت نشد.`;
      if (chatId) await this.sendMessage(chatId, resp, 'HTML', this.getEmojiMenuKeyboard(), token);
      BotStorage.clearPendingAction(fromId);
      return resp;
    }

    if (action === 'edit_ad') {
      const text = msg.text || '';
      if (text.includes('|')) {
        const [btnText, btnUrl] = text.split('|').map((s: string) => s.trim());
        BotStorage.setAdConfig({ buttonText: btnText, buttonUrl: btnUrl, isEnabled: true });
        const resp = `✅ دکمه تبلیغاتی با موفقیت تنظیم شد:\nعنوان: ${btnText}\nلینک: ${btnUrl}`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      } else {
        const resp = '⚠️ لطفاً متن و لینک را با علامت | جدا کنید (مثال: عنوان دکمه | https://...)';
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        return resp;
      }
    }

    if (action === 'edit_header') {
      const text = (msg.text || '').trim();
      BotStorage.setAdConfig({ headerIntro: text });
      const resp = `✅ متن مقدمه/هدر پیام‌ها تنظیم شد:\n${text}`;
      if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
      BotStorage.clearPendingAction(fromId);
      return resp;
    }

    if (action === 'broadcast') {
      const text = msg.text;
      if (text) {
        const count = await this.broadcastToUsers(text, token);
        const resp = `✅ پیام همگانی به ${count} کاربر ارسال شد.`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      } else {
        const count = await this.forwardToAll(chatId, msg.message_id, token);
        const resp = `✅ پیام به ${count} کاربر/گروه فوروارد شد.`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      }
    }

    if (action === 'forward') {
      const count = await this.forwardToAll(chatId, msg.message_id, token);
      const resp = `✅ پیام به ${count} کاربر/گروه فوروارد شد.`;
      if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
      BotStorage.clearPendingAction(fromId);
      return resp;
    }

    if (action === 'block' || action === 'unblock') {
      let targetId: number | string | null = null;
      if (msg.reply_to_message?.from?.id) {
        targetId = msg.reply_to_message.from.id;
      } else if (msg.forward_from?.id) {
        targetId = msg.forward_from.id;
      } else if (msg.text && !isNaN(parseInt(msg.text, 10))) {
        targetId = parseInt(msg.text.trim(), 10);
      }

      if (!targetId) {
        const err = '⚠️ نتوانستم آیدی کاربر را استخراج کنم. لطفا آیدی عددی را بفرستید یا به پیام کاربر ریپلای کنید.';
        if (chatId) await this.sendMessage(chatId, err, 'HTML', null, token);
        return err;
      }

      if (action === 'block') {
        BotStorage.addBlocked(targetId);
        const resp = `🚫 کاربر با آیدی ${targetId} بلاک شد.`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      } else {
        BotStorage.removeBlocked(targetId);
        const resp = `✅ کاربر با آیدی ${targetId} آنبلاک شد.`;
        if (chatId) await this.sendMessage(chatId, resp, 'HTML', null, token);
        BotStorage.clearPendingAction(fromId);
        return resp;
      }
    }

    BotStorage.clearPendingAction(fromId);
    return 'عملیات نامشخص لغو شد.';
  }
}
