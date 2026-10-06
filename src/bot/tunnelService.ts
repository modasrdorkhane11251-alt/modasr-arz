import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

export class TunnelService {
  private static publicUrl: string = '';
  private static process: ChildProcess | null = null;
  private static isStarting: boolean = false;
  private static fallbackUrl: string = 'https://ais-pre-zskvaylyhohvurwbbahz3f-866989204783.europe-west2.run.app';

  /**
   * Start or retrieve the public tunnel URL
   */
  static getPublicUrl(): string {
    return this.publicUrl || this.fallbackUrl;
  }

  static getMiniAppUrl(): string {
    const base = this.publicUrl || this.fallbackUrl;
    return `${base}/mini-modasr-arz`;
  }

  static isTunnelActive(): boolean {
    return Boolean(this.publicUrl && this.publicUrl.includes('trycloudflare.com'));
  }

  /**
   * Initialize Cloudflare Tunnel in background
   */
  static async startTunnel(): Promise<string> {
    if (this.publicUrl) return this.publicUrl;
    if (this.isStarting) return this.fallbackUrl;

    this.isStarting = true;
    const binaryPath = '/tmp/cloudflared';

    try {
      if (!fs.existsSync(binaryPath)) {
        console.log('[TunnelService] Downloading cloudflared binary...');
        const res = await fetch('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64');
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(binaryPath, buffer);
          fs.chmodSync(binaryPath, 0o755);
        }
      }

      console.log('[TunnelService] Spawning cloudflared tunnel on port 3000...');
      this.process = spawn(binaryPath, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const handleOutput = (chunk: Buffer) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && match[0]) {
          this.publicUrl = match[0];
          console.log('[TunnelService] 🚀 Public Telegram Mini App URL:', this.getMiniAppUrl());
        }
      };

      this.process.stdout?.on('data', handleOutput);
      this.process.stderr?.on('data', handleOutput);

      this.process.on('close', (code) => {
        console.log(`[TunnelService] cloudflared process exited with code ${code}. Restarting in 5s...`);
        this.publicUrl = '';
        this.process = null;
        this.isStarting = false;
        setTimeout(() => this.startTunnel(), 5000);
      });

      // Wait up to 10 seconds for URL
      for (let i = 0; i < 20; i++) {
        if (this.publicUrl) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      return this.publicUrl || this.fallbackUrl;
    } catch (err) {
      console.error('[TunnelService] Error starting tunnel:', err);
      this.isStarting = false;
      return this.fallbackUrl;
    } finally {
      this.isStarting = false;
    }
  }
}
