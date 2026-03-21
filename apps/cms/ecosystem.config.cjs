module.exports = {
  apps: [
    {
      name: 'inaka-cms',
      cwd: '/opt/inaka-coffee/apps/cms',
      script: 'node_modules/.bin/strapi',
      args: 'start',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
