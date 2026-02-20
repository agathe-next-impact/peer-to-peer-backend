import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      sizeLimit: env.int('UPLOAD_MAX_SIZE', 10 * 1024 * 1024), // 10 MB default
    },
  },
});

export default config;
