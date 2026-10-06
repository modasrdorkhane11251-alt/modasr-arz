import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { BOT_CONFIG, DEFAULT_BOT_TOKEN } from './src/bot/config';
import {
  SESSION_COOKIE,
  safeEqual,
  parseCookies,
  createSessionToken,
  verifySessionToken,
  sessionCookie,
  clearCookie,
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from './src/bot/auth';
import { BotStorage } from './src/bot/storage';
import { TelegramService, TelegramUpdate } from './src/bot/telegramService';
import { WebhookManager } from './src/bot/webhookManager';
import { PriceService } from './src/bot/priceService';
import { PollingService } from './src/bot/pollingService';
import { ImageCardService } from './src/bot/imageCardService';
import { ChannelPostService } from './src/bot/channelPostService';
import { TunnelService } from './src/bot/tunnelService';
import { AdminAlertService } from './src/bot/adminAlertService';
import { KEYBOARD_THEME_PRESETS } from './src/bot/types';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Block Google and search engine indexation
app.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

// Health check (public, no sensitive data) - used by installer, Nginx and monitoring
const STARTED_AT = Date.now();
app.get('/health', (_req: Request, res: Response) => {
  const sec = Math.floor((Date.now() - STARTED_AT) / 1000);
  const uptime = sec >= 3600 ? `${Math.floor(sec / 3600)}h` : sec >= 60 ? `${Math.floor(sec / 60)}m` : `${sec}s`;
  res.json({ status: 'ok', storage: 'ok', bot: BOT_CONFIG.token ? 'configured' : 'missing_token', uptime });
});

// ---------------------------------------------------------------------------
// Security: admin login (cookie session) + Telegram webhook verification
// ---------------------------------------------------------------------------
app.set('trust proxy', 1); // behind Nginx

const WEBHOOK_PATHS = new Set(['/api/telegram/webhook', '/index.php', '/webhook']);
// Public endpoints needed by the Telegram Mini App (normal users)
const isPublicRoute = (req: Request): boolean =>
  (req.method === 'GET' && req.path === '/api/bot/card-preview') ||
  req.path.startsWith('/api/miniapp/');
const isAdminApi = (req: Request): boolean =>
  req.path.startsWith('/api/bot/') ||
  req.path.startsWith('/api/channel/') ||
  req.path.startsWith('/api/telegram/') ||
  req.path.startsWith('/api/backup/');

const isAuthenticated = (req: Request): boolean => {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookies = parseCookies(req.headers.cookie);
  if (verifySessionToken(cookies[SESSION_COOKIE])) return true;
  // Basic auth stays supported for scripts / curl (no browser popup is triggered)
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    return safeEqual(decoded.slice(decoded.indexOf(':') + 1), process.env.ADMIN_PASSWORD);
  }
  return false;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  // Webhook calls: must carry the secret that we gave Telegram in setWebhook
  if (req.method === 'POST' && WEBHOOK_PATHS.has(req.path)) {
    const got = String(req.headers['x-telegram-bot-api-secret-token'] || '');
    if (!got || !safeEqual(got, BOT_CONFIG.webhookSecret)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    return next();
  }

  if (!isAdminApi(req) || isPublicRoute(req)) return next();

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      ok: false,
      error: 'ADMIN_PASSWORD is not set. Run "modasr passwd" on the server.',
    });
  }
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
});

