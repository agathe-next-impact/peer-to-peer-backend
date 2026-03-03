import type { Core } from '@strapi/strapi';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

/**
 * In-memory token blacklist with file persistence.
 * Stores JTI (JWT ID) or full token hashes of revoked tokens.
 *
 * Tokens are cleaned up automatically once they would have expired anyway.
 */

interface BlacklistEntry {
  /** Token hash (first 16 chars of the JWT) — enough for uniqueness */
  hash: string;
  /** When this entry can be removed (token expiration time) */
  expiresAt: number;
}

const blacklist = new Map<string, BlacklistEntry>();
const PERSIST_PATH = path.join(process.cwd(), '.tmp', 'token-blacklist.json');

function tokenHash(jwt: string): string {
  // Use the signature part of the JWT as a unique identifier
  const parts = jwt.split('.');
  return parts.length === 3 ? parts[2].slice(0, 32) : jwt.slice(0, 32);
}

function loadBlacklist() {
  try {
    if (fs.existsSync(PERSIST_PATH)) {
      const raw = fs.readFileSync(PERSIST_PATH, 'utf-8');
      const entries: BlacklistEntry[] = JSON.parse(raw);
      const now = Date.now();
      for (const entry of entries) {
        if (entry.expiresAt > now) {
          blacklist.set(entry.hash, entry);
        }
      }
    }
  } catch {
    // Ignore corrupt file
  }
}

async function saveBlacklist() {
  try {
    const dir = path.dirname(PERSIST_PATH);
    if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(PERSIST_PATH, JSON.stringify(Array.from(blacklist.values())), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of blacklist) {
    if (now > entry.expiresAt) blacklist.delete(key);
  }
  saveBlacklist();
}, 10 * 60 * 1000);

// Load on startup
loadBlacklist();

export function revokeToken(jwt: string) {
  const hash = tokenHash(jwt);
  // Keep in blacklist for 24h (well beyond any JWT lifetime)
  blacklist.set(hash, {
    hash,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  saveBlacklist();
}

export function isTokenRevoked(jwt: string): boolean {
  return blacklist.has(tokenHash(jwt));
}

/**
 * Strapi middleware that rejects requests with revoked tokens.
 */
const tokenBlacklistMiddleware: Core.MiddlewareFactory = () => {
  return async (ctx, next) => {
    const authHeader = ctx.request.headers['authorization'] as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (isTokenRevoked(token)) {
        ctx.status = 401;
        ctx.body = {
          error: {
            status: 401,
            name: 'UnauthorizedError',
            message: 'Token révoqué',
          },
        };
        return;
      }
    }

    await next();
  };
};

export default tokenBlacklistMiddleware;
