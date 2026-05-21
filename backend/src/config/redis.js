const Redis = require('ioredis');

let client = null;

function createRedisClient({ url, logger } = {}) {
  if (!url) {
    throw new Error('UPSTASH_REDIS_URL is required to create a Redis client');
  }

  const c = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    tls: url.startsWith('rediss://') ? {} : undefined,
  });

  c.on('connect', () => logger?.info('[redis] connecting...'));
  c.on('ready', () => logger?.info('[redis] ready'));
  c.on('error', (err) => logger?.error({ err }, '[redis] error'));
  c.on('end', () => logger?.warn('[redis] connection closed'));

  return c;
}

function createFallbackRedisClient({ logger } = {}) {
  const store = new Map();
  const expirations = new Map();

  const cleanupIfExpired = (key) => {
    const expiresAt = expirations.get(key);
    if (expiresAt && Date.now() >= expiresAt) {
      store.delete(key);
      expirations.delete(key);
      return true;
    }
    return false;
  };

  const client = {
    on: () => {},
    async set(key, value, mode, option, expires) {
      if (cleanupIfExpired(key)) {
        // expired lock removed automatically
      }
      if (mode === 'NX' && store.has(key)) {
        return null;
      }
      store.set(key, value);
      if (option === 'EX' && typeof expires === 'number') {
        expirations.set(key, Date.now() + expires * 1000);
      } else {
        expirations.delete(key);
      }
      return 'OK';
    },
    async get(key) {
      if (cleanupIfExpired(key)) {
        return null;
      }
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    async del(key) {
      expirations.delete(key);
      return store.delete(key) ? 1 : 0;
    },
    async ping() {
      return 'PONG';
    },
    async quit() {
      store.clear();
      expirations.clear();
      return 'OK';
    },
  };

  logger?.warn('[redis] using in-memory Redis fallback for development');

  return client;
}

function setRedisClient(c) {
  client = c;
}

function getRedisClient() {
  if (!client) {
    throw new Error('Redis client not initialized. Call setRedisClient() first.');
  }
  return client;
}

async function pingRedis(c = client) {
  if (!c) throw new Error('No Redis client to ping');
  const pong = await c.ping();
  return pong === 'PONG';
}

async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = {
  createRedisClient,
  createFallbackRedisClient,
  setRedisClient,
  getRedisClient,
  pingRedis,
  disconnectRedis,
};
