const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

async function connectDB({ uri, dbName, logger } = {}) {
  if (!uri) {
    throw new Error('Database connection URI (MONGODB_URI or COSMOS_CONNECTION_STRING) is required');
  }

  const isCosmos = uri.includes('cosmos.azure.com') || uri.includes('documentdb');

  const connection = await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
    ...(isCosmos ? { retryWrites: false } : {}),
  });

  if (logger) {
    logger.info({ dbName, isCosmos }, `[db] connected to ${isCosmos ? 'Cosmos DB' : 'MongoDB'}`);
  }

  mongoose.connection.on('disconnected', () => {
    if (logger) logger.warn('[db] disconnected');
  });
  mongoose.connection.on('error', (err) => {
    if (logger) logger.error({ err }, '[db] connection error');
  });

  return connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, mongoose };