// Login page API
app.post('/api/auth/login', (req: Request, res: Response) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) {
    res.setHeader('Retry-After', String(gate.retryAfterSec));
    return res.status(429).json({ ok: false, error: 'too_many_attempts', retryAfterSec: gate.retryAfterSec });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    recordLoginFailure(ip);
    return res.status(401).json({ ok: false, error: 'invalid_password' });
  }
  recordLoginSuccess(ip);
  res.setHeader('Set-Cookie', sessionCookie(createSessionToken(), req.secure));
  return res.json({ ok: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  return res.json({
    ok: true,
    configured: Boolean(process.env.ADMIN_PASSWORD),
    authenticated: isAuthenticated(req),
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.setHeader('Set-Cookie', clearCookie(req.secure));
  return res.json({ ok: true });
});

// 0. Backup & Restore (پشتیبان‌گیری کامل دیتابیس، دکمه‌ها و تنظیمات)
app.get(['/api/backup/export', '/api/backup/download'], (req: Request, res: Response) => {
  try {
    const backup = BotStorage.exportBackup();
    const fileName = `modasr-arz-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(JSON.stringify(backup, null, 2));
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/backup/restore', (req: Request, res: Response) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ ok: false, error: 'داده‌های فایل بک‌آپ ارسال نشده است.' });
    }
    const result = BotStorage.restoreBackup(backupData);
    return res.json({ ok: result.success, ...result });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 1. Telegram Webhook Endpoint
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update: TelegramUpdate = req.body;
    const token = (req.query.token as string) || BOT_CONFIG.token;
    
    BotStorage.addLog({
      type: 'webhook_event',
      text: update.message?.text || (update.callback_query ? `CB: ${update.callback_query.data}` : 'Update received'),
      userId: update.message?.from?.id || update.callback_query?.from?.id,
      chatId: update.message?.chat?.id || update.callback_query?.message?.chat?.id,
      username: update.message?.from?.username || update.callback_query?.from?.username,
      status: 'info',
    });

    const result = await TelegramService.handleUpdate(update, token);
    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    console.error('Error handling Telegram webhook update:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
});

app.post('/index.php', async (req: Request, res: Response) => {
  const update: TelegramUpdate = req.body;
  await TelegramService.handleUpdate(update, BOT_CONFIG.token);
  return res.status(200).send('OK');
});

app.post('/webhook', async (req: Request, res: Response) => {
  const update: TelegramUpdate = req.body;
  await TelegramService.handleUpdate(update, BOT_CONFIG.token);
  return res.status(200).send('OK');
});

// 2. Webhook & Bot Status
app.get('/api/telegram/status', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || BOT_CONFIG.token;
    const [botInfo, webhookInfo] = await Promise.all([
      WebhookManager.getBotInfo(token),
      WebhookManager.getWebhookInfo(token),
    ]);

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const defaultWebhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
    const pollingStatus = PollingService.getStatus();
    const publicMiniAppUrl = TunnelService.getMiniAppUrl();

    return res.json({
      ok: true,
      botInfo,
      webhookInfo,
      defaultWebhookUrl,
      pollingStatus,
      publicMiniAppUrl,
      isTunnelActive: TunnelService.isTunnelActive(),
      currentConfig: {
        botUsername: botInfo.ok ? botInfo.result?.username : BOT_CONFIG.botUsername,
        adminId: BOT_CONFIG.adminId,
        botStatus: BotStorage.getBotStatus(),
        maskedToken: token.substring(0, 10) + '...' + token.slice(-5),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 3. Set Webhook
app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
  try {
    const { url, dropPendingUpdates, token } = req.body;
    const activeToken = token || BOT_CONFIG.token;
    
    // Stop Polling when setting webhook and wait for in-flight getUpdates to disconnect
    PollingService.stop();
    await new Promise((r) => setTimeout(r, 1000));

    let targetUrl = url;
    if (!targetUrl) {
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      targetUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
    }

    const result = await WebhookManager.setWebhook(targetUrl, !!dropPendingUpdates, activeToken);
    
    BotStorage.addLog({
      type: 'system',
      text: `تنظیم وبهوک به آدرس: ${targetUrl}`,
      status: result.ok ? 'success' : 'error',
    });

    return res.json({ ok: result.ok, result, targetUrl });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 4. Delete Webhook
app.post('/api/telegram/delete-webhook', async (req: Request, res: Response) => {
  try {
    const { dropPendingUpdates, token } = req.body;
    const activeToken = token || BOT_CONFIG.token;
    const result = await WebhookManager.deleteWebhook(!!dropPendingUpdates, activeToken);
    
    BotStorage.addLog({
      type: 'system',
      text: 'حذف وبهوک تلگرام',
      status: result.ok ? 'success' : 'error',
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 5. Polling Controls
app.post('/api/telegram/start-polling', async (req: Request, res: Response) => {
  try {
    const { token, force } = req.body;
    const activeToken = token || BOT_CONFIG.token;
    const result = await PollingService.start(activeToken, !!force);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/telegram/stop-polling', (req: Request, res: Response) => {
  PollingService.stop();
  return res.json({ ok: true, message: 'Polling متوقف شد' });
});

// 6. Bot Statistics & Logs
app.get('/api/bot/stats', (req: Request, res: Response) => {
  const users = BotStorage.getUsers();
  const groups = BotStorage.getGroups();
  const blocked = BotStorage.getBlocked();
  const isEnabled = BotStorage.getBotStatus();
  const logs = BotStorage.getLogs(100);

  return res.json({
    ok: true,
    stats: {
      usersCount: users.length,
      groupsCount: groups.length,
      blockedCount: blocked.length,
      isEnabled,
      users,
      groups,
      blocked,
    },
    logs,
  });
});

// 6.1 Dedicated Activity Logs & Clear
app.get('/api/bot/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  return res.json({ ok: true, logs: BotStorage.getLogs(limit) });
});

app.post('/api/bot/logs/clear', (req: Request, res: Response) => {
  BotStorage.clearLogs();
  return res.json({ ok: true, message: 'تمام لاگ‌ها با موفقیت پاکسازی شدند.', logs: [] });
});

// 7. Toggle Bot Status
app.post('/api/bot/status', (req: Request, res: Response) => {
  const { enabled } = req.body;
  BotStorage.setBotStatus(!!enabled);
  return res.json({ ok: true, isEnabled: BotStorage.getBotStatus() });
});

// 7.1 Ad & Sponsor Button Configuration + Dynamic Custom Buttons
app.get('/api/bot/ad-config', (req: Request, res: Response) => {
  return res.json({ ok: true, adConfig: BotStorage.getAdConfig() });
});

// 7.15 Global Keyboard HEX Color Theme Studio (تنظیم کدهای رنگی سفارشی کیبورد شیشه‌ای)
app.get('/api/bot/keyboard-theme', (req: Request, res: Response) => {
  return res.json({
    ok: true,
    theme: BotStorage.getKeyboardTheme(),
    presets: KEYBOARD_THEME_PRESETS,
  });
});

app.post('/api/bot/keyboard-theme', (req: Request, res: Response) => {
  const updated = BotStorage.setKeyboardTheme(req.body);
  return res.json({
    ok: true,
    theme: updated,
    message: 'کدهای رنگی سفارشی کیبورد تلگرام با موفقیت ذخیره و اعمال شدند.',
  });
});

app.post('/api/bot/ad-config', (req: Request, res: Response) => {
  const {
    buttonText,
    buttonUrl,
    headerIntro,
    isEnabled,
    enableCharts,
    watermarkTag,
    customButtons,
    miniAppLogoUrl,
    miniAppBannerUrl,
    miniAppTitle,
    miniAppSubtitle,
  } = req.body;
  const updated = BotStorage.setAdConfig({
    buttonText,
    buttonUrl,
    headerIntro,
    isEnabled: isEnabled !== undefined ? !!isEnabled : true,
    enableCharts: enableCharts !== undefined ? !!enableCharts : true,
    watermarkTag: watermarkTag || '@MODASR_ARZ | MODASRP',
    customButtons: Array.isArray(customButtons) ? customButtons : undefined,
    miniAppLogoUrl: miniAppLogoUrl !== undefined ? miniAppLogoUrl : undefined,
    miniAppBannerUrl: miniAppBannerUrl !== undefined ? miniAppBannerUrl : undefined,
    miniAppTitle: miniAppTitle !== undefined ? miniAppTitle : undefined,
    miniAppSubtitle: miniAppSubtitle !== undefined ? miniAppSubtitle : undefined,
  });
  return res.json({ ok: true, adConfig: updated });
});

app.post('/api/bot/buttons/add', (req: Request, res: Response) => {
  const { text, url, type, colorTheme, iconEmoji, premiumEmojiId, row, showInGroup, showInPrivate, showInChannel } = req.body;
  if (!text) {
    return res.status(400).json({ ok: false, error: 'متن دکمه الزامی است' });
  }
  const created = BotStorage.addCustomButton({
    text: text.trim(),
    url: (url || '').trim(),
    type: type || 'url',
    colorTheme: colorTheme || 'emerald',
    iconEmoji: iconEmoji || '🔗',
    premiumEmojiId: premiumEmojiId || undefined,
    isEnabled: true,
    row: typeof row === 'number' ? row : 1,
    showInGroup: showInGroup !== false,
    showInPrivate: showInPrivate !== false,
    showInChannel: showInChannel !== false,
  });
  return res.json({ ok: true, button: created, adConfig: BotStorage.getAdConfig() });
});

app.post('/api/bot/buttons/update', (req: Request, res: Response) => {
  const { id, ...updates } = req.body;
  if (!id) {
    return res.status(400).json({ ok: false, error: 'شناسه دکمه الزامی است' });
  }
  const updated = BotStorage.updateCustomButton(id, updates);
  if (!updated) {
    return res.status(404).json({ ok: false, error: 'دکمه یافت نشد' });
  }
  return res.json({ ok: true, button: updated, adConfig: BotStorage.getAdConfig() });
});

app.post('/api/bot/buttons/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ ok: false, error: 'شناسه دکمه الزامی است' });
  }
  const deleted = BotStorage.deleteCustomButton(id);
  return res.json({ ok: deleted, adConfig: BotStorage.getAdConfig() });
});

// 7.2 Custom Telegram Premium Emoji Configuration
app.get('/api/bot/emoji-config', (req: Request, res: Response) => {
  return res.json({ ok: true, emojiConfig: BotStorage.getEmojiConfig() });
});

app.post('/api/bot/emoji-config', (req: Request, res: Response) => {
  const updated = BotStorage.setEmojiConfig(req.body);
  return res.json({ ok: true, emojiConfig: updated });
});

app.post('/api/bot/emoji-item', (req: Request, res: Response) => {
  const { name, key, emojiTag, id, emojiId } = req.body;
  if (!name || !emojiTag) {
    return res.status(400).json({ ok: false, error: 'Name and emojiTag are required' });
  }
  const item = BotStorage.addOrUpdateEmojiItem({ name, key, emojiTag, id, emojiId });
  return res.json({ ok: true, item, emojiConfig: BotStorage.getEmojiConfig() });
});

app.delete('/api/bot/emoji-item/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const success = BotStorage.deleteEmojiItem(id);
  return res.json({ ok: success, emojiConfig: BotStorage.getEmojiConfig() });
});

app.post('/api/bot/emoji-reset', (req: Request, res: Response) => {
  const resetConfig = BotStorage.resetEmojisToDefault();
  return res.json({ ok: true, emojiConfig: resetConfig });
});

app.post('/api/bot/emoji-bulk-import', (req: Request, res: Response) => {
  const { rawText } = req.body;
  if (!rawText) {
    return res.status(400).json({ ok: false, error: 'rawText is required' });
  }
  const updated = BotStorage.importBulkEmojiPack(rawText);
  return res.json({ ok: true, emojiConfig: updated });
});

// 7.3 Visual Card Preview (PNG Render)
app.get('/api/bot/card-preview', async (req: Request, res: Response) => {
  try {
    const symbol = ((req.query.symbol as string) || 'BTC').toUpperCase();
    const asset = await PriceService.resolveAnyAsset(symbol);
    if (!asset) {
      return res.status(404).send('Asset not found');
    }
    const pngBuffer = await ImageCardService.renderSingleCardPng({
      name: asset.name,
      symbol: asset.symbol,
      priceUsd: asset.priceUsd,
      priceToman: asset.priceToman,
      changePercent: asset.dayChange,
      category: asset.category,
      unit: asset.unit,
    });
    res.setHeader('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

app.get('/api/bot/grid-preview', async (req: Request, res: Response) => {
  try {
    const rawAssets = await PriceService.getMarketOverviewAssets();
    const assets = rawAssets.map((a) => ({
      name: a.name,
      symbol: a.symbol,
      priceUsd: a.priceUsd,
      priceToman: a.priceToman,
      changePercent: a.dayChange,
      category: a.category,
    }));
    const pngBuffer = await ImageCardService.renderGridOverviewPng(assets);
    res.setHeader('Content-Type', 'image/png');
    return res.send(pngBuffer);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

// 7.4 Admin Private Error Alerts & Bug Reporting
app.get('/api/bot/alert-config', (req: Request, res: Response) => {
  return res.json({ ok: true, alertConfig: BotStorage.getAdminAlertConfig() });
});

app.post('/api/bot/alert-config', (req: Request, res: Response) => {
  const updated = BotStorage.setAdminAlertConfig(req.body);
  return res.json({ ok: true, alertConfig: updated, message: 'تنظیمات ارسال خطاها با موفقیت ذخیره شد.' });
});

app.post('/api/bot/alert-config/test', async (req: Request, res: Response) => {
  const result = await AdminAlertService.sendTestAlert(BOT_CONFIG.token);
  return res.json(result);
});

// 8. Broadcast Message
app.post('/api/bot/broadcast', async (req: Request, res: Response) => {
  try {
    const { message, token } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }
    const count = await TelegramService.broadcastToUsers(message, token || BOT_CONFIG.token);
    return res.json({ ok: true, sentCount: count });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 8.2 Mini App Data & Interactive Charts (CoinPJ / Qeymat style)
app.get('/api/miniapp/data', async (req: Request, res: Response) => {
  try {
    const data = await PriceService.getMiniAppData();
    const adConfig = BotStorage.getAdConfig();
    return res.json({
      ok: true,
      data,
      brand: {
        title: adConfig.miniAppTitle || adConfig.headerIntro || 'mini MODASR arz',
        subtitle: adConfig.miniAppSubtitle || 'پیشخوان هوشمند طلا، ارز و کریپتو',
        channelUrl: adConfig.buttonUrl || 'https://t.me/MODASR_ARZ',
        channelTag: adConfig.watermarkTag || '@MODASR_ARZ',
        botUsername: BOT_CONFIG.botUsername,
        publicMiniAppUrl: TunnelService.getMiniAppUrl(),
        isTunnelActive: TunnelService.isTunnelActive(),
        miniAppLogoUrl: adConfig.miniAppLogoUrl || '',
        miniAppBannerUrl: adConfig.miniAppBannerUrl || '',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/miniapp/chart/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = (req.params.symbol || 'BTC').toLowerCase();
    const asset = await PriceService.resolveAnyAsset(symbol);
    const basePrice = asset ? (asset.priceToman || asset.priceUsd || 1000) : 1000;
    const change = asset?.dayChange || 0;
    const chart = await PriceService.get7DayChartData(symbol, basePrice, change);
    return res.json({
      ok: true,
      symbol: symbol.toUpperCase(),
      asset,
      chart,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});
app.get('/api/channel/config', (req: Request, res: Response) => {
  const config = BotStorage.getChannelPosterConfig();
  const now = Date.now();
  const intervalMs = (config.intervalMinutes || 60) * 60 * 1000;
  const elapsed = now - (config.lastPostTime || 0);
  const remainingMs = Math.max(0, intervalMs - elapsed);
  const nextPostMinutes = Math.ceil(remainingMs / 60000);

  return res.json({
    ok: true,
    config,
    nextPostMinutes,
    nextPostTime: new Date(now + remainingMs).toISOString(),
  });
});

app.post('/api/channel/config', (req: Request, res: Response) => {
  const updated = BotStorage.setChannelPosterConfig(req.body);
  return res.json({ ok: true, config: updated });
});

app.post('/api/channel/post-now', async (req: Request, res: Response) => {
  try {
    const { channelId, token } = req.body;
    const result = await ChannelPostService.postHourlyUpdate(channelId, true, token);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Live Prices for Web Ticker
app.get('/api/bot/prices', async (req: Request, res: Response) => {
  try {
    const [goldPrice, coins] = await Promise.all([
      PriceService.getGoldPrice(),
      PriceService.getCoinData(),
    ]);

    return res.json({
      ok: true,
      goldPriceRials: goldPrice ? goldPrice.tomanPrice * 10 : null,
      goldPriceToman: goldPrice ? goldPrice.tomanPrice : null,
      coins,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 10. Simulator Endpoint for Web Testing
app.post('/api/bot/simulate', async (req: Request, res: Response) => {
  try {
    const { text, fromId, chatId, isGroup, chatType } = req.body;
    if (!text) {
      return res.status(400).json({ ok: false, error: 'Text is required' });
    }

    const effectiveFromId = fromId ? parseInt(fromId, 10) : (BOT_CONFIG.adminId || 999999999);
    const effectiveChatId = chatId ? parseInt(chatId, 10) : effectiveFromId;

    const fakeUpdate: TelegramUpdate = {
      update_id: Math.floor(Math.random() * 100000),
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: {
          id: effectiveFromId,
          is_bot: false,
          first_name: 'تستر داشبورد',
          username: 'dashboard_tester',
        },
        chat: {
          id: effectiveChatId,
          type: chatType || (isGroup ? 'group' : 'private'),
          title: isGroup ? 'گروه تستی' : undefined,
          first_name: 'تستر داشبورد',
        },
        date: Math.floor(Date.now() / 1000),
        text: text,
      },
    };

    const result = await TelegramService.handleUpdate(fakeUpdate);
    let cardUrl: string | undefined = undefined;
    try {
      const asset = await PriceService.resolveAnyAsset(text);
      if (asset) {
        cardUrl = `/api/bot/card-preview?symbol=${encodeURIComponent(asset.symbol)}&t=${Date.now()}`;
      }
    } catch {
      // Ignore preview url errors
    }

    return res.json({ ok: true, update: fakeUpdate, result, cardUrl });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// Vite Integration for Fullstack Web UI
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Telegram Bot Server running on http://0.0.0.0:${PORT}`);
    
    // Start Long Polling immediately so the bot responds on Telegram instantly!
    try {
      await PollingService.start(BOT_CONFIG.token);
    } catch (e) {
      console.warn('Initial polling start notice:', e);
    }

    // Start Auto-Channel Hourly Poster Scheduler
    try {
      ChannelPostService.startScheduler();
    } catch (e) {
      console.warn('ChannelPostService scheduler start notice:', e);
    }

    // Start Cloudflare Public Tunnel for 100% public, error-free Telegram Mini App access
    try {
      TunnelService.startTunnel().then((url) => {
        console.log(`🌐 Public Tunnel active for Telegram Mini App: ${url}/mini-modasr-arz`);
      }).catch((e) => {
        console.warn('TunnelService startup notice:', e);
      });
    } catch (e) {
      console.warn('TunnelService init notice:', e);
    }
  });

  const cleanup = () => {
    console.log('🛑 Gracefully stopping Telegram Polling and Channel Scheduler...');
    PollingService.stop();
    ChannelPostService.stopScheduler();
    server.close();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer();
