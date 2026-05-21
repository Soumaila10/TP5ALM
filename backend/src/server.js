require('dotenv').config();

const { initMonitoring } = require('./config/monitoring');
initMonitoring();

const { loadEnv } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const {
  createRedisClient,
  createFallbackRedisClient,
  setRedisClient,
  pingRedis,
  disconnectRedis,
} = require('./config/redis');
const { logger } = require('./utils/logger');
const { createApp } = require('./app');
const { initMatchListener } = require('./listeners/matchListener');


async function bootstrap() {
  const env = loadEnv();

  let dbUri = env.MONGODB_URI || env.COSMOS_CONNECTION_STRING;
  let mongoServer = null;

  if (env.NODE_ENV === 'development' && !dbUri) {
    logger.info('[bootstrap] MONGODB_URI or COSMOS_CONNECTION_STRING missing in development. Starting MongoMemoryServer fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      dbUri = mongoServer.getUri();
      logger.info(`[bootstrap] MongoMemoryServer started successfully at ${dbUri}`);
    } catch (err) {
      logger.error({ err }, '[bootstrap] Failed to start MongoMemoryServer');
    }
  }

  if (dbUri) {
    try {
      await connectDB({
        uri: dbUri,
        dbName: env.COSMOS_DB_NAME,
        logger,
      });

      // If we spun up MongoMemoryServer, automatically seed it with mock matches
      if (mongoServer) {
        logger.info('[bootstrap] Seeding in-memory database with mock matches, stadiums, seats, and admin...');
        const { seedData } = require('./scripts/seed');
        await seedData();
        logger.info('[bootstrap] In-memory database seeded successfully!');
      }
    } catch (err) {
      if (env.NODE_ENV === 'development' && !mongoServer) {
        logger.warn({ err: err.message }, `[bootstrap] Failed to connect to DB at ${dbUri}. Falling back to MongoMemoryServer...`);
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoServer = await MongoMemoryServer.create();
          const fallbackUri = mongoServer.getUri();
          await connectDB({
            uri: fallbackUri,
            dbName: env.COSMOS_DB_NAME,
            logger,
          });
          logger.info('[bootstrap] Connected to fallback MongoMemoryServer. Seeding mock matches...');
          const { seedData } = require('./scripts/seed');
          await seedData();
          logger.info('[bootstrap] In-memory database seeded successfully!');
        } catch (fallbackErr) {
          logger.fatal({ err: fallbackErr }, '[bootstrap] Fallback MongoMemoryServer also failed');
          throw fallbackErr;
        }
      } else {
        logger.fatal({ err }, '[bootstrap] Database connection failed');
        if (mongoServer) await mongoServer.stop();
        throw err;
      }
    }
  } else {
    logger.warn('[bootstrap] MONGODB_URI or COSMOS_CONNECTION_STRING missing — DB disabled (dev only)');
  }

  if (env.UPSTASH_REDIS_URL) {
    const redis = createRedisClient({ url: env.UPSTASH_REDIS_URL, logger });
    setRedisClient(redis);
    const ok = await pingRedis(redis);
    logger.info({ pong: ok }, '[bootstrap] redis ping');
  } else if (env.NODE_ENV === 'development') {
    const redis = createFallbackRedisClient({ logger });
    setRedisClient(redis);
    const ok = await pingRedis(redis);
    logger.info({ pong: ok }, '[bootstrap] redis fallback ping');
  } else {
    logger.warn('[bootstrap] UPSTASH_REDIS_URL missing — Redis disabled (production requires config)');
  }

  initMatchListener();

  const app = createApp({ frontendUrl: env.FRONTEND_URL });

  const server = app.listen(env.PORT, () => {
    logger.info(`[server] FIFA Ticketing backend listening on :${env.PORT}`);
  });

  const shutdown = async (signal) => {
    logger.info(`[server] ${signal} received, closing...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      if (mongoServer) {
        await mongoServer.stop().catch(() => {});
      }
      await disconnectRedis().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };


  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, '[bootstrap] failed to start');
  process.exit(1);
});
