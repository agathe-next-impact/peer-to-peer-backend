import type { Core } from '@strapi/strapi';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  paths?: string[];
  message?: string;
  /** Max failed login attempts per identifier before lockout */
  accountLockoutMax?: number;
  /** Lockout durations in ms (progressive: 1min, 5min, 15min, 1h) */
  accountLockoutDurations?: number[];
  /** Trust proxy headers (X-Forwarded-For) */
  trustProxy?: boolean;
  /** Persist rate limit data to disk */
  persistPath?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface AccountLockoutEntry {
  failures: number;
  lockedUntil: number;
  lockoutLevel: number;
}

interface PersistentStore {
  ipEntries: Record<string, RateLimitEntry>;
  accountEntries: Record<string, AccountLockoutEntry>;
}

const ipStore = new Map<string, RateLimitEntry>();
const accountStore = new Map<string, AccountLockoutEntry>();

const DEFAULT_LOCKOUT_DURATIONS = [
  60 * 1000,        // 1 minute
  5 * 60 * 1000,    // 5 minutes
  15 * 60 * 1000,   // 15 minutes
  60 * 60 * 1000,   // 1 hour
];

let persistPath: string | null = null;

function loadFromDisk() {
  if (!persistPath) return;
  try {
    if (fs.existsSync(persistPath)) {
      const raw = fs.readFileSync(persistPath, 'utf-8');
      const data: PersistentStore = JSON.parse(raw);
      const now = Date.now();

      for (const [key, entry] of Object.entries(data.ipEntries || {})) {
        if (now < entry.resetAt) ipStore.set(key, entry);
      }
      for (const [key, entry] of Object.entries(data.accountEntries || {})) {
        if (now < entry.lockedUntil || entry.failures > 0) accountStore.set(key, entry);
      }
    }
  } catch {
    // Ignore corrupt file
  }
}

async function saveToDisk() {
  if (!persistPath) return;
  try {
    const data: PersistentStore = {
      ipEntries: Object.fromEntries(ipStore),
      accountEntries: Object.fromEntries(accountStore),
    };
    const dir = path.dirname(persistPath);
    if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(persistPath, JSON.stringify(data), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

// Cleanup expired entries every 5 minutes & persist
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipStore) {
    if (now > entry.resetAt) ipStore.delete(key);
  }
  for (const [key, entry] of accountStore) {
    if (now > entry.lockedUntil && entry.failures === 0) accountStore.delete(key);
  }
  saveToDisk();
}, 5 * 60 * 1000);

/**
 * Extract the real client IP, handling proxy headers when configured.
 */
function getClientIp(ctx: { request: { ip?: string; headers?: Record<string, string | string[] | undefined> } }, trustProxy: boolean): string {
  if (trustProxy && ctx.request.headers) {
    const forwarded = ctx.request.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return first.split(',')[0].trim();
    }
    const realIp = ctx.request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0].trim() : realIp.trim();
    }
  }
  return ctx.request.ip || 'unknown';
}

const rateLimitMiddleware: Core.MiddlewareFactory = (config: RateLimitConfig) => {
  const windowMs = config.windowMs ?? 15 * 60 * 1000; // 15 min
  const max = config.max ?? 20;
  const paths = config.paths ?? ['/api/auth/local', '/api/auth/local/register', '/api/auth/forgot-password'];
  const message = config.message ?? 'Too many requests, please try again later.';
  const accountLockoutMax = config.accountLockoutMax ?? 5;
  const lockoutDurations = config.accountLockoutDurations ?? DEFAULT_LOCKOUT_DURATIONS;
  const trustProxy = config.trustProxy ?? (process.env.NODE_ENV === 'production');

  // Setup persistence
  persistPath = config.persistPath ?? path.join(process.cwd(), '.tmp', 'rate-limit-store.json');
  loadFromDisk();

  return async (ctx, next) => {
    const requestPath = ctx.request.path;

    if (!paths.some((p) => requestPath.startsWith(p))) {
      return next();
    }

    const ip = getClientIp(ctx, trustProxy);
    const now = Date.now();

    // --- Per-IP rate limiting ---
    const ipKey = `${ip}:${requestPath}`;

    let ipEntry = ipStore.get(ipKey);
    if (!ipEntry || now > ipEntry.resetAt) {
      ipEntry = { count: 0, resetAt: now + windowMs };
      ipStore.set(ipKey, ipEntry);
    }

    ipEntry.count++;

    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - ipEntry.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(ipEntry.resetAt / 1000)));

    if (ipEntry.count > max) {
      ctx.status = 429;
      ctx.body = { error: { status: 429, name: 'TooManyRequests', message } };
      return;
    }

    // --- Per-account lockout (login endpoint only) ---
    if (requestPath === '/api/auth/local') {
      const body = ctx.request.body as Record<string, unknown> | undefined;
      const identifier = (body?.identifier as string || '').toLowerCase().trim();

      if (identifier) {
        const accountEntry = accountStore.get(identifier);

        // Check if account is currently locked
        if (accountEntry && now < accountEntry.lockedUntil) {
          const retryAfterMs = accountEntry.lockedUntil - now;
          const retryAfterSec = Math.ceil(retryAfterMs / 1000);
          ctx.set('Retry-After', String(retryAfterSec));
          ctx.status = 429;
          ctx.body = {
            error: {
              status: 429,
              name: 'AccountLocked',
              message: `Compte temporairement verrouillé. Réessayez dans ${Math.ceil(retryAfterSec / 60)} minute(s).`,
            },
          };
          return;
        }

        // Execute the request then check result
        await next();

        // If login failed (401), increment failure counter
        if (ctx.status === 400 || ctx.status === 401) {
          const entry = accountStore.get(identifier) || { failures: 0, lockedUntil: 0, lockoutLevel: 0 };
          entry.failures++;

          if (entry.failures >= accountLockoutMax) {
            const level = Math.min(entry.lockoutLevel, lockoutDurations.length - 1);
            entry.lockedUntil = now + lockoutDurations[level];
            entry.lockoutLevel++;
            entry.failures = 0;
          }

          accountStore.set(identifier, entry);
        } else if (ctx.status === 200) {
          // Successful login: reset lockout
          accountStore.delete(identifier);
        }

        return; // next() already called
      }
    }

    await next();
  };
};

export default rateLimitMiddleware;
