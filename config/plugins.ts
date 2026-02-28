import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      sizeLimit: env.int('UPLOAD_MAX_SIZE', 10 * 1024 * 1024), // 10 MB default
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env.int('SMTP_PORT', 1025),
        secure: env.bool('SMTP_SECURE', false),
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'noreply@pairemancipation.fr'),
        defaultReplyTo: env('SMTP_REPLY_TO', 'noreply@pairemancipation.fr'),
      },
    },
  },
});

export default config;
