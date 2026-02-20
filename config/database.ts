import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams) => {
  const client = env('DATABASE_CLIENT') ||
    (env('DATABASE_URL') || env('DATABASE_HOST') ? 'postgres' : 'sqlite');

  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite' as const,
        connection: {
          filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
        },
        useNullAsDefault: true,
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }

  // PostgreSQL — use DATABASE_URL if available, otherwise individual vars
  const databaseUrl = env('DATABASE_URL');

  const pgConnection: Record<string, unknown> = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  if (env.bool('DATABASE_SSL', false)) {
    pgConnection.ssl = {
      rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
    };
  }

  return {
    connection: {
      client: 'postgres' as const,
      connection: pgConnection,
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};

export default config;
