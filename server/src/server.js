import { createApp } from './app.js';
import { config } from './config/index.js';
import { pool } from './db/pool.js';

const server = createApp().listen(config.PORT, () => {
  console.log(`Sweety API listening on http://localhost:${config.PORT}`);
});

// Close the HTTP server and DB pool cleanly on Ctrl+C / container stop.
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
