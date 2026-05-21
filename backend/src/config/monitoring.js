const appInsights = require('applicationinsights');
const { logger } = require('../utils/logger');

function initMonitoring() {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (connectionString) {
    try {
      appInsights.setup(connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .start();
      
      logger.info('[monitoring] Azure Application Insights initialized successfully');
    } catch (err) {
      logger.error({ err }, '[monitoring] Failed to initialize Azure Application Insights');
    }
  } else {
    logger.warn('[monitoring] APPLICATIONINSIGHTS_CONNECTION_STRING missing — Monitoring disabled');
  }
}

module.exports = { initMonitoring };
