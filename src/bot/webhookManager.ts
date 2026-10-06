import { BOT_CONFIG } from './config';

export interface WebhookInfoResult {
  ok: boolean;
  result?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    ip_address?: string;
    last_error_date?: number;
    last_error_message?: string;
    last_synchronization_error_date?: number;
    max_connections?: number;
    allowed_updates?: string[];
  };
  description?: string;
  error_code?: number;
}

export interface BotInfoResult {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
  };
  description?: string;
  error_code?: number;
}

export class WebhookManager {
  private static getBaseUrl(token: string = BOT_CONFIG.token): string {
    return `https://api.telegram.org/bot${token}`;
  }

  static async getBotInfo(token: string = BOT_CONFIG.token): Promise<BotInfoResult> {
    try {
      const res = await fetch(`${this.getBaseUrl(token)}/getMe`);
      return (await res.json()) as BotInfoResult;
    } catch (e: any) {
      return { ok: false, description: e?.message || 'Connection error' };
    }
  }

  static async getWebhookInfo(token: string = BOT_CONFIG.token): Promise<WebhookInfoResult> {
    try {
      const res = await fetch(`${this.getBaseUrl(token)}/getWebhookInfo`);
      return (await res.json()) as WebhookInfoResult;
    } catch (e: any) {
      return { ok: false, description: e?.message || 'Connection error' };
    }
  }

  static async setWebhook(
    webhookUrl: string,
    dropPendingUpdates: boolean = false,
    token: string = BOT_CONFIG.token
  ): Promise<{ ok: boolean; description?: string; result?: boolean; error_code?: number }> {
    try {
      const endpoint = `${this.getBaseUrl(token)}/setWebhook`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: dropPendingUpdates,
          allowed_updates: ['message', 'callback_query', 'channel_post'],
          secret_token: BOT_CONFIG.webhookSecret,
        }),
      });
      const data = await res.json();
      
      // If 409 Conflict occurs (e.g. getUpdates connection still closing), retry cleanly
      if (!data.ok && data.error_code === 409) {
        console.warn('⚠️ Telegram setWebhook returned 409. Clearing webhook and retrying...');
        await this.deleteWebhook(true, token);
        await new Promise((r) => setTimeout(r, 1500));
        const retryRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            drop_pending_updates: dropPendingUpdates,
            allowed_updates: ['message', 'callback_query', 'channel_post'],
          secret_token: BOT_CONFIG.webhookSecret,
          }),
        });
        return await retryRes.json();
      }

      return data;
    } catch (e: any) {
      return { ok: false, description: e?.message || 'Connection failed' };
    }
  }

  static async deleteWebhook(
    dropPendingUpdates: boolean = false,
    token: string = BOT_CONFIG.token
  ): Promise<{ ok: boolean; description?: string; result?: boolean }> {
    try {
      const endpoint = `${this.getBaseUrl(token)}/deleteWebhook`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drop_pending_updates: dropPendingUpdates,
        }),
      });
      return await res.json();
    } catch (e: any) {
      return { ok: false, description: e?.message || 'Connection failed' };
    }
  }
}
