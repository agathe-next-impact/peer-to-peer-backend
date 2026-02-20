import type { Core } from '@strapi/strapi';

interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  paths?: string[];
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

const rateLimitMiddleware: Core.MiddlewareFactory = (config: RateLimitConfig) => {
  const windowMs = config.windowMs ?? 15 * 60 * 1000; // 15 min
  const max = config.max ?? 20;
  const paths = config.paths ?? ['/api/auth/local', '/api/auth/local/register', '/api/auth/forgot-password'];
  const message = config.message ?? 'Too many requests, please try again later.';

  return async (ctx, next) => {
    const requestPath = ctx.request.path;

    if (!paths.some((p) => requestPath.startsWith(p))) {
      return next();
    }

    const ip = ctx.request.ip || 'unknown';
    const key = `${ip}:${requestPath}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      ctx.status = 429;
      ctx.body = { error: { status: 429, name: 'TooManyRequests', message } };
      return;
    }

    await next();
  };
};

export default rateLimitMiddleware;
