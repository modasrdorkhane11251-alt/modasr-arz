import { BOT_CONFIG } from './config';
import { TelegramService, TelegramUpdate } from './telegramService';
import { WebhookManager } from './webhookManager';
import { BotStorage } from './storage';

export class PollingService {
  private static isRunning: boolean = false;
  private static activeToken: string = BOT_CONFIG.token;
  private static lastUpdateId: number = 0;
  private static pollTimeout: NodeJS.Timeout | null = null;
  private static abortController: AbortController | null = null;
  private static consecutiveConflicts: number = 0;
  private static lastError: string | null = null;
  // Session / generation tracker to strictly prevent overlapping poll loops
  private static currentSessionId: number = 0;

  static getStatus(): {
    isRunning: boolean;
    activeToken: string;
    lastUpdateId: number;
    lastError: string | null;
    consecutiveConflicts: number;
  } {
    return {
      isRunning: this.isRunning,
      activeToken: this.activeToken,
      lastUpdateId: this.lastUpdateId,
      lastError: this.lastError,
      consecutiveConflicts: this.consecutiveConflicts,
    };
  }

  static async start(token: string = BOT_CONFIG.token, force: boolean = false): Promise<{ ok: boolean; message: string }> {
    if (this.isRunning && this.activeToken === token && !force) {
      return { ok: true, message: 'سرویس Polling در حال اجرا است' };
    }

    // Invalidate any previous loop immediately
    this.stop();

    this.activeToken = token;
    this.consecutiveConflicts = 0;
    this.lastError = null;

    // Increment session ID so any in-flight loop or timeout from previous session terminates instantly
    const sessionId = ++this.currentSessionId;

    // Pause to allow any in-flight request from previous process/reload to drop on Telegram's side
    await new Promise((r) => setTimeout(r, 2200));

    // If stopped during the pause, abort
    if (sessionId !== this.currentSessionId) return { ok: false, message: 'Polling cancelled' };

    // Clear any webhook and drop pending updates on Telegram server
    try {
      await WebhookManager.deleteWebhook(true, token);
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      // quiet fallback
    }

    if (sessionId !== this.currentSessionId) return { ok: false, message: 'Polling cancelled' };

    this.isRunning = true;

    BotStorage.addLog({
      type: 'system',
      text: `سرویس Long Polling برای ربات فعال شد (توکن: ${token.substring(0, 10)}...)`,
      status: 'success',
    });

    console.log(`🚀 Telegram Bot Long Polling started for token: ${token.substring(0, 10)}... (session: ${sessionId})`);
    this.pollLoop(sessionId);

    return { ok: true, message: 'سرویس Polling با موفقیت استارت شد' };
  }

  static stop(): void {
    this.isRunning = false;
    // Invalidate session so any waiting loop aborts
    this.currentSessionId++;

    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {}
      this.abortController = null;
    }
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('⏹️ Telegram Bot Polling stopped.');
  }

  private static async pollLoop(sessionId: number): Promise<void> {
    // If stopped or if a new session started, kill this loop immediately
    if (!this.isRunning || sessionId !== this.currentSessionId) return;

    let nextDelayMs = 400;

    try {
      this.abortController = new AbortController();
      const offsetParam = this.lastUpdateId > 0 ? `&offset=${this.lastUpdateId + 1}` : '';
      // Use 5 second timeout so Telegram holds the connection briefly
      const url = `https://api.telegram.org/bot${this.activeToken}/getUpdates?timeout=5&limit=25${offsetParam}`;

      const res = await fetch(url, {
        signal: this.abortController.signal,
      });

      // Verify session is still valid after fetch completes
      if (sessionId !== this.currentSessionId || !this.isRunning) return;

      if (res.ok) {
        const data = await res.json();
        this.consecutiveConflicts = 0;
        this.lastError = null;

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result as TelegramUpdate[]) {
            if (update.update_id) {
              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            }

            try {
              TelegramService.handleUpdate(update, this.activeToken).catch(() => {});
            } catch (err) {
              console.error('Error processing update in polling loop:', err);
            }
          }
        }
        nextDelayMs = 250;
      } else {
        const errData = await res.json().catch(() => ({}));
        const desc = String(errData?.description || '');
        const statusCode = res.status;

        // Handle Error 409 Conflict gracefully
        if (statusCode === 409 || errData?.error_code === 409) {
          this.consecutiveConflicts++;
          this.lastError = `⚠️ تداخل 409 تلگرام: ${desc}`;

          // Only log if conflict persists continuously (e.g. 4+ times)
          if (this.consecutiveConflicts > 3 && this.consecutiveConflicts % 5 === 0) {
            console.warn(`⚠️ Telegram 409 Conflict persisting: ${desc}`);
          }

          // Clear webhook in case a stale webhook was re-registered
          if (desc.includes('webhook')) {
            await WebhookManager.deleteWebhook(true, this.activeToken).catch(() => {});
          }

          // Wait 4.5 seconds for Telegram's server-side socket to release
          nextDelayMs = 4500;
        } else if (statusCode === 401 || errData?.error_code === 401) {
          this.isRunning = false;
          this.lastError = 'توکن تلگرام نامعتبر است (Error 401 Unauthorized).';
          BotStorage.addLog({
            type: 'system',
            text: '❌ توکن ربات تلگرام نامعتبر است یا توسط BotFather لغو شده است (Error 401).',
            status: 'error',
          });
          return;
        } else {
          nextDelayMs = 2500;
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        nextDelayMs = 2500;
      }
    }

    // Schedule next iteration ONLY if this session is still the active one
    if (this.isRunning && sessionId === this.currentSessionId) {
      this.pollTimeout = setTimeout(() => this.pollLoop(sessionId), nextDelayMs);
    }
  }
}
