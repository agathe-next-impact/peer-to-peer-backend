import type { Core } from '@strapi/strapi';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.CORS_ORIGIN) {
  console.warn('WARNING: CORS_ORIGIN is not set. CORS will default to localhost origins.');
}

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((s: string) => s.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: true,
      maxAge: 3600,
      keepHeaderOnError: true,
    },
  },
  {
    name: 'global::rate-limit',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // max attempts per window
      paths: ['/api/auth/local', '/api/auth/local/register', '/api/auth/forgot-password'],
      message: 'Trop de tentatives, veuillez réessayer plus tard.',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      jsonLimit: '1mb',
      formLimit: '10mb',
      textLimit: '1mb',
      formidable: {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
