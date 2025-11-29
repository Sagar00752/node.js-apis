// events/redisClient.js
require('dotenv').config();
const { createClient } = require('redis');

const useTls = String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true';

const socket = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  // If useTls is true, we provide an object so OpenSSL uses TLS.
  // rejectUnauthorized:false is included only for dev/testing (not recommended in prod).
  ...(useTls ? { tls: { rejectUnauthorized: false } } : {})
};

const client = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: (process.env.REDIS_PASSWORD || '').trim(),
  socket
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err && err.message ? err.message : err);
});

(async () => {
  try {
    await client.connect();
    console.log('Redis client connected');
  } catch (err) {
    console.error('Redis connect failed:', err && err.message ? err.message : err);
  }
})();

module.exports = client;
