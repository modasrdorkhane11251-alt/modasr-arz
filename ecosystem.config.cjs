// PM2 process definition (used by the installer: `pm2 start ecosystem.config.cjs`)
module.exports = {
  apps: [
    {
      name: 'modasr-bot',
      script: 'server.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
      restart_delay: 3000,
      time: true,
    },
  ],
};
