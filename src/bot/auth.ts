import crypto from 'crypto';

/**
 * Admin panel authentication helpers (no external dependencies).
 * Sessions are stateless: "<expiry>.<nonce>.<hmac>" stored in an HttpOnly cookie.
 * The HMAC key is derived from ADMIN_PASSWORD + BOT_TOKEN, so changing the
 * password (or token) instantly invalidates every existing session.
 */

export const SESSION_COOKIE = 'modasr_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const sha256 = (s: string): Buffer => crypto.createHash('sha256').update(s).digest();

export function safeEqual(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function sign(payload: string): string {
  const key = `${process.env.ADMIN_PASSWORD || ''}|${process.env.BOT_TOKEN || ''}|modasr-session-v1`;
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

export function createSessionToken(now: number = Date.now()): string {
  const payload = `${now + SESSION_TTL_MS}.${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now: number = Date.now()): boolean {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  const expected = sign(`${exp}.${nonce}`);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > now;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      out[k] = part.slice(i + 1).trim();
    }
  }
  return out;
}

export function sessionCookie(token: string, secure: boolean): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function clearCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

// ---------------------------------------------------------------------------
// Brute-force protection: 5 wrong passwords => this IP is locked for 15 minutes
// ---------------------------------------------------------------------------
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

interface Attempt {
  count: number;
  first: number;
  lockedUntil: number;
}
const attempts = new Map<string, Attempt>();

export function checkLoginAllowed(ip: string, now: number = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const a = attempts.get(ip);
  if (a && a.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((a.lockedUntil - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordLoginFailure(ip: string, now: number = Date.now()): void {
  let a = attempts.get(ip);
  if (!a || now - a.first > WINDOW_MS) {
    a = { count: 0, first: now, lockedUntil: 0 };
  }
  a.count += 1;
  if (a.count >= MAX_FAILURES) {
    a.lockedUntil = now + LOCK_MS;
    a.count = 0;
    a.first = now;
  }
  attempts.set(ip, a);
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (v.lockedUntil < now && now - v.first > WINDOW_MS) attempts.delete(k);
    }
  }
}

export function recordLoginSuccess(ip: string): void {
  attempts.delete(ip);
}
