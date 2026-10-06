import { BOT_CONFIG } from './config';
import { BotStorage } from './storage';
import { TelegramService } from './telegramService';

export interface AlertDetails {
  userId?: number | string;
  username?: string;
  chatId?: number | string;
  chatTitle?: string;
  incomingText?: string;
  category?: 'telegram_api' | 'price_api' | 'channel_poster' | 'system' | 'user_bug_report';
  isCritical?: boolean;
}

export class AdminAlertService {
  // Deduplication cache: errorKey -> timestamp ms
  private static recentAlerts: Map<string, number> = new Map();

  /**
   * Send an automated system error or bug alert to the Admin's private chat
   */
  static async sendErrorAlert(
    errorTitle: string,
    errorMsg: string,
    details?: AlertDetails,
    token: string = BOT_CONFIG.token
  ): Promise<{ ok: boolean; message?: string }> {
    const config = BotStorage.getAdminAlertConfig();

    if (!config.isEnabled) {
      return { ok: false, message: 'سیستم اطلاع‌رسانی خطاها غیرفعال است.' };
    }

    const adminId = config.adminId || BOT_CONFIG.adminId;
    if (!adminId) {
      return { ok: false, message: 'شناسه ادمین (Admin ID) تعریف نشده است.' };
    }

    // Category check
    const category = details?.category || 'system';
    if (category === 'price_api' && !config.notifyOnApiErrors) return { ok: false };
    if (category === 'telegram_api' && !config.notifyOnTelegramErrors) return { ok: false };
    if (category === 'channel_poster' && !config.notifyOnChannelErrors) return { ok: false };

    // Severity filter
    if (config.minSeverity === 'critical' && !details?.isCritical) return { ok: false };
    if (config.minSeverity === 'bugs_only' && category !== 'user_bug_report') return { ok: false };

    // Deduplication check: prevent spamming admin on repeated errors
    const errorKey = `${category}_${errorTitle}_${errorMsg.substring(0, 50)}`;
    const now = Date.now();
    const cooldownMs = (config.rateLimitMinutes || 2) * 60 * 1000;
    const lastTime = this.recentAlerts.get(errorKey);

    if (lastTime && now - lastTime < cooldownMs) {
      return { ok: true, message: 'پیام در بازه کول‌داون رد شد.' };
    }
    this.recentAlerts.set(errorKey, now);

    // Clean up old cooldown keys periodically
    if (this.recentAlerts.size > 200) {
      for (const [k, t] of this.recentAlerts.entries()) {
        if (now - t > 3600000) this.recentAlerts.delete(k);
      }
    }

    const persianTime = new Date().toLocaleTimeString('fa-IR', { hour12: false });
    const persianDate = new Date().toLocaleDateString('fa-IR');

    const categoryNames: Record<string, string> = {
      telegram_api: '📡 ارتباط با سرورهای تلگرام (Telegram API)',
      price_api: '💹 وب‌سرویس دریافت نرخ و قیمت‌ها (Price API)',
      channel_poster: '📢 ارسال‌کننده خودکار کانال (Channel Poster)',
      system: '⚙️ خطای هسته و پردازش سیستم (Core Engine)',
      user_bug_report: '🐛 گزارش باگ از طرف کاربر',
    };

    const categoryTitle = categoryNames[category] || '⚠️ خطای عمومی سیستم';

    let messageText =
      `🚨 <b>گزارش خطای خودکار ربات تلگرام</b> 🚨\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `📌 <b>عنوان خطا:</b> ${errorTitle}\n` +
      `🏷 <b>بخش:</b> ${categoryTitle}\n` +
      `⏱ <b>زمان وقوع:</b> ${persianDate} | ${persianTime}\n`;

    if (details?.userId) {
      const userTag = details.username ? `@${details.username}` : 'بدون یوزرنیم';
      messageText += `👤 <b>کاربر مرتبط:</b> ${userTag} (ID: <code>${details.userId}</code>)\n`;
    }

    if (details?.chatId) {
      const chatInfo = details.chatTitle ? ` (${details.chatTitle})` : '';
      messageText += `💬 <b>چت / گروه:</b> <code>${details.chatId}</code>${chatInfo}\n`;
    }

    if (details?.incomingText) {
      messageText += `📝 <b>دستور ارسالی کاربر:</b> <code>${details.incomingText}</code>\n`;
    }

    messageText +=
      `\n❌ <b>شرح و لاگ خطا:</b>\n` +
      `<blockquote><code>${errorMsg.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></blockquote>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `⚡️ <i>سامانه مانیتورینگ هوشمند Modasr Arzbot</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📊 آمار زنده ربات', callback_data: 'stats' },
          { text: '⚙️ منوی مدیریت', callback_data: 'back_admin' },
        ],
      ],
    };

    try {
      const res = await TelegramService.sendMessage(adminId, messageText, 'HTML', keyboard, token);
      
      // Also add to persistent activity logs
      BotStorage.addLog({
        type: 'system',
        text: `ارسال هشدار به پیوی ادمین: ${errorTitle}`,
        response: errorMsg,
        status: 'warning',
      });

      return { ok: !!res.ok, message: res.ok ? 'هشدار با موفقیت به پیوی ادمین ارسال شد.' : res.description };
    } catch (e: any) {
      console.error('Failed to send admin error alert:', e);
      return { ok: false, message: e.message };
    }
  }

  /**
   * Forward a user-submitted bug report or suggestion directly to the Admin's private chat
   */
  static async sendUserBugReport(
    fromUser: { id: number | string; username?: string; first_name?: string; last_name?: string },
    reportText: string,
    chatId?: number | string,
    token: string = BOT_CONFIG.token
  ): Promise<{ ok: boolean; message?: string }> {
    const config = BotStorage.getAdminAlertConfig();
    const adminId = config.adminId || BOT_CONFIG.adminId;

    if (!adminId) {
      return { ok: false, message: 'شناسه ادمین تعیین نشده است.' };
    }

    const persianTime = new Date().toLocaleTimeString('fa-IR', { hour12: false });
    const persianDate = new Date().toLocaleDateString('fa-IR');
    const fullName = `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim() || 'کاربر گرامی';
    const userTag = fromUser.username ? `@${fromUser.username}` : 'بدون یوزرنیم';

    const messageText =
      `📬 <b>گزارش باگ / پیشنهاد جدید از کاربر</b>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `👤 <b>ارسال‌کننده:</b> ${fullName} (${userTag})\n` +
      `🆔 <b>آیدی عددی کاربر:</b> <code>${fromUser.id}</code>\n` +
      (chatId && chatId !== fromUser.id ? `💬 <b>ارسال شده از چت:</b> <code>${chatId}</code>\n` : '') +
      `⏱ <b>زمان:</b> ${persianDate} | ${persianTime}\n\n` +
      `📝 <b>متن گزارش کاربر:</b>\n` +
      `<blockquote>${reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `💡 <i>جهت پاسخ مستقیم می‌توانید به آیدی کاربر پیام دهید یا از دکمه‌های زیر استفاده کنید.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🚫 بلاک این کاربر', callback_data: `block_user_${fromUser.id}` },
        ],
      ],
    };

    try {
      const res = await TelegramService.sendMessage(adminId, messageText, 'HTML', keyboard, token);

      BotStorage.addLog({
        type: 'incoming_msg',
        userId: fromUser.id,
        chatId: chatId || fromUser.id,
        username: fromUser.username,
        text: `گزارش باگ: ${reportText.substring(0, 50)}`,
        response: 'ارسال شده به پیوی ادمین',
        status: 'info',
      });

      return { ok: !!res.ok, message: 'گزارش شما با موفقیت برای ادمین ارسال شد.' };
    } catch (e: any) {
      console.error('Failed to send user bug report to admin:', e);
      return { ok: false, message: 'خطا در ارسال گزارش به ادمین' };
    }
  }

  /**
   * Send a test alert to verify the admin is receiving notifications in private chat
   */
  static async sendTestAlert(token: string = BOT_CONFIG.token): Promise<{ ok: boolean; message: string }> {
    const config = BotStorage.getAdminAlertConfig();
    const adminId = config.adminId || BOT_CONFIG.adminId;

    if (!adminId) {
      return { ok: false, message: 'شناسه ادمین تعریف نشده است.' };
    }

    const persianTime = new Date().toLocaleTimeString('fa-IR', { hour12: false });
    const persianDate = new Date().toLocaleDateString('fa-IR');

    const testMessage =
      `🧪 <b>تست سیستم گزارش و هشدار خطای ادمین</b>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `✅ ارتباط ربات با پیوی ادمین برقرار و فعال است!\n` +
      `🆔 <b>آیدی ادمین:</b> <code>${adminId}</code>\n` +
      `⏱ <b>زمان ارسال تست:</b> ${persianDate} | ${persianTime}\n` +
      `🤖 <b>ربات فرستنده:</b> @Modasr_Arzbot\n\n` +
      `📌 <i>از این پس تمامی خطاها، باگ‌ها و قطعی‌های وب‌سرویس‌ها به صورت لحظه‌ای به این صفحه ارسال خواهند شد.</i>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `⚡️ <i>پنل مدیریت هوشمند Modasr Arzbot</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📊 باز کردن پنل مدیریت', callback_data: 'back_admin' },
          { text: '📈 وضعیت قیمت‌ها', callback_data: 'stats' },
        ],
      ],
    };

    try {
      const res = await TelegramService.sendMessage(adminId, testMessage, 'HTML', keyboard, token);
      if (res.ok) {
        BotStorage.addLog({
          type: 'system',
          text: `ارسال پیام تست سیستم خطاها به ادمین (${adminId})`,
          status: 'success',
        });
        return { ok: true, message: `پیام تست با موفقیت به پیوی ادمین (آیدی: ${adminId}) ارسال شد.` };
      } else {
        return { ok: false, message: `تلگرام ارسال پیام را نپذیرفت: ${res.description || 'ناموفق'}. لطفاً مطمئن شوید ربات را در پیوی استارت کرده‌اید.` };
      }
    } catch (e: any) {
      return { ok: false, message: `خطا در ارتباط با تلگرام: ${e.message}` };
    }
  }
}
